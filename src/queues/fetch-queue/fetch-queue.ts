import { Cache, isEqual } from "cache";
import { FetchMiddlewareInstance } from "middleware";
import { FetchQueueOptionsType } from "queues";
import { FetchQueueValueType } from "./fetch-queue.types";
import { FETCH_QUEUE_EVENTS } from "./fetch-queue.events";
import { FetchQueueStore, initialFetchQueueOptions } from "./fetch-queue.constants";

/**
 * Queue class was made to store controlled request Fetches, and firing them one-by-one per queue.
 * Generally requests should be flushed at the same time, the queue provide mechanism to fire them in the order.
 */
export class FetchQueue<T extends FetchMiddlewareInstance> {
  constructor(private endpointKey: string, private cache: Cache<T>) {}

  add = async (queueElement: FetchQueueValueType, options?: FetchQueueOptionsType): Promise<void> => {
    const {
      cancelable = false,
      deepCompareFn = isEqual,
      isRetry = false,
      isRefreshed = false,
      isRevalidated = false,
    } = options || initialFetchQueueOptions;

    const queueEntity = this.get();

    // Prevent to send many equal request from different sources in the same timestamp
    const isEqualTimestamp = queueEntity?.timestamp.getTime() === +queueElement.timestamp;
    const canRevalidate = isRevalidated && !isEqualTimestamp;

    // If no concurrent requests found or the previous request can be canceled
    if (!queueEntity || cancelable || canRevalidate) {
      // Make sure to delete & cancel running request
      this.delete(true);
      // Propagate the loading to all connected hooks
      FETCH_QUEUE_EVENTS.setLoading(this.endpointKey, {
        isLoading: true,
        isRefreshed,
        isRevalidated,
        isRetry,
      });

      // 1. Add to queue
      FetchQueueStore.set(this.endpointKey, queueElement);
      // 2. Start request
      const response = await queueElement.request.send();

      // Request can run for some time, once it's done, we have to check if it's the one that was initially requested
      // It can be different once the previous call was set as cancelled and removed from queue before this request got resolved
      // ----->req1------->cancel-------------->done (this response can't be saved)
      // ----------------->req2---------------->done
      const currentEntity = this.get();
      // 3. Check if not canceled, to perform data save
      if (currentEntity === queueElement) {
        // 4. Remove from queue
        this.delete();
        // 5. Save response to cache
        if (response) {
          this.cache.set({
            key: this.endpointKey,
            response,
            retries: queueElement.retries,
            deepCompareFn,
            isRefreshed,
          });
        }
      }
    }
  };

  get = (): FetchQueueValueType | undefined => {
    const storedEntity = FetchQueueStore.get(this.endpointKey);

    return storedEntity;
  };

  delete = (cancelable = false): void => {
    const queueEntity = this.get();
    if (queueEntity) {
      if (cancelable) {
        queueEntity.request.abort();
      }
      FetchQueueStore.delete(this.endpointKey);
    }
  };
}
