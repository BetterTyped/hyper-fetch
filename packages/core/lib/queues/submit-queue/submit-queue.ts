import EventEmitter from "events";

import {
  SubmitQueueStorageType,
  SubmitQueueStoreKeyType,
  SubmitQueueData,
  getSubmitQueueEvents,
  SubmitQueueDumpValueType,
  SubmitQueueOptionsType,
} from "queues";
import { getCacheRequestKey } from "cache";
import { FetchBuilder } from "builder";
import { FetchCommandInstance, FetchCommand } from "command";

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
    builder.manager.events.onOnline(() => {
      this.flushAll();
    });
  }

  private runningRequests = new Map<string, FetchCommandInstance[]>();

  startQueue = async (queueKey: string) => {
    // Change status to running
    const queue = this.storage.get(queueKey);

    // Start the queue when its stopped
    if (queue) {
      queue.stopped = false;
      this.storage.set(queueKey, queue);
    }

    this.flush(queueKey);
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
      this.runningRequests.get(queueKey)?.forEach((request) => request.abort());
      this.runningRequests.set(queueKey, []);
    }
  };

  performRequest = async (
    queueKey: string,
    requestCommand: FetchCommandInstance,
    queueElement: SubmitQueueDumpValueType<ClientOptions>,
    flush = false,
  ) => {
    const requestKey = getCacheRequestKey(requestCommand);
    const { cacheKey, retry, retryTime } = requestCommand;

    this.events.setLoading(queueKey, {
      isLoading: true,
      isRetry: !!retry,
    });
    const response = await requestCommand.send();

    // Do not continue the request handling when it got stopped and request was unsuccessful
    // Or when the request was aborted/canceled
    const isCanceled = !this.runningRequests.get(queueKey)?.includes(requestCommand);
    const queue = this.storage.get(queueKey);
    if ((!response[0] && queue?.stopped) || isCanceled) return;

    this.builder.cache.set({
      cacheKey,
      requestKey,
      response,
      retries: queueElement.retries,
      deepEqual: requestCommand.deepEqual,
      isRefreshed: false,
    });

    // When Successful remove it from running requests
    if (!response[1]) {
      const requests = this.runningRequests.get(queueKey) || [];
      this.storage.delete(queueKey);
      this.runningRequests.set(
        queueKey,
        requests.filter((req) => req !== requestCommand),
      );
    }
    // Perform retry once request is failed
    else if ((typeof retry === "number" && queueElement.retries <= retry) || retry === true) {
      setTimeout(async () => {
        await this.performRequest(queueKey, requestCommand, { ...queueElement, retries: queueElement.retries + 1 });
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

    // When there are no requests to flush, when its stopped, there is running request
    // or there is no request to trigger - we don't want to perform actions
    if (!queueElement || !queue?.stopped || !queue?.requests || runningRequests?.length) return;

    // 1. Start request
    const requestCommand = new FetchCommand(
      this.builder,
      queueElement.commandDump.commandOptions,
      queueElement.commandDump,
    );
    // 2. Add single running request
    this.runningRequests.set(queueKey, [requestCommand]);
    // 3. Trigger Request
    await this.performRequest(queueKey, requestCommand, queueElement, true);
    // 4. Take another task
    this.flush(queueKey);
  };

  flushAll = () => {
    const keys = this.storage.keys();

    // eslint-disable-next-line no-restricted-syntax
    for (const key of keys) {
      const queueElementDump = this.storage.get(key);

      if (queueElementDump) {
        this.flush(key);
      }
    }
  };

  add = async (command: FetchCommandInstance) => {
    const { queueKey, queued, cancelable } = command;

    const defaultQueue: SubmitQueueData<ClientOptions> = {
      stopped: false,
      requests: [],
      queued: queued || false,
      cancelable: cancelable || false,
    };
    const queue = this.storage.get(queueKey) || defaultQueue;
    const runningRequests = this.runningRequests.get(queueKey) || [];

    // Create dump of the request to allow storing it in localStorage, AsyncStorage or any other
    // This way we don't save the Class but the instruction of the request to be done
    const queueElementDump: SubmitQueueDumpValueType<ClientOptions> = {
      timestamp: +new Date(),
      commandDump: command.dump(),
      retries: 0,
    };

    // 1. One-by-one: if we setup request as one-by-one queue use queueing system
    if (queue.queued) {
      queue.requests.push(queueElementDump);
      this.storage.set(queueKey, queue);
      this.flush(queueKey);
    } else {
      // 2. Only last request
      if (queue.cancelable) {
        // Cancel all previous requests
        runningRequests.forEach((request) => request.abort());
        this.runningRequests.set(queueKey, []);
        // Request will be performed in 3. step
      }
      // 3. All at once
      const requestCommand = new FetchCommand(
        this.builder,
        queueElementDump.commandDump.commandOptions,
        queueElementDump.commandDump,
      ) as FetchCommandInstance;
      queue.requests.push(queueElementDump);
      this.runningRequests.set(queueKey, [...runningRequests, requestCommand]);
      this.storage.set(queueKey, queue);
      this.performRequest(queueKey, requestCommand, queueElementDump);
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
    return storedEntity?.requests;
  };

  clear = () => {
    this.runningRequests.forEach((requests) => requests.forEach((request) => request.abort()));
    this.storage.clear();
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
