import EventEmitter from "events";

import {
  FetchQueueStoreKeyType,
  FetchQueueDumpValueType,
  getFetchQueueEvents,
  FetchQueueAddOptionsType,
  FetchQueueStorageType,
  getIsEqualTimestamp,
  RunningFetchRequestValueType,
} from "queues";
import { FetchBuilder } from "builder";
import { FetchCommandInstance, FetchCommand } from "command";
import { FetchQueueOptionsType } from "./fetch-queue.types";
import { getUniqueRequestId } from "../../utils/uuid.utils";

/**
 * Queue class was made to store controlled request Fetches, and firing them one-by-one per queue.
 * Generally requests should be flushed at the same time, the queue provide mechanism to fire them in the order.
 */
export class FetchQueue<ErrorType, ClientOptions> {
  emitter = new EventEmitter();
  events = getFetchQueueEvents(this.emitter);

  storage: FetchQueueStorageType<ClientOptions> = new Map<
    FetchQueueStoreKeyType,
    FetchQueueDumpValueType<ClientOptions>
  >();

  constructor(
    private builder: FetchBuilder<ErrorType, ClientOptions>,
    private options?: FetchQueueOptionsType<ErrorType, ClientOptions>,
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

  private runningRequests = new Map<string, RunningFetchRequestValueType>();

  add = async (command: FetchCommandInstance, options?: FetchQueueAddOptionsType) => {
    const { queueKey } = command;

    const queueEntity = this.get(queueKey);
    const timestamp = +new Date();
    const defaultPoolingTime = 3;

    // Prevent to send many equal request from different sources in the same timestamp
    // Checks if it's under or equal to threshold to eliminate basic pooling issues
    const poolingTime = this.options?.poolingTime ?? defaultPoolingTime;
    const isEqualTimestamp = getIsEqualTimestamp(timestamp, poolingTime, queueEntity?.timestamp);
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
    const { retry, retryTime, queueKey, cacheKey, cache } = commandDump;
    const { client } = this.builder;

    const requestId = getUniqueRequestId(queueKey);

    // Make sure to delete & cancel running request
    this.deleteRunningRequest(queueKey, true);

    // 1. Add to queue
    this.storage.set(queueKey, queueElement);
    // 2. Start request
    const requestCommand = new FetchCommand(this.builder, commandDump.commandOptions, commandDump);

    // When offline not perform any request
    if (!requestCommand.builder.manager.isOnline) return;

    // Additionally keep the running request to possibly abort it later
    this.runningRequests.set(queueKey, { id: requestId, command: requestCommand });

    // Propagate the loading to all connected hooks
    this.events.setLoading(queueKey, {
      isLoading: true,
      isRefreshed,
      isRevalidated,
      isRetry: !!retry,
    });

    const response = await client(requestCommand);

    const runningRequest = this.runningRequests.get(queueKey);
    // Do not continue the request handling when it got stopped and request was unsuccessful
    // Or when the request was aborted/canceled
    const isCanceled = runningRequest && runningRequest.id !== requestId;
    const failed = !!response[1];
    const canRefresh = retry === true || queueElement.retries <= (retry || 0);

    this.deleteRunningRequest(queueKey);

    if (isCanceled || (!response[0] && !requestCommand.builder.manager.isOnline)) return;

    this.builder.cache.set({
      cache: cache ?? true,
      cacheKey,
      response,
      retries: queueElement.retries,
      deepEqual: queueElement.commandDump.deepEqual,
      isRefreshed: isRefreshed || isRevalidated,
    });

    if (failed && canRefresh) {
      // Perform retry once request is failed
      setTimeout(() => {
        this.performRequest({ ...queueElement, retries: queueElement.retries + 1 });
      }, retryTime || 0);
    } else {
      this.delete(queueKey);
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

  deleteRunningRequest = (queueKey: string, cancel = false) => {
    if (cancel) {
      this.runningRequests.get(queueKey)?.command.abort();
    }
    this.runningRequests.delete(queueKey);
  };

  delete = (queueKey: string, cancel = false) => {
    if (cancel) {
      this.runningRequests.get(queueKey)?.command.abort();
    }
    this.storage.delete(queueKey);
  };

  clear = () => {
    this.runningRequests.forEach((request) => request.command.abort());
    this.runningRequests.clear();
    this.storage.clear();
  };
}
