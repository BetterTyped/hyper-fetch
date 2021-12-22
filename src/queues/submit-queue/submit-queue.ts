import { FetchCommandInstance } from "command";
import { SubmitQueueStore } from "./submit-queue.constants";
import { SubmitQueueValueType } from "./submit-queue.types";

/**
 * Queue class was made to store controlled request submits, and firing them one-by-one per queue.
 * Generally requests should be flushed at the same time, the queue provide mechanism to fire them in the order.
 *
 * It should work like:
 *
 * => queue is sending requests [fetch1, fetch2]
 * => fetch3 got submitted
 * => it goes to the end of queue -> [fetch1, fetch2, fetch3]
 * => queue handle it one by one until all is done
 * => it can be stopped (request that's already started has to be finished)
 */
export class SubmitQueue {
  constructor(private queueName: string) {
    this.initialize();
  }

  add = <T extends FetchCommandInstance>(request: T): void => {
    const queueEntity = SubmitQueueStore.get(this.queueName);

    if (queueEntity) {
      const newQueueElement: SubmitQueueValueType = { request, retries: 0, timestamp: new Date() };
      queueEntity.add(newQueueElement);
    }
  };

  get = (): Set<SubmitQueueValueType> | undefined => {
    const storedEntity = SubmitQueueStore.get(this.queueName);

    return storedEntity;
  };

  // stop = () => {}; // freezes the queue

  delete = (value: SubmitQueueValueType): void => {
    SubmitQueueStore.get(this.queueName)?.delete(value);
  };

  initialize = (): void => {
    const storedEntity = SubmitQueueStore.get(this.queueName);
    if (!storedEntity) {
      SubmitQueueStore.set(this.queueName, new Set());
    }
  };

  destroy = (): void => {
    SubmitQueueStore.delete(this.queueName);
  };
}
