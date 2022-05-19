import EventEmitter from "events";

import {
  DispatcherStorageType,
  DispatcherData,
  RunningRequestValueType,
  DispatcherOptionsType,
  getDispatcherEvents,
  canRetryRequest,
  DispatcherDumpValueType,
  getRequestType,
  DispatcherRequestType,
} from "dispatcher";
import { LoggerMethodsType } from "managers";
import { FetchCommandInstance, FetchCommand } from "command";
import { FetchBuilder } from "builder";
import { getUniqueRequestId } from "utils";
import { isFailedRequest } from "./dispatcher.utils";

/**
 * Dispatcher class was made to store controlled request Fetches, and firing them all-at-once or one-by-one in command queue.
 * Generally requests should be flushed at the same time, the queue provide mechanism to fire them in the order.
 */
export class Dispatcher<ErrorType, HttpOptions> {
  public emitter = new EventEmitter();
  public events = getDispatcherEvents<HttpOptions>(this.emitter);
  public logger: LoggerMethodsType;

  private requestCount = new Map<string, number>();
  private runningRequests = new Map<string, RunningRequestValueType[]>();
  private storage: DispatcherStorageType<HttpOptions> = new Map<string, DispatcherData<HttpOptions>>();

  constructor(
    public builder: FetchBuilder<ErrorType, HttpOptions>,
    public options?: DispatcherOptionsType<ErrorType, HttpOptions>,
  ) {
    this.logger = this.builder.loggerManager.init("Queue");

    if (this.options?.storage) {
      this.storage = this.options.storage;
    }

    this.options?.onInitialization?.(this);
  }

  // ********************
  // ********************
  // Queue
  // ********************
  // ********************

  /**
   * Start request handling by queueKey
   */
  start = (queueKey: string) => {
    // Change status to running
    const queue = this.getQueue(queueKey);

    // Start the queue when its stopped
    queue.stopped = false;
    this.setQueue(queueKey, queue);
    this.flushQueue(queueKey);
    this.events.setQueueStatus(queueKey, queue);

    this.logger.http(`Started queue`, { queueKey });
  };

  /**
   * Pause request queue, but not cancel already started requests
   */
  pause = (queueKey: string) => {
    // Change state to stopped
    const queue = this.getQueue(queueKey);

    queue.stopped = true;
    this.setQueue(queueKey, queue);
    this.events.setQueueStatus(queueKey, queue);

    this.logger.http(`Paused queue`, { queueKey });
  };

  /**
   * Stop request queue and cancel all started requests - those will be treated like not started
   */
  stop = (queueKey: string) => {
    // Change state to stopped
    const queue = this.getQueue(queueKey);

    queue.stopped = true;
    this.setQueue(queueKey, queue);

    // Cancel running requests
    this.cancelRunningRequests(queueKey);
    this.events.setQueueStatus(queueKey, queue);

    this.logger.http(`Stopped queue`, { queueKey });
  };

  /**
   * Return all
   */
  getQueuesKeys = () => {
    return this.storage.keys();
  };

  /**
   * Return queue state object
   */
  getQueue = <Command extends FetchCommandInstance = FetchCommandInstance>(queueKey: string) => {
    const initialQueueState = { requests: [], stopped: false } as DispatcherData<HttpOptions, Command>;
    const storedEntity = this.storage.get(queueKey) as DispatcherData<HttpOptions, Command>;

    return storedEntity || initialQueueState;
  };

  /**
   * Get value of the active queue status based on the stopped status
   */
  getIsActiveQueue = (queueKey: string) => {
    const queue = this.getQueue(queueKey);
    const hasAvailableRequests = queue.requests.some((req) => !req.stopped);
    const isRunningQueue = !queue.stopped;
    return hasAvailableRequests && isRunningQueue;
  };

  /**
   * Add new element to storage
   */
  addQueueElement = <Command extends FetchCommandInstance = FetchCommandInstance>(
    queueKey: string,
    dispatcherDump: DispatcherDumpValueType<HttpOptions, Command>,
  ) => {
    const queue = this.getQueue(queueKey);
    queue.requests.push(dispatcherDump);
    this.setQueue(queueKey, queue);
  };

  /**
   * Set new queue storage value
   */
  setQueue = <Command extends FetchCommandInstance = FetchCommandInstance>(
    queueKey: string,
    queue: DispatcherData<HttpOptions, Command>,
  ) => {
    this.storage.set(queueKey, queue);

    // Emit Queue Changes
    this.options?.onUpdateStorage?.(queueKey, queue);
    this.events.setQueueChanged(queueKey, queue);

    return queue;
  };

