import EventEmitter from "events";

import {
  QueueStorageType,
  QueueStoreKeyType,
  QueueData,
  RunningRequestValueType,
  QueueOptionsType,
  getQueueEvents,
  canRetryRequest,
  QueueDumpValueType,
  getRequestType,
  QueueRequestType,
} from "queue";
import { LoggerMethodsType } from "managers";
import { FetchCommandInstance, FetchCommand } from "command";
import { FetchBuilder } from "builder";
import { getUniqueRequestId } from "utils";

// Todo problem - implement leader tab system to execute requests from single tab
// This will help to fight the possible duplication of the requests when using persistance

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
    public builder: FetchBuilder<ErrorType, HttpOptions>,
    public options?: QueueOptionsType<ErrorType, HttpOptions>,
  ) {
    this.logger = this.builder.loggerManager.init("Queue");

    if (this.options?.storage) {
      this.storage = this.options.storage;
    }

    this.options?.onInitialization?.(this);
  }

  //
  //
  // Sub Queues Handlers
  //
  //

  startQueue = async (queueKey: string) => {
    // Change status to running
    const queue = await this.getQueue(queueKey);

    // Start the queue when its stopped
    if (queue) {
      queue.stopped = false;
      this.setQueue(queueKey, queue);
      this.flushQueue(queueKey);
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
    const queue = await this.getQueue(queueKey);

    if (queue) {
      queue.stopped = true;
      this.setQueue(queueKey, queue);

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
    const queue = await this.getQueue(queueKey);

    if (queue) {
      queue.stopped = true;
      this.setQueue(queueKey, queue);

      // Cancel running requests
      this.clearRunningRequests(queueKey);

      this.logger.http(`Stopped queue`, { queueKey });
    }
    this.events.setQueueStatus(queueKey, queue);
  };

  /**
   * Method used to flush the queue in one-by-one fashion
   * @param queueKey
   * @returns
   */
  flushQueue = async (queueKey: string) => {
    const queue = await this.getQueue(queueKey);
    const runningRequests = this.getRunningRequests(queueKey);
    const queueElement = queue?.requests[0];

    const isStopped = queue && queue.stopped;
    const isOffline = !this.builder.appManager.isOnline;

    // When there are no requests to flush, when its stopped, there is running request
    // or there is no request to trigger - we don't want to perform actions
    if (isStopped) {
      return this.logger.debug(`Cannot flush stopped queue`, { queueKey });
    }
    if (isOffline) {
      return this.logger.debug(`Cannot flush queue when app is offline`, { queueKey });
    }
    if (runningRequests?.length) {
      return this.logger.debug(`Cannot flush when there is ongoing request`, { queueKey });
    }
    if (!queueElement) {
      return this.logger.info(`Queue is empty`, { queueKey });
    }

    // 1. Start request
    const requestCommand = new FetchCommand(
      this.builder,
      queueElement.commandDump.commandOptions,
      queueElement.commandDump.values,
    );
    // 2. Trigger Request
    await this.performRequest(requestCommand, queueElement);
    // 3. Take another task
    this.flushQueue(queueKey);
  };

  getIsCanceledRequest = (queueKey: string, requestId: string) => {
    const runningRequests = this.getRunningRequests(queueKey);
    // Do not continue the request handling when it got stopped and request was unsuccessful
    // Or when the request was aborted/canceled
    return runningRequests && !runningRequests.find((req) => req.requestId === requestId);
  };

  getIsActiveQueue = async (queueKey: string) => {
    const queue = await this.getQueue(queueKey);
    // Do not continue the request handling when it got stopped and request was unsuccessful
    // Or when the request was aborted/canceled
    return !!queue.requests.length;
  };

  // Storage
  getQueue = async <Command = unknown>(queueKey: string) => {
    const initialQueue = { requests: [], stopped: false } as QueueData<HttpOptions, Command>;
    const storedEntity = (await this.storage.get(queueKey)) as QueueData<HttpOptions, Command>;

    return storedEntity || initialQueue;
  };

  getQueuesKeys = () => {
    return this.storage.keys();
  };

  setQueue = async <Command = unknown>(queueKey: string, queue: QueueData<HttpOptions, Command>) => {
    await this.storage.set(queueKey, queue);

    this.options?.onUpdateStorage?.(queueKey, queue);

    // Emit Queue Changes
    this.events.setQueueChanged(queueKey, queue);

    return queue;
  };

  addQueueElement = async (queueKey: string, queueElementDump: QueueDumpValueType<HttpOptions>) => {
    /**
     * Todo
     * 1. Async synchronization of the multiple tabs open with the add/get events
     * 2. Figure out way to remove possible race condition when using the async data storages
     * We can have local dump of the queue and sync it from it
     */

    const queue = await this.getQueue(queueKey);
    queue.requests.push(queueElementDump);
    await this.setQueue(queueKey, queue);
  };

  /**
   * Clear requests from queue cache
   * @param queueKey
   * @param requestId
   * @returns
   */
  deleteQueueRequest = async (queueKey: string, requestId: string) => {
    const queue = await this.getQueue(queueKey);
    queue.requests = queue.requests.filter((req) => req.requestId !== requestId);
    await this.storage.set(queueKey, queue);
    this.options?.onDeleteFromStorage?.(queueKey, queue);

    // Emit Queue Changes
    this.events.setQueueChanged(queueKey, queue);

    return queue;
  };

  clearQueue = async (queueKey: string) => {
    const queue = await this.getQueue(queueKey);
    const newQueue = { requests: [], stopped: queue.stopped };
    await this.storage.set(queueKey, newQueue);
    this.options?.onDeleteFromStorage?.(queueKey, newQueue);

    // Emit Queue Changes
    this.events.setQueueChanged(queueKey, queue);

    return queue;
  };

  //
  //
  // Requests Handlers
  //
  //

  // Count
  getQueueRequestCount = (queueKey: string) => {
    return this.requestCount.get(queueKey) || 0;
  };

  incrementQueueRequestCount = (queueKey: string) => {
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
  deleteRunningRequest = (queueKey: string, requestId: string) => {
    const runningRequests = this.runningRequests.get(queueKey) || [];
    this.runningRequests.set(
      queueKey,
      runningRequests.filter((req) => req.requestId !== requestId),
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

  //
  //
  // Instance Handlers
  //
  //

  flush = async () => {
    this.logger.debug(`Flushing all queues`);

    const keys = await this.getQueuesKeys();

    // eslint-disable-next-line no-restricted-syntax
    for await (const key of keys) {
      const queueElementDump = await this.getQueue(key);

      if (queueElementDump) {
        this.flushQueue(key);
      }
    }
  };

  add = async (command: FetchCommandInstance) => {
    const { queueKey } = command;

    const requestId = getUniqueRequestId(queueKey);

    // Create dump of the request to allow storing it in localStorage, AsyncStorage or any other
    // This way we don't save the Class but the instruction of the request to be done
    const queueElementDump: QueueDumpValueType<HttpOptions> = {
      requestId,
      timestamp: +new Date(),
      commandDump: command.dump(),
      retries: 0,
    };

    this.logger.debug(`Adding request to queue`, { queueKey, queueElementDump });

    // Todo fix when adding requests to the queue at the same time, those will not be deduplicated
    // because of the async read of the data from storage - we have to keep local synchronous snapshot of queues
    const queue = await this.getQueue(queueKey);
    const hasRunningRequests = !!queue.requests.length;
    const requestType = getRequestType(command, hasRunningRequests);

    switch (requestType) {
      case QueueRequestType.oneByOne: {
        await this.addQueueElement(queueKey, queueElementDump);
        this.logger.info(`Performing one-by-one request`, { requestId, queueKey, queueElementDump, requestType });
        // 1. One-by-one: if we setup request as one-by-one queue use queueing system
        this.flushQueue(queueKey);
        return requestId;
      }
      case QueueRequestType.previousCanceled: {
        await this.addQueueElement(queueKey, queueElementDump);
        this.logger.info(`Performing cancelable request`, { requestId, queueKey, queueElementDump, requestType });
        // Cancel all previous on-going requests
        this.clearRunningRequests(queueKey);
        this.performRequest(command, queueElementDump);
        return requestId;
      }
      case QueueRequestType.deduplicated: {
        this.logger.info(`Deduplicated request`, { requestId, queueKey, queueElementDump, requestType });
        // Return the running requestId to fullfil the events
        return queue.requests[0].requestId;
      }
      default: {
        await this.addQueueElement(queueKey, queueElementDump);
        this.logger.info(`Performing all-at-once request`, { requestId, queueKey, queueElementDump, requestType });
        this.performRequest(command, queueElementDump);
        return requestId;
      }
    }
  };

  clear = async () => {
    this.runningRequests.forEach((requests) => requests.forEach((request) => request.command.abort()));
    this.runningRequests.clear();
    await this.storage.clear();
    this.options?.onClearStorage?.(this);
  };

  /**
   * Request can run for some time, once it's done, we have to check if it's successful or if it was aborted
   * It can be different once the previous call was set as cancelled and removed from queue before this request got resolved
   *
   * @param command
   * @param queueElement
   * @returns
   */
  performRequest = async (command: FetchCommandInstance, queueElement: QueueDumpValueType<HttpOptions>) => {
    const { commandDump, requestId } = queueElement;
    const { retry, retryTime, queueKey, cacheKey, cache: useCache } = commandDump.values;
    const { client, commandManager, cache, appManager } = this.builder;

    const shouldUseCache = useCache ?? true;
    const canRetry = canRetryRequest(queueElement.retries, retry);
    const isOffline = !appManager.isOnline;

    this.logger.debug(`Request ready to trigger`, { queueKey, queueElement });

    // When offline not perform any request
    if (isOffline) {
      return this.logger.error("Cannot perform queue request, app is offline");
    }

    // Additionally keep the running request to possibly abort it later
    this.addRunningRequest(queueKey, requestId, command);

    // Propagate the loading to all connected hooks
    this.events.setLoading(queueKey, {
      isLoading: true,
      isRetry: !!queueElement.retries,
      isOffline,
    });

    this.logger.http(`Start request`, { requestId, queueKey });

    // Trigger Request
    this.incrementQueueRequestCount(queueKey);
    const response = await client(command, requestId);

    // Do not continue the request handling when it got stopped and request was unsuccessful
    // Or when the request was aborted/canceled
    const isOfflineOnResponse = !appManager.isOnline;
    const isCanceled = this.getIsCanceledRequest(queueKey, requestId);
    // Request is failed when there is the error message or the status is 0 or equal/bigger than 400

    const isFailed = !!response[1] || !response[2] || response[2] >= 400;

    this.logger.debug(`Response emitting`, {
      requestId,
      queueKey,
      response,
    });

    const queue = await this.getQueue(queueKey);

    const requestDetails = {
      isFailed,
      isCanceled,
      isOffline: isOfflineOnResponse,
      isRefreshed: this.getQueueRequestCount(queueKey) > 1,
      isStopped: queue.stopped,
      retries: queueElement.retries,
      timestamp: new Date(),
    };

    // Global response emitter to handle command execution
    commandManager.events.emitResponse(cacheKey, response, requestDetails);
    // Emitter for getting response by requestId
    commandManager.events.emitResponseById(requestId, response, requestDetails);
    // Cache event to emit the data inside and store it
    cache.set(cacheKey, response, requestDetails, shouldUseCache);

    this.deleteRunningRequest(queueKey, requestId);

    if (isCanceled) {
      return this.logger.error(`Request canceled`, { requestId, queueKey });
    }
    if (isFailed && isOfflineOnResponse) {
      return this.logger.error(`Request failed because of going offline`, response);
    }
    if (!isFailed) {
      await this.deleteQueueRequest(queueKey, requestId);
      return this.logger.debug(`Clearing request from queue`, { requestId, queueKey });
    }
    if (isFailed && canRetry) {
      this.logger.warning(`Performing retry`, {
        requestId,
        queueKey,
        queueElement,
        retry,
        retryTime,
        canRetry,
      });

      // Perform retry once request is failed
      setTimeout(async () => {
        await this.performRequest(command, {
          ...queueElement,
          retries: queueElement.retries + 1,
        });
      }, retryTime || 0);
    } else {
      this.logger.debug(`Cannot perform request, removing from queue`, {
        requestId,
        queueKey,
        response,
        queueElement,
        canRetry,
      });

      await this.deleteQueueRequest(queueKey, requestId);
    }
  };
}
