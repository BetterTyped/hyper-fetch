import EventEmitter from "events";

import {
  FetchQueueStorageType,
  FetchQueueStoreKeyType,
  FetchQueueDumpValueType,
  getFetchQueueEvents,
  FetchQueueAddOptionsType,
} from "queues";
import { FetchBuilder } from "builder";
import { getCacheRequestKey } from "cache";
import { FetchCommandInstance, FetchCommand } from "command";

/**
 * Queue class was made to store controlled request Fetches, and firing them one-by-one per queue.
 * Generally requests should be flushed at the same time, the queue provide mechanism to fire them in the order.
 */
export class FetchQueue<ErrorType, ClientOptions> {
  emitter = new EventEmitter();
  events = getFetchQueueEvents(this.emitter);

  constructor(
    private builder: FetchBuilder<ErrorType, ClientOptions>,
    private storage: FetchQueueStorageType<ClientOptions> = new Map<
      FetchQueueStoreKeyType,
      FetchQueueDumpValueType<ClientOptions>
    >(),
  ) {
    // Start all persisting requests
    this.flushAll();
    // Start all pending requests that were disabled since going offline
    builder.manager.events.onOnline(() => {
      this.flushAll();
    });
  }

  private runningRequests = new Map<string, FetchCommandInstance>();

  add = async (command: FetchCommandInstance, options?: FetchQueueAddOptionsType) => {
    const { queueKey } = command;

    const queueEntity = this.get(queueKey);
    const timestamp = +new Date();

    // Prevent to send many equal request from different sources in the same timestamp
    const isEqualTimestamp = queueEntity?.timestamp === timestamp;
    const canRevalidate = options?.isRevalidated && !isEqualTimestamp;

    // If no concurrent requests found or the previous request can be canceled
    if (!queueEntity || command.cancelable || canRevalidate) {
      // Create dump of the request to allow storing it in localStorage, AsyncStorage or any other
      // This way we don't save the Class but the instruction of the request to be done
      const queueElementDump: FetchQueueDumpValueType<ClientOptions> = {
        isRevalidated: options?.isRevalidated || false,
        isRefreshed: options?.isRefreshed || false,
        timestamp,
        commandDump: command.dump(),
        retries: 0,
      };

      // Trigger request
      this.performRequest(queueElementDump);
    }
  };

  // Request can run for some time, once it's done, we have to check if it's the one that was initially requested
  // It can be different once the previous call was set as cancelled and removed from queue before this request got resolved
  // ----->req1------->cancel-------------->done (this response can't be saved, even if abort doesn't catch it)
  // ----------------->req2---------------->done
  performRequest = async (queueElement: FetchQueueDumpValueType<ClientOptions>) => {
    const { commandDump, isRefreshed, isRevalidated } = queueElement;
    const { retry, retryTime, queueKey, cacheKey } = commandDump;
    const requestKey = getCacheRequestKey(commandDump);

    // 1. Add to queue
    this.storage.set(queueKey, queueElement);
    // 2. Start request
    const requestCommand = new FetchCommand(this.builder, commandDump);
    // Additionally keep the running request to possibly abort it later
    this.runningRequests.set(queueKey, requestCommand);

    // Make sure to delete & cancel running request
    this.deleteRequest(queueKey, true);

    // When offline not perform any request
    if (!requestCommand.builder.manager.isOnline) return;

    // Propagate the loading to all connected hooks
    this.events.setLoading(requestKey, {
      isLoading: true,
      isRefreshed,
      isRevalidated,
      isRetry: !!retry,
    });
    const response = await requestCommand.send();

    // Do not continue the request handling when it got stopped and request was unsuccessful
    // Or when the request was aborted/canceled
    const isCanceled = this.runningRequests.get(queueKey) !== requestCommand;
    const failed = !!response[1];
    const canRefresh = (typeof retry === "number" && queueElement.retries <= retry) || retry === true;

    this.deleteRequest(queueKey);

    if (!response[0] && isCanceled && !requestCommand.builder.manager.isOnline) return;

    this.builder.cache.set({
      cacheKey,
      requestKey,
      response,
      retries: queueElement.retries,
      deepEqual: queueElement.commandDump.deepEqual,
      isRefreshed: isRefreshed || isRevalidated,
    });

    // When Successful remove it from running requests
    if (!canRefresh || !failed || isRevalidated) {
      return this.delete(queueKey);
    }
    // Perform retry once request is failed
    if (failed && canRefresh) {
      setTimeout(() => {
        this.performRequest({ ...queueElement, retries: queueElement.retries + 1 });
      }, retryTime || 0);
    }
  };

  flushAll = () => {
    const keys = this.storage.keys();

    // eslint-disable-next-line no-restricted-syntax
    for (const key of keys) {
      const queueElementDump = this.storage.get(key);

      if (queueElementDump) {
        this.performRequest(queueElementDump);
      }
    }
  };

  get = (queueKey: string) => {
    return this.storage.get(queueKey);
  };

  deleteRequest = (queueKey: string, cancelable = false) => {
    if (cancelable) {
      this.runningRequests.get(queueKey)?.abort();
    }
    this.runningRequests.delete(queueKey);
  };

  delete = (queueKey: string, cancelable = false) => {
    if (cancelable) {
      this.runningRequests.get(queueKey)?.abort();
    }
    this.storage.delete(queueKey);
  };

  clear = () => {
    this.runningRequests.forEach((request) => request.abort());
    this.storage.clear();
  };
}
