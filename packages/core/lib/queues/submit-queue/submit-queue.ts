import EventEmitter from "events";

import {
  SubmitQueueStorageType,
  SubmitQueueStoreKeyType,
  SubmitQueueData,
  getSubmitQueueEvents,
  SubmitQueueDumpValueType,
  SubmitQueueOptionsType,
  RunningSubmitRequestValueType,
} from "queues";
import { FetchCommandInstance, FetchCommand } from "command";
import { FetchBuilder } from "builder";
import { getUniqueRequestId } from "../../utils/uuid.utils";

/**
 * Queue class was made to store controlled request Fetches, and firing them one-by-one per queue.
 * Generally requests should be flushed at the same time, the queue provide mechanism to fire them in the order.
 */
export class SubmitQueue<ErrorType, ClientOptions> {
  emitter = new EventEmitter();
  events = getSubmitQueueEvents(this.emitter);

  storage: SubmitQueueStorageType<ClientOptions> = new Map<SubmitQueueStoreKeyType, SubmitQueueData<ClientOptions>>();

  constructor(
    private builder: FetchBuilder<ErrorType, ClientOptions>,
    private options?: SubmitQueueOptionsType<ErrorType, ClientOptions>,
  ) {
    if (this.options?.storage) {
      this.storage = this.options.storage;
    }

    this.options?.onInitialization(this);

    // Start all pending requests that were disabled since going offline
    builder.appManager.events.onOnline(() => {
      this.flushAll();
    });
  }

  private runningRequests = new Map<string, RunningSubmitRequestValueType[]>();

  startQueue = async (queueKey: string) => {
    // Change status to running
    const queue = this.storage.get(queueKey);

    // Start the queue when its stopped
    if (queue) {
      queue.stopped = false;
      this.storage.set(queueKey, queue);
    }

    this.flush(queueKey);

    this.builder.logger.http(`Started queue`, Object.entries({ queueKey }));
  };

  /**
   * Pause request queue, but not cancel already started requests
   * @param queueKey
   */
  pauseQueue = (queueKey: string) => {
    // Change state to stopped
    const queue = this.storage.get(queueKey);

    if (queue) {
      queue.stopped = true;
      this.storage.set(queueKey, queue);

      this.builder.logger.http(`[Submit Queue] Paused queue`, Object.entries({ queueKey }));
    }
  };

  /**
   * Stop request queue and cancel all started requests - those will be treated like not started
   * @param queueKey
   */
  stopQueue = (queueKey: string) => {
    // Change state to stopped
    const queue = this.storage.get(queueKey);

    if (queue) {
      queue.stopped = true;
      this.storage.set(queueKey, queue);

      // Cancel running requests
      this.runningRequests.get(queueKey)?.forEach((request) => request.command.abort());
      this.runningRequests.set(queueKey, []);

      this.builder.logger.http(`[Submit Queue] Stopped queue`, Object.entries({ queueKey }));
    }
  };

  add = async (command: FetchCommandInstance) => {
    const { cancelable, queueKey, queued } = command;

    const initialQueue: SubmitQueueData<ClientOptions> = {
      stopped: false,
      requests: [],
    };
    const queue = this.storage.get(queueKey) || initialQueue;
    const runningRequests = this.runningRequests.get(queueKey) || [];

    // Create dump of the request to allow storing it in localStorage, AsyncStorage or any other
    // This way we don't save the Class but the instruction of the request to be done
    const queueElementDump: SubmitQueueDumpValueType<ClientOptions> = {
      timestamp: +new Date(),
      commandDump: command.dump(),
      retries: 0,
    };

    queue.requests.push(queueElementDump);
    this.storage.set(queueKey, queue);

    this.builder.logger.debug(`[Submit Queue] Adding request to queue`, [
      ...Object.entries({ queueKey }),
      ...Object.entries(queueElementDump),
    ]);

    if (queued) {
      this.builder.logger.debug(`[Submit Queue] Performing one-by-one request`, Object.entries({ queueKey }));
      // 1. One-by-one: if we setup request as one-by-one queue use queueing system
      this.flush(queueKey);
    } else {
      // 2. Only last request
      if (cancelable) {
        this.builder.logger.debug(`[Submit Queue] Performing cancelable request`, Object.entries({ queueKey }));
        // Cancel all previous requests
        runningRequests.forEach((request) => request.command.abort());
        this.runningRequests.set(queueKey, []);
        // Request will be performed in 3. step
      } else {
        this.builder.logger.debug(`[Submit Queue] Performing all-at-once request`, Object.entries({ queueKey }));
      }
      // 3. All at once
      const requestCommand = new FetchCommand(
        this.builder,
        queueElementDump.commandDump.commandOptions,
        queueElementDump.commandDump,
      ) as FetchCommandInstance;
      this.performRequest(queueKey, requestCommand, queueElementDump);
    }
  };

