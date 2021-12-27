import EventEmitter from "events";

import { FetchQueueStorageType, FetchQueueStoreKeyType, FetchQueueDumpValueType, getFetchQueueEvents } from "queues";
import { FetchBuilder } from "builder";
import { FetchCommandInstance, FetchCommand } from "command";
import { FetchQueueValueType } from "./fetch-queue.types";

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

  add = async (queueElement: FetchQueueValueType) => {
    const { endpointKey } = queueElement;

    const queueEntity = this.get(endpointKey);

    // Prevent to send many equal request from different sources in the same timestamp
    const isEqualTimestamp = queueEntity?.timestamp === +queueElement.timestamp;
    const canRevalidate = queueElement.isRevalidated && !isEqualTimestamp;

    // If no concurrent requests found or the previous request can be canceled
    if (!queueEntity || queueElement.request.cancelable || canRevalidate) {
      // Create dump of the request to allow storing it in localStorage, AsyncStorage or any other
      // This way we don't save the Class but the instruction of the request to be done
      const queueElementDump = {
        ...queueElement,
        timestamp: +queueElement.timestamp,
        request: queueElement.request.dump(),
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
    const { endpointKey, requestKey } = queueElement;
    const { request, isRefreshed, isRevalidated } = queueElement;
    const { retry, retryTime } = request;

    // 1. Add to queue
    this.storage.set(endpointKey, queueElement);
    // 2. Start request
    const requestCommand = new FetchCommand(this.builder, request);
    // Additionally keep the running request to possibly abort it later
    this.runningRequests.set(endpointKey, requestCommand);

    // Make sure to delete & cancel running request
    this.deleteRequest(endpointKey, true);

    // When offline not perform any request
    if (!requestCommand.builder.manager.isOnline) return;

    // Propagate the loading to all connected hooks
    this.events.setLoading(endpointKey, {
      isLoading: true,
      isRefreshed,
      isRevalidated,
      isRetry: !!retry,
    });
    const response = await requestCommand.send();

    // Do not continue the request handling when it got stopped and request was unsuccessful
    // Or when the request was aborted/canceled
    const isCanceled = this.runningRequests.get(endpointKey) !== requestCommand;
    const failed = !!response[1];
    const canRefresh = (typeof retry === "number" && queueElement.retries <= retry) || retry === true;

    this.deleteRequest(endpointKey);

    if (!response[0] && isCanceled && !requestCommand.builder.manager.isOnline) return;

    this.builder.cache.set({
      endpointKey,
      requestKey,
      response,
      retries: queueElement.retries,
      deepEqual: queueElement.request.deepEqual,
      isRefreshed: isRefreshed || isRevalidated,
    });

    // When Successful remove it from running requests
    if (!canRefresh || !failed || isRevalidated) {
      this.delete(endpointKey);
    }
    // Perform retry once request is failed
    else if (failed && canRefresh) {
      setTimeout(async () => {
        await this.performRequest({ ...queueElement, retries: queueElement.retries + 1 });
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

  get = (endpointKey: string) => {
    return this.storage.get(endpointKey);
  };

  deleteRequest = (endpointKey: string, cancelable = false) => {
    if (cancelable) {
      this.runningRequests.get(endpointKey)?.abort();
    }
    this.runningRequests.delete(endpointKey);
  };

  delete = (endpointKey: string, cancelable = false) => {
    if (cancelable) {
      this.runningRequests.get(endpointKey)?.abort();
    }
    this.storage.delete(endpointKey);
  };

  clear = () => {
    this.runningRequests.forEach((request) => request.abort());
    this.storage.clear();
  };
}
