import { QueueStorageType, QueueStoreKeyType, QueueData, RunningRequestValueType, QueueOptionsType } from "queues";
import { LoggerMethodsType } from "managers";
import { FetchCommandInstance } from "command";
import { FetchBuilder } from "builder";

/**
 * Queue class was made to store controlled request Fetches, and firing them one-by-one per queue.
 * Generally requests should be flushed at the same time, the queue provide mechanism to fire them in the order.
 */
export class Queue<ErrorType, ClientOptions> {
  public logger: LoggerMethodsType;
  public requestCount = new Map<string, number>();
  private storage: QueueStorageType<ClientOptions> = new Map<QueueStoreKeyType, QueueData<ClientOptions>>();

  private runningRequests = new Map<string, RunningRequestValueType[]>();

  constructor(
    name: string,
    public builder: FetchBuilder<ErrorType, ClientOptions>,
    public options?: QueueOptionsType<ErrorType, ClientOptions>,
  ) {
    this.logger = this.builder.loggerManager.init(name);

    if (this.options?.storage) {
      this.storage = this.options.storage;
    }

    this.options?.onInitialization(this);
  }

  startQueue = async (queueKey: string, flush: (queueKey: string) => void) => {
    // Change status to running
    const queue = await this.get(queueKey);

    // Start the queue when its stopped
    if (queue) {
      queue.stopped = false;
      this.set(queueKey, queue);
    }

    flush(queueKey);

    this.logger.http(`Started queue`, { queueKey });
  };

  /**
   * Pause request queue, but not cancel already started requests
   * @param queueKey
   */
  pauseQueue = async (queueKey: string) => {
    // Change state to stopped
    const queue = await this.get(queueKey);

    if (queue) {
      queue.stopped = true;
      this.set(queueKey, queue);

      this.logger.http(`Paused queue`, { queueKey });
    }
  };

  /**
   * Stop request queue and cancel all started requests - those will be treated like not started
   * @param queueKey
   */
  stopQueue = async (queueKey: string) => {
    // Change state to stopped
    const queue = await this.get(queueKey);

    if (queue) {
      queue.stopped = true;
      this.set(queueKey, queue);

      // Cancel running requests
      this.clearRunningRequests(queueKey);

      this.logger.http(`Stopped queue`, { queueKey });
    }
  };

  getIsCanceledRequest = (queueKey: string, requestId: string) => {
    const runningRequests = this.getRunningRequests(queueKey);
    // Do not continue the request handling when it got stopped and request was unsuccessful
    // Or when the request was aborted/canceled
    return runningRequests && !runningRequests.find((req) => req.id === requestId);
  };

  // Storage
  get = async (queueKey: string) => {
    const initialQueue = { requests: [], stopped: false };
    const storedEntity = await this.storage.get(queueKey);

    return storedEntity || initialQueue;
  };

  getKeys = () => {
    return this.storage.keys();
  };

  set = async (queueKey: string, queue: QueueData<ClientOptions>) => {
    await this.storage.set(queueKey, queue);

    this.options?.onUpdateStorage(queueKey, queue);

    return queue;
  };

  /**
   * Clear requests from queue cache
   * @param queueKey
   * @param requestId
   * @returns
   */
  deleteRequest = async (queueKey: string, requestId: string) => {
    const queue = await this.get(queueKey);
    queue.requests = queue.requests.filter((req) => req.requestId !== requestId);
    await this.storage.set(queueKey, queue);
    this.options?.onDeleteFromStorage(queueKey, queue);

    return queue;
  };

  clearQueue = async (queueKey: string) => {
    const queue = await this.get(queueKey);
    const newQueue = { requests: [], stopped: queue.stopped };
    await this.storage.set(queueKey, newQueue);
    this.options?.onDeleteFromStorage(queueKey, newQueue);

    return queue;
  };

  clear = async () => {
    this.runningRequests.forEach((requests) => requests.forEach((request) => request.command.abort()));
    this.runningRequests.clear();
    await this.storage.clear();
    this.options?.onClearStorage(this);
  };

  // Count
  getRequestCount = (cacheKey: string) => {
    return this.requestCount.get(cacheKey) || 0;
  };

  incrementRequestCount = (cacheKey: string) => {
    const count = this.requestCount.get(cacheKey) || 0;
    this.requestCount.set(cacheKey, count + 1);
  };

  // Running Requests
  getAllRunningRequest = () => {
    return Array.from(this.runningRequests.values()).flat();
  };

  getRunningRequest = (queueKey: string, id: string) => {
    const runningRequests = this.runningRequests.get(queueKey) || [];
    return runningRequests.find((req) => req.id === id);
  };

  getRunningRequests = (queueKey: string) => {
    return this.runningRequests.get(queueKey) || [];
  };

  addRunningRequest = (queueKey: string, id: string, command: FetchCommandInstance) => {
    const runningRequests = this.runningRequests.get(queueKey) || [];
    runningRequests.push({ id, command });
    this.runningRequests.set(queueKey, runningRequests);
  };

  /**
   * Clear all started requests, but do NOT clear it from queue and do NOT cancel them
   * @param queueKey
   * @param id
   */
  deleteRunningRequest = (queueKey: string, id: string) => {
    const runningRequests = this.runningRequests.get(queueKey) || [];
    this.runningRequests.set(
      queueKey,
      runningRequests.filter((req) => req.id !== id),
    );
  };

  /**
   * Clear and cancel all started requests, but do NOT clear it from queue cache
   * @param queueKey
   */
  clearRunningRequests = (queueKey: string) => {
    this.runningRequests.get(queueKey)?.forEach((request) => {
      request.command.abort();
    });

    this.runningRequests.set(queueKey, []);
  };
}
