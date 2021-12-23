import { isEqual } from "cache";
import { FetchBuilder } from "builder";
import { FetchCommandInstance, FetchCommand } from "command";
import { FetchQueueOptionsType, FetchQueueStorageType, FetchQueueStoreKeyType, FetchQueueDumpValueType } from "queues";
import { FetchQueueValueType } from "./fetch-queue.types";
import { FETCH_QUEUE_EVENTS } from "./fetch-queue.events";
import { initialFetchQueueOptions } from "./fetch-queue.constants";

/**
 * Queue class was made to store controlled request Fetches, and firing them one-by-one per queue.
 * Generally requests should be flushed at the same time, the queue provide mechanism to fire them in the order.
 */
export class FetchQueue<ErrorType, ClientOptions> {
  constructor(
    private builder: FetchBuilder<ErrorType, ClientOptions>,
    private storage: FetchQueueStorageType = new Map<FetchQueueStoreKeyType, FetchQueueDumpValueType>(),
  ) {}

  private runningRequests = new Map<string, FetchCommandInstance>();

  add = async (
    endpointKey: string,
    requestKey: string,
    queueElement: FetchQueueValueType,
    options?: FetchQueueOptionsType,
  ) => {
    const {
      cancelable = false,
      deepCompareFn = isEqual,
      isRetry = false,
      isRefreshed = false,
      isRevalidated = false,
    } = options || initialFetchQueueOptions;

    const queueEntity = this.get(endpointKey);

    // Prevent to send many equal request from different sources in the same timestamp
    const isEqualTimestamp = queueEntity?.timestamp === +queueElement.timestamp;
    const canRevalidate = isRevalidated && !isEqualTimestamp;

    // If no concurrent requests found or the previous request can be canceled
    if (!queueEntity || cancelable || canRevalidate) {
      // Make sure to delete & cancel running request
      this.deleteRequest(endpointKey, true);
      // Propagate the loading to all connected hooks
      FETCH_QUEUE_EVENTS.setLoading(endpointKey, {
        isLoading: true,
        isRefreshed,
        isRevalidated,
        isRetry,
      });

      // Create dump of the request to allow storing it in localStorage, AsyncStorage or any other
      // This way we don't save the Class but the instruction of the request to be done
      const queueElementDump = {
        ...queueElement,
        timestamp: +queueElement.timestamp,
        request: queueElement.request.dump(),
      };

      const { request } = queueElement;

      // 1. Add to queue
      this.storage.set(endpointKey, queueElementDump);
      // 2. Start request
      const requestCommand = new FetchCommand(this.builder.getBuilderConfig(), request) as FetchCommandInstance;
      // Additionally keep the running request to abort it later
      this.runningRequests.set(endpointKey, requestCommand);
      const response = await requestCommand.send();

      // Request can run for some time, once it's done, we have to check if it's the one that was initially requested
      // It can be different once the previous call was set as cancelled and removed from queue before this request got resolved
      // ----->req1------->cancel-------------->done (this response can't be saved, even if abort doesn't catch it)
      // ----------------->req2---------------->done
      const currentEntity = this.storage.get(endpointKey);
      // 3. Check if not canceled, to perform data save
      if (currentEntity === queueElementDump) {
        // 4. Remove from queue
        this.deleteRequest(endpointKey);
        // 5. Save response to cache
        if (response) {
          this.builder.cache.set({
            endpointKey,
            requestKey,
            response,
            retries: queueElement.retries,
            deepCompareFn,
            isRefreshed,
          });
        }
      }
    }
  };

  get = (endpointKey: string): FetchQueueDumpValueType | undefined => {
    const storedEntity = this.storage.get(endpointKey);

    return storedEntity;
  };

  deleteRequest = (endpointKey: string, cancelable = false) => {
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