  /**
   * Clear requests from queue cache
   */
  clearQueue = (queueKey: string) => {
    const queue = this.getQueue(queueKey);
    const newQueue = { requests: [], stopped: queue.stopped };
    this.storage.set(queueKey, newQueue);

    // Emit Queue Changes
    this.options?.onDeleteFromStorage?.(queueKey, newQueue);
    this.events.setQueueChanged(queueKey, queue);

    return queue;
  };

  /**
   * Method used to flush the queue requests
   */
  flushQueue = async (queueKey: string) => {
    const queue = this.getQueue(queueKey);
    const runningRequests = this.getRunningRequests(queueKey);
    const queueElement = queue.requests.find((request) => !request.stopped);

    const isStopped = queue && queue.stopped;
    const isOffline = !this.builder.appManager.isOnline;
    const isQueued = !queueElement?.commandDump.concurrent;
    const isOngoing = runningRequests.length;

    // When there are no requests to flush, when its stopped, there is running request
    // or there is no request to trigger - we don't want to perform actions
    if (isStopped) {
      return this.logger.debug(`Cannot flush stopped queue`, { queueKey });
    }
    if (isOffline) {
      return this.logger.debug(`Cannot flush queue when app is offline`, { queueKey });
    }
    if (!queueElement) {
      return this.logger.info(`Queue is empty`, { queueKey });
    }
    if (!isQueued) {
      queue.requests.forEach((element) => {
        if (!this.hasRunningRequest(queueKey, element.requestId)) {
          this.performRequest(element);
        }
      });
      return this.logger.info(`Flushing all-at-once`, { queueKey });
    }
    if (isOngoing) {
      return this.logger.debug(`Cannot flush when there is ongoing request`, { queueKey });
    }
    this.logger.info(`Flushing one-by-one`, { queueKey });
    await this.performRequest(queueElement);
    this.flushQueue(queueKey);
  };

  /**
   * Flush all available requests from all queues
   */
  flush = async () => {
    this.logger.debug(`Flushing all queues`);

    const keys = this.getQueuesKeys();

    // eslint-disable-next-line no-restricted-syntax
    for (const key of keys) {
      const storageElement = this.getQueue(key);

      if (storageElement) {
        this.flushQueue(key);
      }
    }
  };

  /**
   * Clear all running requests and storage
   */
  clear = () => {
    this.runningRequests.forEach((requests) => requests.forEach((request) => request.command.abort()));
    this.runningRequests.clear();
    this.storage.clear();
    this.options?.onClearStorage?.(this);
  };

  // ********************
  // ********************
  // Requests
  // ********************
  // ********************

  /**
   * Start particular request
   */
  startRequest = (queueKey: string, requestId: string) => {
    // Change status to running
    const queue = this.getQueue(queueKey);
    const request = queue.requests.find((element) => element.requestId === requestId);

    // Start the queue when its stopped
    if (request) {
      request.stopped = false;
      this.setQueue(queueKey, queue);
      this.flushQueue(queueKey);
      this.logger.http(`Started request`, { queueKey, requestId });
      this.events.setQueueStatus(queueKey, queue);
    } else {
      this.logger.error(`Cannot start request`, { queueKey, requestId });
    }
  };

  /**
   * Stop particular request
   */
  stopRequest = (queueKey: string, requestId: string) => {
    // Change state to stopped
    const queue = this.getQueue(queueKey);
    const request = queue.requests.find((element) => element.requestId === requestId);

    if (request) {
      request.stopped = true;
      this.setQueue(queueKey, queue);

      this.logger.http(`Stopped request`, { queueKey, requestId });
    }

    // Cancel running requests
    this.cancelRunningRequest(queueKey, requestId);

    this.events.setQueueStatus(queueKey, queue);
  };

  /**
   * Get currently running requests from all queueKeys
   */
  getAllRunningRequest = () => {
    return Array.from(this.runningRequests.values()).flat();
  };

  /**
   * Get currently running requests
   */
  getRunningRequests = (queueKey: string) => {
    return this.runningRequests.get(queueKey) || [];
  };

  /**
   * Get running request by id
   */
  getRunningRequest = (queueKey: string, requestId: string) => {
    const runningRequests = this.getRunningRequests(queueKey);
    return runningRequests.find((req) => req.requestId === requestId);
  };

  /**
   * Add request to the running requests list
   */
  addRunningRequest = (queueKey: string, requestId: string, command: FetchCommandInstance) => {
    const runningRequests = this.getRunningRequests(queueKey);
    runningRequests.push({ requestId, command });
    this.runningRequests.set(queueKey, runningRequests);
  };

