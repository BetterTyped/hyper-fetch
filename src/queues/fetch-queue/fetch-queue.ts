import { FetchMiddlewareInstance } from "middleware";
import {
  FetchQueueStoreKeyType,
  FetchQueueStoreValueType,
  FetchQueueValueType,
} from "./fetch-queue.types";

export const FetchQueueStore = new Map<FetchQueueStoreKeyType, FetchQueueStoreValueType>();

/**
 * Queue class was made to store controlled request Fetchs, and firing them one-by-one per queue.
 * Generally requests should be flushed at the same time, the queue provide mechanism to fire them in the order.
 */
export class FetchQueue {
  constructor(private queueName: string) {
    this.initialize();
  }

  add = <T extends FetchMiddlewareInstance>(request: T): void => {
    const queueEntity = FetchQueueStore.get(this.queueName);

    if (queueEntity) {
      const newQueueElement: FetchQueueValueType = { request, retries: 0, timestamp: new Date() };
      queueEntity.add(newQueueElement);
    }
  };

  get = (): Set<FetchQueueValueType> | undefined => {
    const storedEntity = FetchQueueStore.get(this.queueName);

    return storedEntity;
  };

  delete = (value: FetchQueueValueType): void => {
    FetchQueueStore.get(this.queueName)?.delete(value);
  };

  initialize = (): void => {
    const storedEntity = FetchQueueStore.get(this.queueName);
    if (!storedEntity) {
      FetchQueueStore.set(this.queueName, new Set());
    }
  };

  destroy = (): void => {
    FetchQueueStore.delete(this.queueName);
  };
}
