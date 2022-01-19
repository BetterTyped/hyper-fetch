import EventEmitter from "events";

import {
  FetchQueueStoreKeyType,
  FetchQueueDumpValueType,
  getFetchQueueEvents,
  FetchQueueAddOptionsType,
  FetchQueueStorageType,
  getIsEqualTimestamp,
  RunningFetchRequestValueType,
  canRetryRequest,
} from "queues";
import { FetchBuilder } from "builder";
import { getUniqueRequestId } from "utils";
import { LoggerMethodsType } from "managers";
import { FetchCommandInstance, FetchCommand } from "command";
import { FetchQueueOptionsType } from "./fetch-queue.types";

/**
 * Queue class was made to store controlled request Fetches, and firing them one-by-one per queue.
 * Generally requests should be flushed at the same time, the queue provide mechanism to fire them in the order.
 */
export class FetchQueue<ErrorType, ClientOptions> {
  emitter = new EventEmitter();
  events = getFetchQueueEvents(this.emitter);

  logger: LoggerMethodsType;

  storage: FetchQueueStorageType<ClientOptions> = new Map<
    FetchQueueStoreKeyType,
    FetchQueueDumpValueType<ClientOptions>
  >();

  constructor(
    private builder: FetchBuilder<ErrorType, ClientOptions>,
    private options?: FetchQueueOptionsType<ErrorType, ClientOptions>,
  ) {
    this.logger = this.builder.loggerManager.init("Fetch Queue");

    if (this.options?.storage) {
      this.storage = this.options.storage;
    }

    this.options?.onInitialization(this);

    // Start all pending requests that were disabled since going offline
    builder.appManager.events.onOnline(() => {
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

    this.logger.debug(`Adding request to fetch-queue`, {
      queueKey,
      queueEntity,
      cancelable: command.cancelable,
      canRevalidate,
    });

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

      this.logger.debug(`Request set to trigger`, { queueKey, queueElementDump });

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
    if (!requestCommand.builder.appManager.isOnline) {
      return this.logger.error("Cannot perform fetch-queue request, app is offline");
    }

    // Additionally keep the running request to possibly abort it later
    this.runningRequests.set(queueKey, { id: requestId, command: requestCommand });

    // Propagate the loading to all connected hooks
    this.events.setLoading(queueKey, {
      isLoading: true,
      isRefreshed,
      isRevalidated,
      isRetry: !!retry,
    });

    this.logger.http(`Start request`, { requestId, queueKey });

    const response = await client(requestCommand);

    this.logger.http(`Finished request`, { requestId, queueKey, ...response });

    const runningRequest = this.runningRequests.get(queueKey);
    // Do not continue the request handling when it got stopped and request was unsuccessful
    // Or when the request was aborted/canceled
    const isCanceled = runningRequest && runningRequest.id !== requestId;
    const failed = !!response[1];

    this.deleteRunningRequest(queueKey);

    if (isCanceled || (!response[0] && !requestCommand.builder.appManager.isOnline)) {
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
      deepEqual: queueElement.commandDump.deepEqual,
      isRefreshed: isRefreshed || isRevalidated,
    });

    if (failed && canRetryRequest(queueElement.retries, retry)) {
      this.logger.http(`Performing retry`, {
        requestId,
        queueKey,
        queueElement,
        retry,
        retryTime,
      });

      // Perform retry once request is failed
      setTimeout(() => {
        this.performRequest({ ...queueElement, retries: queueElement.retries + 1 });
      }, retryTime || 0);
    } else {
      this.logger.debug(`Clearing request from fetch-queue`, {
        requestId,
        queueKey,
        response,
        queueElement,
      });

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
