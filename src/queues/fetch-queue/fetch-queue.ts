import { Cache, isEqual } from "cache";
import { FetchMiddlewareInstance } from "middleware";
import { FetchQueueOptionsType } from "queues";
import { FetchQueueStoreKeyType, FetchQueueStoreValueType, FetchQueueValueType } from "./fetch-queue.types";
import { FETCH_QUEUE_EVENTS } from "./fetch-queue.events";
import { initialFetchQueueOptions } from "./fetch-queue.constants";

export const FetchQueueStore = new Map<FetchQueueStoreKeyType, FetchQueueStoreValueType>();

/**
 * Queue class was made to store controlled request Fetches, and firing them one-by-one per queue.
 * Generally requests should be flushed at the same time, the queue provide mechanism to fire them in the order.
 */
export class FetchQueue<T extends FetchMiddlewareInstance> {
  constructor(private requestKey: string, private cache: Cache<T>) {}

  add = async (queueElement: FetchQueueValueType, options?: FetchQueueOptionsType): Promise<void> => {
    const {
      cancelable = false,
      deepCompareFn = isEqual,
      isRefreshed = false,
      isRevalidated = false,
    } = options || initialFetchQueueOptions;

    const queueEntity = this.get();

    // Prevent to send many equal request from different sources in the same timestamp
    const isEqualTimestamp = queueEntity ? queueEntity.timestamp.getTime() !== +new Date() : true;
    const canRevalidate = isRevalidated && isEqualTimestamp;

    // If no concurrent requests found or the previous request can be canceled
    if (!queueEntity || cancelable || canRevalidate) {
      // Make sure to delete/cancel running request
      this.delete();
      queueEntity?.request?.abortController.abort();
      // Propagate the loading to all connected hooks
      FETCH_QUEUE_EVENTS.setLoading(this.requestKey, true);

      // 1. Add to queue
      FetchQueueStore.set(this.requestKey, queueElement);
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
          this.cache.set({ key: this.requestKey, response, retries: queueElement.retries, deepCompareFn, isRefreshed });
        }
      }
    }
  };

  get = (): FetchQueueValueType | undefined => {
    const storedEntity = FetchQueueStore.get(this.requestKey);

    return storedEntity;
  };

  delete = (): void => {
    FetchQueueStore.delete(this.requestKey);
  };
}
