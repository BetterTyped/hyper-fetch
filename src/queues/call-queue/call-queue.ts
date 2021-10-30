import { FetchMiddlewareInstance } from "middleware";
import { CallQueueStore } from "./call-queue.constants";
import { CallQueueValueType } from "./call-queue.types";

/**
 * Queue class was made to store controlled request calls, and firing them one-by-one per queue.
 * Generally requests should be flushed at the same time, the queue provide mechanism to fire them in the order.
 *
 * It should work like:
 *
 * => fetch3 got called
 * => it goes to the end of queue -> [fetch1, fetch2, fetch3]
 * => queue handle it one by one until all is done and goes idle
 * => it can be stopped (request that started has to be finished)
 */
export class CallQueue {
  constructor(private queueName: string) {
    this.initialize();
  }

  add = <T extends FetchMiddlewareInstance>(request: T): void => {
    const queueEntity = CallQueueStore.get(this.queueName);

    if (queueEntity) {
      const newQueueElement: CallQueueValueType = { request, retries: 0, timestamp: new Date() };
      queueEntity.add(newQueueElement);
    }
  };

  get = (): Set<CallQueueValueType> | undefined => {
    const storedEntity = CallQueueStore.get(this.queueName);

    return storedEntity;
  };

  stop = () => {}; // freezes the queue

  delete = (value: CallQueueValueType): void => {
    CallQueueStore.get(this.queueName)?.delete(value);
  };

  initialize = (): void => {
    const storedEntity = CallQueueStore.get(this.queueName);
    if (!storedEntity) {
      CallQueueStore.set(this.queueName, new Set());
    }
  };

  destroy = (): void => {
    CallQueueStore.delete(this.queueName);
  };
}
