import { QueueDumpValueType, QueueOptionsType, Queue, canRetryRequest } from "queues";
import { FetchBuilder } from "builder";
import { getUniqueRequestId } from "utils";
import { FetchCommandInstance, FetchCommand } from "command";

/**
 * Queue class was made to store controlled request Fetches, and firing them one-by-one per queue.
 * Generally requests should be flushed at the same time, the queue provide mechanism to fire them in the order if needed.
 */
export class SubmitQueue<ErrorType, HttpOptions> extends Queue<ErrorType, HttpOptions> {
  constructor(builder: FetchBuilder<ErrorType, HttpOptions>, options?: QueueOptionsType<ErrorType, HttpOptions>) {
    super("Submit Queue", builder, options);
  }

  startQueue = (queueKey: string) => {
    this.__startQueue(queueKey);
    this.flush(queueKey);
  };

  add = async (command: FetchCommandInstance) => {
    const { cancelable, queueKey, concurrent, disabled } = command;
    const requestId = getUniqueRequestId(queueKey);

    if (disabled) {
      return this.logger.warning(`Request disabled, exiting...`);
    }

    // Create dump of the request to allow storing it in localStorage, AsyncStorage or any other
    // This way we don't save the Class but the instruction of the request to be done
    const queueElementDump: QueueDumpValueType<HttpOptions> = {
      requestId,
      timestamp: +new Date(),
      commandDump: command.dump(),
      retries: 0,
    };

    // Add to cache
    const queue = await this.get(queueKey);
    queue.requests.push(queueElementDump);
    this.set(queueKey, queue);

    this.logger.debug(`Adding request to queue`, { queueKey, queueElementDump, queue });

    if (!concurrent) {
      this.logger.info(`Performing one-by-one request`, { queueKey });
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
        this.logger.info(`Performing cancelable request`, { queueKey });
        // Cancel all previous requests
        this.clearRunningRequests(queueKey);
        // Request will be performed in 3. step
        this.performRequest(requestCommand, queueElementDump);
      }
      // 3. All at once
      else {
        this.logger.info(`Performing all-at-once request`, { queueKey });
        this.performRequest(requestCommand, queueElementDump);
      }
    }
    return requestId;
  };

  performRequest = async (requestCommand: FetchCommandInstance, queueElement: QueueDumpValueType<HttpOptions>) => {
    const { cacheKey, retry, retryTime, cache, queueKey } = requestCommand;
    const { client } = this.builder;
    const { requestId } = queueElement;

    this.addRunningRequest(queueKey, requestId, requestCommand);

    this.events.setLoading(queueKey, {
      isLoading: true,
      isRetry: !!retry,
    });

    this.logger.info(`Start request`, { requestId, queueKey });

    this.incrementRequestCount(cacheKey);
    const response = await client(requestCommand, requestId);

    const runningRequests = this.getRunningRequests(queueKey);
    // Do not continue the request handling when it got stopped and request was unsuccessful
    // Or when the request was aborted/canceled
    const isCanceled = runningRequests && !runningRequests.find((req) => req.requestId === requestId);
    const queue = await this.get(queueKey);
    if ((!response[0] && queue?.stopped) || isCanceled) {
      this.events.setLoading(queueKey, { isLoading: false, isRetry: false });
      if (isCanceled) {
        return this.logger.error(`Request canceled`, { requestId, queueKey });
      }
      return this.logger.error(`Request failed in stopped queue`, {
        requestId,
        queueKey,
      });
    }

    this.logger.debug(`Response send to cache`, {
      requestId,
      queueKey,
      response,
    });

    this.builder.cache.set({
      cache: cache ?? true,
      cacheKey,
      response,
      retries: queueElement.retries,
      deepEqual: requestCommand.deepEqual,
      isRefreshed: this.getRequestCount(cacheKey) > 1,
    });

    this.deleteRunningRequest(queueKey, requestId);

    // When Successful remove it from running requests
    if (!response[1]) {
      this.logger.debug(`Clearing request from queue`, { requestId, queueKey });

      this.deleteRequest(queueKey, requestId);
    }
    // Perform retry once request is failed
    else if (canRetryRequest(queueElement.retries, retry)) {
      this.logger.warning(`Performing retry`, { requestId, queueKey });

      setTimeout(async () => {
        await this.performRequest(requestCommand, {
          ...queueElement,
          retries: queueElement.retries + 1,
        });
      }, retryTime || 0);
    } else {
      this.logger.error(`Cannot perform request, removing from queue`, {
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
    if (isStopped) {
      return this.logger.debug(`Cannot flush stopped queue`, { queueKey });
    }
    if (runningRequests?.length) {
      return this.logger.debug(`Cannot flush when there is ongoing request`, { queueKey });
    }
    if (!queueElement) {
      return this.logger.info(`Queue is empty`, { queueKey });
    }

    // 1. Start request
    const requestCommand = new FetchCommand(
      this.builder,
      queueElement.commandDump.commandOptions,
      queueElement.commandDump.values,
    );
    // 2. Trigger Request
    await this.performRequest(requestCommand, queueElement);
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

// Three types of requests queues
// 1. All at once
// request -> running -> retries or data
// request -> running -> retries or data
// request -> running -> retries or data
// 2. One by one
// request -> running -> retries or data
// request -> idle --------------------> running -> retries or data
// request -> idle -----------------------------------------------> running -> retries or data
// 3. Only last request running at the same time - cancel approach
// request -> running -> canceled
// request -> running -> canceled
// request -> running -> retries or data // the last request got send

// If retries fails we remove request from queue + emit the event for it to handle that case

// Queue needs to keep the state for each running queue - besides of the request itself we need to keep the status - is it stopped or not

// On the constructor mounting we need to start flushing the queue as soon as we can - we need to do it for persistance reasons
// as we may have some not handled requests from previous session - this way we need to check the storage
// if any queue is stopped and resume it as fast as we can