  /**
   * Get the value based on the currently running requests
   */
  hasRunningRequests = (queueKey: string) => {
    return !!this.getRunningRequests(queueKey).length;
  };

  /**
   * Check if request is currently processing
   */
  hasRunningRequest = (queueKey: string, requestId: string) => {
    const runningRequests = this.getRunningRequests(queueKey);
    return !!runningRequests.find((req) => req.requestId === requestId);
  };

  /**
   * Cancel all started requests, but do NOT remove it from main storage
   */
  cancelRunningRequests = (queueKey: string) => {
    this.runningRequests.get(queueKey)?.forEach((request) => {
      request.command.builder.commandManager.abortByRequestId(request.command.abortKey, request.requestId);
    });
    this.deleteRunningRequests(queueKey);
  };
  /**
   * Cancel started request, but do NOT remove it from main storage
   */
  cancelRunningRequest = (queueKey: string, requestId: string) => {
    const requests = this.getRunningRequests(queueKey).filter((request) => {
      if (request.requestId === requestId) {
        request.command.builder.commandManager.abortByRequestId(request.command.abortKey, request.requestId);
        return false;
      }
      return true;
    });

    this.runningRequests.set(queueKey, requests);
  };

  /**
   * Delete all started requests, but do NOT clear it from queue and do NOT cancel them
   */
  deleteRunningRequests = (queueKey: string) => {
    this.runningRequests.set(queueKey, []);
  };

  /**
   * Delete request by id, but do NOT clear it from queue and do NOT cancel them
   */
  deleteRunningRequest = (queueKey: string, requestId: string) => {
    const runningRequests = this.getRunningRequests(queueKey);
    this.runningRequests.set(
      queueKey,
      runningRequests.filter((req) => req.requestId !== requestId),
    );
  };

  /**
   * Get count of requests from the same queueKey
   */
  getQueueRequestCount = (queueKey: string) => {
    return this.requestCount.get(queueKey) || 0;
  };

  /**
   * Add request count to the queueKey
   */
  incrementQueueRequestCount = (queueKey: string) => {
    const count = this.requestCount.get(queueKey) || 0;
    this.requestCount.set(queueKey, count + 1);
  };

  /**
   * Create storage element from command
   */
  // eslint-disable-next-line class-methods-use-this
  createStorageElement = (command: FetchCommandInstance) => {
    const requestId = getUniqueRequestId(command.queueKey);
    const storageElement: DispatcherDumpValueType<HttpOptions> = {
      requestId,
      timestamp: +new Date(),
      commandDump: command.dump(),
      retries: 0,
      stopped: false,
    };
    return storageElement;
  };

  // ********************
  // ********************
  // Dispatching
  // ********************
  // ********************

  /**
   * Add command to the dispatcher handler
   */
  add = (command: FetchCommandInstance) => {
    const { queueKey } = command;

    // Create dump of the request to allow storing it in localStorage, AsyncStorage or any other
    // This way we don't save the Class but the instruction of the request to be done
    const storageElement = this.createStorageElement(command);
    const { requestId } = storageElement;

    this.logger.debug(`Adding request to queue`, { queueKey, storageElement });

    const queue = this.getQueue(queueKey);
    const hasRequests = !!queue.requests.length;
    const requestType = getRequestType(command, hasRequests);

    switch (requestType) {
      case DispatcherRequestType.oneByOne: {
        this.addQueueElement(queueKey, storageElement);
        this.logger.info(`Performing one-by-one request`, { requestId, queueKey, storageElement, requestType });
        // 1. One-by-one: if we setup request as one-by-one queue use queueing system
        this.flushQueue(queueKey);
        return requestId;
      }
      case DispatcherRequestType.previousCanceled: {
        this.cancelRunningRequests(queueKey);
        this.clearQueue(queueKey);
        this.addQueueElement(queueKey, storageElement);
        this.logger.info(`Performing cancelable request`, { requestId, queueKey, storageElement, requestType });
        // Cancel all previous on-going requests
        this.flushQueue(queueKey);
        return requestId;
      }
      case DispatcherRequestType.deduplicated: {
        this.logger.info(`Deduplicated request`, { requestId, queueKey, storageElement, requestType });

        // When coming back from offline we need to run the queue again
        // if (!this.hasRunningRequests(queueKey)) {
        //   this.performRequest(storageElement);
        // }
        // Return the running requestId to fullfil the events
        return queue.requests[0].requestId;
      }
      default: {
        this.addQueueElement(queueKey, storageElement);
        this.logger.info(`Performing all-at-once request`, { requestId, queueKey, storageElement, requestType });
        this.flushQueue(queueKey);
        return requestId;
      }
    }
  };