  performRequest = async (
    queueKey: string,
    requestCommand: FetchCommandInstance,
    queueElement: SubmitQueueDumpValueType<ClientOptions>,
    flush = false,
  ) => {
    const { cacheKey, retry, retryTime, cache } = requestCommand;
    const { client } = this.builder;

    const requestId = getUniqueRequestId(queueKey);

    this.addRunningRequest(queueKey, requestId, requestCommand);

    this.events.setLoading(queueKey, {
      isLoading: true,
      isRetry: !!retry,
    });

    this.builder.logger.http(`[Submit Queue] Start request`, Object.entries({ requestId, queueKey }));

    const response = await client(requestCommand);

    this.builder.logger.http(`[Submit Queue] Finished request`, Object.entries({ requestId, queueKey }));

    const runningRequests = this.runningRequests.get(queueKey);
    // Do not continue the request handling when it got stopped and request was unsuccessful
    // Or when the request was aborted/canceled
    const isCanceled = runningRequests && !runningRequests.find((req) => req.id === requestId);
    const queue = this.storage.get(queueKey);
    if ((!response[0] && queue?.stopped) || isCanceled) {
      if (isCanceled) {
        return this.builder.logger.error(`[Submit Queue] Request canceled`, Object.entries({ requestId, queueKey }));
      }
      return this.builder.logger.error(
        `[Submit Queue] Request failed in stopped queue submit-queue`,
        Object.entries({ requestId, queueKey }),
      );
    }

    this.builder.logger.debug(`[Submit Queue] Response send to cache from submit-queue`, [
      ...Object.entries({ requestId, queueKey }),
      ...Object.entries(response),
    ]);

    this.builder.cache.set({
      cache: cache ?? true,
      cacheKey,
      response,
      retries: queueElement.retries,
      deepEqual: requestCommand.deepEqual,
      isRefreshed: false,
    });

    // When Successful remove it from running requests
    if (!response[1]) {
      this.builder.logger.debug(
        `[Submit Queue] Clearing request from fetch-queue`,
        Object.entries({ requestId, queueKey }),
      );

      const requests = this.runningRequests.get(queueKey) || [];
      this.storage.delete(queueKey);
      this.runningRequests.set(
        queueKey,
        requests.filter((req) => req.id !== requestId),
      );
    }
    // Perform retry once request is failed
    else if ((typeof retry === "number" && queueElement.retries <= retry) || retry === true) {
      this.builder.logger.http(`[Submit Queue] Performing retry`, Object.entries({ requestId, queueKey }));

      setTimeout(async () => {
        await this.performRequest(queueKey, requestCommand, {
          ...queueElement,
          retries: queueElement.retries + 1,
        });
        if (flush) this.flush(queueKey);
      }, retryTime || 0);
    }
  };

  /**
   * Method used to flush the queue in one-by-one fashion
   * @param queueKey
   * @returns
   */
  flush = async (queueKey: string) => {
    const queue = this.storage.get(queueKey);
    const runningRequests = this.runningRequests.get(queueKey);
    const queueElement = queue?.requests[0];

    const isStopped = queue && queue.stopped;

    // When there are no requests to flush, when its stopped, there is running request
    // or there is no request to trigger - we don't want to perform actions
    if (!queueElement || isStopped || runningRequests?.length) {
      if (isStopped) {
        return this.builder.logger.debug(`[Submit Queue] Cannot flush stopped queue`, Object.entries({ queueKey }));
      }
      if (runningRequests?.length) {
        return this.builder.logger.debug(
          `[Submit Queue] Cannot flush when there is ongoing request`,
          Object.entries({ queueKey }),
        );
      }
      return this.builder.logger.info(`[Submit Queue] Queue is empty`, Object.entries({ queueKey }));
    }

    // 1. Start request
    const requestCommand = new FetchCommand(
      this.builder,
      queueElement.commandDump.commandOptions,
      queueElement.commandDump,
    );
    // 2. Trigger Request
    await this.performRequest(queueKey, requestCommand, queueElement, true);
    // 3. Take another task
    this.flush(queueKey);
  };

  flushAll = () => {
    this.builder.logger.debug(`Flushing all queues`);

    const keys = this.storage.keys();

    // eslint-disable-next-line no-restricted-syntax
    for (const key of keys) {
      const queueElementDump = this.storage.get(key);

      if (queueElementDump) {
        this.flush(key);
      }
    }
  };

  shift = (queueKey: string) => {
    const storedEntity = this.storage.get(queueKey);
    if (storedEntity) {
      storedEntity.requests.shift();
      this.storage.set(queueKey, storedEntity);
    }
  };

  get = (queueKey: string) => {
    const storedEntity = this.storage.get(queueKey);

    return storedEntity;
  };

  getQueue = (queueKey: string) => {
    const storedEntity = this.storage.get(queueKey);
    return storedEntity?.requests || [];
  };

  clear = () => {
    this.runningRequests.forEach((requests) => requests.forEach((request) => request.command.abort()));
    this.runningRequests.clear();
    this.storage.clear();
  };

  private addRunningRequest = (queueKey: string, id: string, command: FetchCommandInstance) => {
    const runningRequests = this.runningRequests.get(queueKey) || [];
    this.runningRequests.set(queueKey, [...runningRequests, { id, command }]);
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
