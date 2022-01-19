import EventEmitter from "events";

import { QueueDumpValueType, getFetchQueueEvents, canRetryRequest, QueueOptionsType, Queue } from "queues";
import { FetchBuilder } from "builder";
import { getUniqueRequestId } from "utils";
import { FetchCommandInstance, FetchCommand } from "command";

/**
 * Queue class was made to store controlled request Fetches, and firing them one-by-one per queue.
 * Generally requests should be flushed at the same time, the queue provide mechanism to fire them in the order.
 */
export class FetchQueue<ErrorType, ClientOptions> extends Queue<ErrorType, ClientOptions> {
  emitter = new EventEmitter();
  events = getFetchQueueEvents(this.emitter);

  constructor(builder: FetchBuilder<ErrorType, ClientOptions>, options?: QueueOptionsType<ErrorType, ClientOptions>) {
    super("Fetch Queue", builder, options);
  }

  add = async (command: FetchCommandInstance) => {
    const { cancelable, queueKey, concurrent } = command;
    const requestId = getUniqueRequestId(queueKey);

    // Create dump of the request to allow storing it in localStorage, AsyncStorage or any other
    // This way we don't save the Class but the instruction of the request to be done
    const queueElementDump: QueueDumpValueType<ClientOptions> = {
      requestId,
      timestamp: +new Date(),
      commandDump: command.dump(),
      retries: 0,
    };

    // Add to cache
    const queue = await this.get(queueKey);
    queue.requests.push(queueElementDump);
    await this.set(queueKey, queue);

    this.logger.debug(`Adding request to queue`, { queueKey, queueElementDump });

    if (!concurrent) {
      this.logger.info(`Performing one-by-one request`, { requestId, queueKey, queueElementDump });
      // 1. One-by-one: if we setup request as one-by-one queue use queueing system
      this.flush(queueKey);
    } else {
      const requestCommand = new FetchCommand(
        this.builder,
        queueElementDump.commandDump.commandOptions,
        queueElementDump.commandDump.values,
      ) as FetchCommandInstance;
      // 2. Only last request
      if (cancelable) {
        this.logger.info(`Performing cancelable request`, { requestId, queueKey, queueElementDump });
        // Cancel all previous requests
        this.clearRunningRequests(queueKey);
        // Request will be performed in 3. step
        this.performRequest(requestCommand, queueElementDump);
      }
      // 3. All at once
      else if (!this.getRunningRequests(queueKey)?.length) {
        this.logger.info(`Performing all-at-once request`, { requestId, queueKey, queueElementDump });
        this.performRequest(requestCommand, queueElementDump);
      } else {
        this.logger.info(`Deduplicated all-at-once request`, { requestId, queueKey, queueElementDump });
        this.deleteRequest(queueKey, requestId);
      }
    }
  };

  // Request can run for some time, once it's done, we have to check if it's the one that was initially requested
  // It can be different once the previous call was set as cancelled and removed from queue before this request got resolved
  // ----->req1------->cancel-------------->done (this response can't be saved, even if abort doesn't catch it)
  // ----------------->req2---------------->done
  performRequest = async (command: FetchCommandInstance, queueElement: QueueDumpValueType<ClientOptions>) => {
    const { commandDump, requestId } = queueElement;
    const { retry, retryTime, queueKey, cacheKey, cache } = commandDump.values;
    const { client } = this.builder;

    this.logger.debug(`Adding request to fetch-queue`, {
      queueKey,
      cancelable: command.cancelable,
    });

    // Create dump of the request to allow storing it in localStorage, AsyncStorage or any other
    // This way we don't save the Class but the instruction of the request to be done

    this.logger.debug(`Request set to trigger`, { queueKey, queueElement });

    // When offline not perform any request
    if (!command.builder.appManager.isOnline) {
      return this.logger.error("Cannot perform fetch-queue request, app is offline");
    }

    // Additionally keep the running request to possibly abort it later
    this.addRunningRequest(queueKey, requestId, command);

    // Propagate the loading to all connected hooks
    this.events.setLoading(queueKey, {
      isLoading: true,
      isRetry: !!retry,
    });

    this.logger.http(`Start request`, { requestId, queueKey });

    // Trigger Request
    this.incrementRequestCount(cacheKey);
    const response = await client(command);

    this.logger.http(`Finished request`, { requestId, queueKey, response });

    // Do not continue the request handling when it got stopped and request was unsuccessful
    // Or when the request was aborted/canceled
    const isCanceled = this.getIsCanceledRequest(queueKey, requestId);
    const failed = !!response[1];
    const isOffline = !command.builder.appManager.isOnline;

    this.deleteRunningRequest(queueKey, requestId);

    if (isCanceled || (failed && isOffline)) {
      if (isCanceled) {
        return this.logger.error(`Request canceled`, { requestId, queueKey });
      }
      return this.logger.error(`Request failed because of going offline`, response);
    }

    this.logger.debug(`Response send to cache from fetch-queue`, {
      requestId,
      queueKey,
      response,
    });

    this.builder.cache.set({
      cache: cache ?? true,
      cacheKey,
      response,
      retries: queueElement.retries,
      deepEqual: queueElement.commandDump.values.deepEqual,
      isRefreshed: this.getRequestCount(cacheKey) > 1,
    });

    if (failed && canRetryRequest(queueElement.retries, retry)) {
      this.logger.warning(`Performing retry`, {
        requestId,
        queueKey,
        queueElement,
        retry,
        retryTime,
      });

      // Perform retry once request is failed
      setTimeout(async () => {
        await this.performRequest(command, {
          ...queueElement,
          retries: queueElement.retries + 1,
        });
      }, retryTime || 0);
    } else {
      this.logger.debug(`Clearing request from fetch-queue`, {
        requestId,
        queueKey,
        response,
        queueElement,
      });

      this.deleteRequest(queueKey, requestId);
    }
  };

  /**
   * Method used to flush the queue in one-by-one fashion
   * @param queueKey
   * @returns
   */
  flush = async (queueKey: string) => {
    const queue = await this.get(queueKey);
    const runningRequests = this.getRunningRequests(queueKey);
    const queueElement = queue?.requests[0];

    const isStopped = queue && queue.stopped;

    // When there are no requests to flush, when its stopped, there is running request
    // or there is no request to trigger - we don't want to perform actions
    if (!queueElement || isStopped || runningRequests?.length) {
      if (isStopped) {
        return this.logger.debug(`Cannot flush stopped queue`, { queueKey });
      }
      if (runningRequests?.length) {
        return this.logger.debug(`Cannot flush when there is ongoing request`, { queueKey });
      }
      return this.logger.info(`Queue is empty`, { queueKey });
    }

    // 1. Start request
    const command = new FetchCommand(
      this.builder,
      queueElement.commandDump.commandOptions,
      queueElement.commandDump.values,
    );
    // 2. Trigger Request
    await this.performRequest(command, queueElement);
    // 3. Take another task
    this.flush(queueKey);
  };

  flushAll = async () => {
    this.logger.debug(`Flushing all queues`);

    const keys = await this.getKeys();

    // eslint-disable-next-line no-restricted-syntax
    for await (const key of keys) {
      const queueElementDump = await this.get(key);

      if (queueElementDump) {
        this.flush(key);
      }
    }
  };
}