  /**
   * Delete and cancel request from the storage
   */
  delete = (queueKey: string, requestId?: string) => {
    const queue = this.getQueue(queueKey);
    queue.requests = queue.requests.filter((req) => req.requestId !== requestId);
    this.storage.set(queueKey, queue);

    // Emit Queue Changes
    this.options?.onDeleteFromStorage?.(queueKey, queue);
    this.events.setQueueChanged(queueKey, queue);

    if (!queue.requests.length) {
      this.events.setDrained(queueKey, queue);
    }

    return queue;
  };

  /**
   * Request can run for some time, once it's done, we have to check if it's successful or if it was aborted
   * It can be different once the previous call was set as cancelled and removed from queue before this request got resolved
   */
  performRequest = async (storageElement: DispatcherDumpValueType<HttpOptions>) => {
    const command = new FetchCommand(
      this.builder,
      storageElement.commandDump.commandOptions,
      storageElement.commandDump,
    );

    const { commandDump, requestId } = storageElement;
    const { retry, retryTime, queueKey, cacheKey, cache: useCache } = commandDump;
    const { client, commandManager, cache, appManager } = this.builder;

    const canRetry = canRetryRequest(storageElement.retries, retry);
    const isOffline = !appManager.isOnline;
    const isAlreadyRunning = this.hasRunningRequest(queueKey, requestId);

    this.logger.debug(`Request ready to trigger`, { queueKey, storageElement });

    // When offline not perform any request
    if (isOffline) {
      return this.logger.error("Cannot perform queue request, app is offline");
    }

    // When request with this id was triggered again
    if (isAlreadyRunning) {
      return this.logger.error("Request already running");
    }

    // Additionally keep the running request to possibly abort it later
    this.addRunningRequest(queueKey, requestId, command);

    // Propagate the loading to all connected hooks
    this.events.setLoading(queueKey, {
      isLoading: true,
      isRetry: !!storageElement.retries,
      isOffline,
    });

    this.logger.http(`Start request`, { requestId, queueKey });

    // Trigger Request
    this.incrementQueueRequestCount(queueKey);
    const response = await client(command, requestId);

    // Do not continue the request handling when it got stopped and request was unsuccessful
    // Or when the request was aborted/canceled
    const isOfflineResponseStatus = !appManager.isOnline;
    // Request is failed when there is the error message or the status is 0 or equal/bigger than 400
    const isFailed = isFailedRequest(response);
    // If there is no running request with this id, it means it was cancelled and removed
    const isCanceled = !this.hasRunningRequest(queueKey, requestId);

    // Remove running request, must be called after isCancelled
    this.deleteRunningRequest(queueKey, requestId);

    this.logger.debug(`Response emitting`, {
      requestId,
      queueKey,
      response,
    });

    const queue = this.getQueue(queueKey);

    const requestDetails = {
      isFailed,
      isCanceled,
      isOffline: isOfflineResponseStatus,
      isRefreshed: this.getQueueRequestCount(queueKey) > 1,
      isStopped: queue.stopped,
      retries: storageElement.retries,
      timestamp: new Date(),
    };

    // Global response emitter to handle command execution
    commandManager.events.emitResponse(queueKey, response, requestDetails);
    // Emitter for getting response by requestId
    commandManager.events.emitResponseById(requestId, response, requestDetails);
    // Cache event to emit the data inside and store it
    cache.set(cacheKey, response, requestDetails, useCache);

    if (isCanceled) {
      // do not remove cancelled request as it may be manually paused
      return this.logger.error(`Request canceled`, { requestId, queueKey });
    }
    if (isFailed && isOfflineResponseStatus) {
      // do not remove request from store as we want to re-send it later
      return this.logger.error(`Request failed because of going offline`, response);
    }
    if (!isFailed) {
      await this.delete(queueKey, requestId);
      return this.logger.debug(`Clearing request from queue`, { requestId, queueKey });
    }
    if (isFailed && canRetry) {
      this.logger.warning(`Performing retry`, {
        requestId,
        queueKey,
        storageElement,
        retry,
        retryTime,
        canRetry,
      });

      // Perform retry once request is failed
      setTimeout(async () => {
        await this.performRequest({
          ...storageElement,
          retries: storageElement.retries + 1,
        });
      }, retryTime || 0);
    } else {
      this.logger.debug(`Cannot perform request, removing from queue`, {
        requestId,
        queueKey,
        response,
        storageElement,
        canRetry,
      });

      await this.delete(queueKey, requestId);
    }
  };
}
