import { FetchBuilder } from "builder";
import { FetchCommandInstance, FetchCommand } from "command";
import { SubmitQueueStorageType, SubmitQueueStoreKeyType, SubmitQueueData, SubmitQueueDumpValueType } from "queues";
import { SubmitQueueValueType } from "./submit-queue.types";
import { initialSubmitQueue } from "./submit-queue.constants";

/**
 * Queue class was made to store controlled request Fetches, and firing them one-by-one per queue.
 * Generally requests should be flushed at the same time, the queue provide mechanism to fire them in the order.
 */
export class SubmitQueue<ErrorType, ClientOptions> {
  constructor(
    private builder: FetchBuilder<ErrorType, ClientOptions>,
    private storage: SubmitQueueStorageType = new Map<SubmitQueueStoreKeyType, SubmitQueueData>(),
  ) {}

  private runningRequests = new Map<string, FetchCommandInstance[]>();

  startQueue = async (queueKey: string) => {
    // Change status to running
    const queue = this.storage.get(queueKey);

    // Start the queue when its stopped
    if (queue) {
      queue.stopped = false;
      this.storage.set(queueKey, queue);
    }

    this.flush(queueKey);
  };

  pauseQueue = (queueKey: string) => {
    // Change state to stopped
    const queue = this.storage.get(queueKey) || initialSubmitQueue;
    queue.stopped = true;
    this.storage.set(queueKey, queue);

    // Cancel running requests
    this.runningRequests.get(queueKey)?.forEach((request) => request.abort());
  };

  performRequest = async (
    queueKey: string,
    requestCommand: FetchCommandInstance,
    queueElement: SubmitQueueDumpValueType,
  ) => {
    const runningRequests = this.runningRequests.get(queueKey);
    const { endpointKey, requestKey } = queueElement;
    const response = await requestCommand.send();

    const queue = this.storage.get(queueKey);

    // Do not continue the request handling when it got stopped and request was unsuccessful
    // Or when the request was aborted/canceled
    const isCanceled = !runningRequests?.includes(requestCommand);
    if ((!response[0] && queue?.stopped) || isCanceled) return;

    if (response) {
      this.builder.cache.set({
        endpointKey,
        requestKey,
        response,
        retries: 0,
        deepEqual: queueElement.request.deepEqual,
        isRefreshed: false,
      });
    }

    // Remove it from running requests
    this.storage.delete(queueKey);
    this.runningRequests.set(queueKey, []);
  };

  /**
   * Method used to flush the queue in one-by-one fashion
   * @param queueKey
   * @returns
   */
  flush = async (queueKey: string) => {
    const queue = this.storage.get(queueKey);
    const runningRequests = this.runningRequests.get(queueKey);
    const queueElement = queue?.requests[0];

    // When there are no requests to flush, when its stopped, there is running request
    // or there is no request to trigger - we don't want to perform actions
    if (!queueElement || !queue?.stopped || !queue?.requests || runningRequests?.length) return;

    // 1. Start request
    const requestCommand = new FetchCommand(
      this.builder.getBuilderConfig(),
      queueElement.request,
    ) as FetchCommandInstance;
    // 2. Add running request
    this.runningRequests.set(queueKey, [requestCommand]);
    // 3. Trigger Request
    await this.performRequest(queueKey, requestCommand, queueElement);
    // 4. Take another task
    this.flush(queueKey);
  };

  add = async (queueKey: string, queueElement: SubmitQueueValueType) => {
    const queue = this.storage.get(queueKey) || initialSubmitQueue;

    // Create dump of the request to allow storing it in localStorage, AsyncStorage or any other
    // This way we don't save the Class but the instruction of the request to be done
    const queueElementDump = {
      ...queueElement,
      timestamp: +queueElement.timestamp,
      request: queueElement.request.dump(),
    };

    // 1. One-by-one: if we setup request as one-by-one queue use queueing system
    if (queueElement.request.queue) {
      queue.requests.push(queueElementDump);
      this.storage.set(queueKey, queue);
      this.flush(queueKey);
      return;
    }
    // 2. Only last request
    if (queueElement.request.cancelable) {
      // Cancel all previous requests
      this.runningRequests.get(queueKey)?.forEach((request) => request.abort());
      // Request will be performed in 3. step
    }
    // 3. All at once
    if (queueElement.request.queue) {
      const requestCommand = new FetchCommand(
        this.builder.getBuilderConfig(),
        queueElement.request,
      ) as FetchCommandInstance;
      queue.requests.push(queueElementDump);
      this.storage.set(queueKey, queue);
      this.performRequest(queueKey, requestCommand, queueElementDump);
    }

    // const { cancelable = false, deepCompareFn = isEqual, isRetry = false } = options || initialSubmitQueueOptions;
    // const queueEntity = this.get(endpointKey);
    // always start the queue when adding element to make sure it is handled
  };

  shift = (queueKey: string) => {
    const storedEntity = this.storage.get(queueKey);
    if (storedEntity) {
      storedEntity.requests.shift();
      this.storage.set(queueKey, storedEntity);
    }
  };

  get = (queueKey: string): SubmitQueueData | undefined => {
    const storedEntity = this.storage.get(queueKey);

    return storedEntity;
  };

  getQueue = (queueKey: string) => {
    return this.runningRequests.get(queueKey);
  };

  clear = () => {
    this.runningRequests.forEach((requests) => requests.forEach((request) => request.abort()));
    this.storage.clear();
  };
}

// Three types of requests queues
// 1. All at once
// request -> running -> retries or data
// request -> running -> retries or data
// request -> running -> retries or data
// 2. One by one
// request -> running -> retries or data
// request -> idle --------------------> running -> retries or data
// request -> idle -----------------------------------------------> running -> retries or data
// 3. Only last request running at the same time - cancel approach
// request -> running -> canceled
// request -> running -> canceled
// request -> running -> retries or data // the last request got send

// If retries fails we remove request from queue + emit the event for it to handle that case

// Queue needs to keep the state for each running queue - besides of the request itself we need to keep the status - is it stopped or not

// On the constructor mounting we need to start flushing the queue as soon as we can - we need to do it for persistance reasons
// as we may have some not handled requests from previous session - this way we need to check the storage
// if any queue is stopped and resume it as fast as we can
