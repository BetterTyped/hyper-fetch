import { FetchMiddlewareInstance } from "middleware/fetch.middleware.types";
import { QueueStoreKeyType, QueueStoreValueType, QueueValueType } from "./queue.types";

const QueueStore = new Map<QueueStoreKeyType, QueueStoreValueType>();

/**
 * Queue class was made to store controlled request calls, and firing them one-by-one per queue.
 * Generally requests should be flushed at the same time, the queue provide mechanism to fire them in the order.
 */
export class Queue {
  constructor(private queueName: string) {
    this.initialize();
  }

  add = <T extends FetchMiddlewareInstance>(request: T): void => {
    const queueEntity = QueueStore.get(this.queueName);

    if (queueEntity) {
      const newQueueElement: QueueValueType = { request };
      queueEntity.add(newQueueElement);
    }
  };

  get = (): Set<QueueValueType> | undefined => {
    const storedEntity = QueueStore.get(this.queueName);

    return storedEntity;
  };

  delete = (value: QueueValueType): void => {
    QueueStore.get(this.queueName)?.delete(value);
  };

  initialize = (): void => {
    const storedEntity = QueueStore.get(this.queueName);
    if (!storedEntity) {
      QueueStore.set(this.queueName, new Set());
    }
  };

  destroy = (): void => {
    QueueStore.delete(this.queueName);
  };
}
