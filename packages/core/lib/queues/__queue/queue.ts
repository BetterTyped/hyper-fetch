import EventEmitter from "events";

import {
  QueueStorageType,
  QueueStoreKeyType,
  QueueData,
  RunningRequestValueType,
  QueueOptionsType,
  getQueueEvents,
} from "queues";
import { LoggerMethodsType } from "managers";
import { FetchCommandInstance } from "command";
import { FetchBuilder } from "builder";

/**
 * Queue class was made to store controlled request Fetches, and firing them one-by-one per queue.
 * Generally requests should be flushed at the same time, the queue provide mechanism to fire them in the order.
 */
export class Queue<ErrorType, HttpOptions> {
  public emitter = new EventEmitter();
  public events = getQueueEvents<HttpOptions>(this.emitter);
  public logger: LoggerMethodsType;
  private requestCount = new Map<string, number>();
  private storage: QueueStorageType<HttpOptions> = new Map<QueueStoreKeyType, QueueData<HttpOptions>>();
  private runningRequests = new Map<string, RunningRequestValueType[]>();

  constructor(
    name: string,
    public builder: FetchBuilder<ErrorType, HttpOptions>,
    public options?: QueueOptionsType<ErrorType, HttpOptions>,
  ) {
    this.logger = this.builder.loggerManager.init(name);

    if (this.options?.storage) {
      this.storage = this.options.storage;
    }

    this.options?.onInitialization?.(this);
  }

  __startQueue = async (queueKey: string) => {
    // Change status to running
    const queue = await this.get(queueKey);

    // Start the queue when its stopped
    if (queue) {
      queue.stopped = false;
      this.set(queueKey, queue);
    }

    this.logger.http(`Started queue`, { queueKey });
    this.events.setQueueStatus(queueKey, queue);
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
    this.events.setQueueStatus(queueKey, queue);
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
    this.events.setQueueStatus(queueKey, queue);
  };

  getIsCanceledRequest = (queueKey: string, requestId: string) => {
    const runningRequests = this.getRunningRequests(queueKey);
    // Do not continue the request handling when it got stopped and request was unsuccessful
    // Or when the request was aborted/canceled
    return runningRequests && !runningRequests.find((req) => req.requestId === requestId);
  };

  // Storage
  get = async <Command = unknown>(queueKey: string) => {
    const initialQueue = { requests: [], stopped: false } as QueueData<HttpOptions, Command>;
    const storedEntity = (await this.storage.get(queueKey)) as QueueData<HttpOptions, Command>;

    return storedEntity || initialQueue;
  };

  getKeys = () => {
    return this.storage.keys();
  };

  set = async <Command = unknown>(queueKey: string, queue: QueueData<HttpOptions, Command>) => {
    await this.storage.set(queueKey, queue);

    this.options?.onUpdateStorage?.(queueKey, queue);

    // Emit Queue Changes
    this.events.setQueueChanged(queueKey, queue);

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
    this.options?.onDeleteFromStorage?.(queueKey, queue);

    // Emit Queue Changes
    this.events.setQueueChanged(queueKey, queue);

    return queue;
  };

  clearQueue = async (queueKey: string) => {
    const queue = await this.get(queueKey);
    const newQueue = { requests: [], stopped: queue.stopped };
    await this.storage.set(queueKey, newQueue);
    this.options?.onDeleteFromStorage?.(queueKey, newQueue);

    // Emit Queue Changes
    this.events.setQueueChanged(queueKey, queue);

    return queue;
  };

  clear = async () => {
    this.runningRequests.forEach((requests) => requests.forEach((request) => request.command.abort()));
    this.runningRequests.clear();
    await this.storage.clear();
    this.options?.onClearStorage?.(this);
  };

  // Count
  getRequestCount = (queueKey: string) => {
    return this.requestCount.get(queueKey) || 0;
  };

  incrementRequestCount = (queueKey: string) => {
    const count = this.requestCount.get(queueKey) || 0;
    this.requestCount.set(queueKey, count + 1);
  };

  getOngoingRequests = (queueKey: string) => {
    return this.runningRequests.get(queueKey) || [];
  };

  // Running Requests
  getAllRunningRequest = () => {
    return Array.from(this.runningRequests.values()).flat();
  };

  getRunningRequest = (queueKey: string, id: string) => {
    const runningRequests = this.runningRequests.get(queueKey) || [];
    return runningRequests.find((req) => req.requestId === id);
  };

  getRunningRequests = (queueKey: string) => {
    return this.runningRequests.get(queueKey) || [];
  };

  addRunningRequest = (queueKey: string, requestId: string, command: FetchCommandInstance) => {
    const runningRequests = this.runningRequests.get(queueKey) || [];
    runningRequests.push({ requestId, command });
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
      runningRequests.filter((req) => req.requestId !== id),
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
