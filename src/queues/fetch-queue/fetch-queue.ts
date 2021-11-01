import { Cache } from "cache";
import { FetchMiddlewareInstance } from "middleware";
import { FetchQueueStoreKeyType, FetchQueueStoreValueType, FetchQueueValueType } from "./fetch-queue.types";

export const FetchQueueStore = new Map<FetchQueueStoreKeyType, FetchQueueStoreValueType>();

/**
 * Queue class was made to store controlled request Fetches, and firing them one-by-one per queue.
 * Generally requests should be flushed at the same time, the queue provide mechanism to fire them in the order.
 */
export class FetchQueue<T extends FetchMiddlewareInstance> {
  constructor(private requestKey: string, private cache: Cache<T>) {}

  add = async (queueElement: FetchQueueValueType): Promise<void> => {
    const queueEntity = this.get();

    // If no concurrent requests found
    if (!queueEntity) {
      // 1. Add to queue
      FetchQueueStore.set(this.requestKey, queueElement);
      // 2. Start request
      const response = await queueElement.request.fetch();
      // 3. Remove from queue
      this.delete();
      // 4. Save response to cache
      this.cache.set(this.requestKey, response, queueElement.retries);
    }
  };

  get = (): FetchQueueValueType | undefined => {
    const storedEntity = FetchQueueStore.get(this.requestKey);

    return storedEntity;
  };

  delete = (): void => {
    FetchQueueStore.delete(this.requestKey);
  };

  destroy = (): void => {
    FetchQueueStore.clear();
  };
}
