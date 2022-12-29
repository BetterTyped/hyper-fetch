import EventEmitter from "events";

import {
  QueueDataType,
  getRequestType,
  isFailedRequest,
  canRetryRequest,
  getDispatcherEvents,
  DispatcherRequestType,
  DispatcherOptionsType,
  DispatcherStorageType,
  DispatcherStorageValueType,
  RunningRequestValueType,
} from "dispatcher";
import { ClientInstance } from "client";
import { getUniqueRequestId } from "utils";
import { ResponseDetailsType, LoggerType } from "managers";
import { RequestInstance, Request } from "request";
import { getErrorMessage } from "adapter";

/**
 * Dispatcher class was made to store controlled request Fetches, and firing them all-at-once or one-by-one in request queue.
 * Generally requests should be flushed at the same time, the queue provide mechanism to fire them in the order.
 */
export class Dispatcher {
  public emitter = new EventEmitter();
  public events = getDispatcherEvents(this.emitter);
  public storage: DispatcherStorageType = new Map<string, QueueDataType<RequestInstance>>();

  private requestCount = new Map<string, number>();
  private runningRequests = new Map<string, RunningRequestValueType[]>();

  private logger: LoggerType;

  constructor(public client: ClientInstance, public options?: DispatcherOptionsType) {
    this.logger = client.loggerManager.init("Dispatcher");

    if (this.options?.storage) {
      this.storage = this.options.storage;
    }

    // Going back from offline should re-trigger all requests
    this.client.appManager.events.onOnline(() => {
      this.flush();
    });

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
  };

  /**
   * Return all
   */
  getQueuesKeys = () => {
    return Array.from(this.storage.keys());
  };

  /**
   * Return queue state object
   */
  getQueue = <Request extends RequestInstance = RequestInstance>(queueKey: string) => {
    const initialQueueState: QueueDataType<Request> = { requests: [], stopped: false };
    const storedEntity = this.storage.get<Request>(queueKey);

    return storedEntity || initialQueueState;
  };

  /**
   * Return request from queue state
   */
  getRequest = <Request extends RequestInstance = RequestInstance>(queueKey: string, requestId: string) => {
    const initialQueueState: QueueDataType<Request> = { requests: [], stopped: false };
    const storedEntity = this.storage.get<Request>(queueKey) || initialQueueState;

    return storedEntity.requests.find((req) => req.requestId === requestId);
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
  addQueueElement = <Request extends RequestInstance = RequestInstance>(
    queueKey: string,
    dispatcherDump: DispatcherStorageValueType<Request>,
  ) => {
    const queue = this.getQueue<Request>(queueKey);
    queue.requests.push(dispatcherDump);
    this.setQueue<Request>(queueKey, queue);
  };

  /**
   * Set new queue storage value
   */
  setQueue = <Request extends RequestInstance = RequestInstance>(queueKey: string, queue: QueueDataType<Request>) => {
    this.storage.set<Request>(queueKey, queue);

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
    this.events.setQueueChanged(queueKey, newQueue);

    return newQueue;
  };

  /**
   * Method used to flush the queue requests
   */
  flushQueue = async (queueKey: string) => {
    const queue = this.getQueue(queueKey);
    const runningRequests = this.getRunningRequests(queueKey);
    const queueElement = queue.requests.find((request) => !request.stopped);

    const isStopped = queue && queue.stopped;
    const isOffline = !this.client.appManager.isOnline;
    const isConcurrent = !queueElement?.requestDump.queued;
    const isInactive = !runningRequests.length;
    const isEmpty = !queueElement;

    // When there are no requests to flush, when its stopped, there is running request
    // or there is no request to trigger - we don't want to perform actions
    if (isStopped || isOffline || isEmpty) {
      this.logger.debug("Skipping queue trigger", { isStopped, isOffline, isEmpty });
    } else if (isConcurrent) {
      queue.requests.forEach((element) => {
        if (!this.hasRunningRequest(queueKey, element.requestId)) {
          this.performRequest(element);
        }
      });
    } else if (isInactive) {
      await this.performRequest(queueElement);
      this.flushQueue(queueKey);
    }
  };

  /**
   * Flush all available requests from all queues
   */
  flush = async () => {
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
    const keys = this.getQueuesKeys();
    keys.forEach((queueKey) => this.cancelRunningRequests(queueKey));

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
      this.events.setQueueStatus(queueKey, queue);
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

      // Cancel running requests
      this.cancelRunningRequest(queueKey, requestId);
      this.events.setQueueStatus(queueKey, queue);
    }
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
  addRunningRequest = (queueKey: string, requestId: string, request: RequestInstance) => {
    const runningRequests = this.getRunningRequests(queueKey);
    runningRequests.push({ requestId, request });
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
      this.client.requestManager.abortByRequestId(request.request.abortKey, request.requestId);
    });
    this.deleteRunningRequests(queueKey);
  };
  /**
   * Cancel started request, but do NOT remove it from main storage
   */
  cancelRunningRequest = (queueKey: string, requestId: string) => {
    const requests = this.getRunningRequests(queueKey).filter((request) => {
      if (request.requestId === requestId) {
        this.client.requestManager.abortByRequestId(request.request.abortKey, request.requestId);
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
   * Create storage element from request
   */
  // eslint-disable-next-line class-methods-use-this
  createStorageElement = <Request extends RequestInstance>(request: Request) => {
    const requestId = getUniqueRequestId(request.queueKey);
    const storageElement: DispatcherStorageValueType<Request> = {
      requestId,
      timestamp: +new Date(),
      requestDump: request.dump(),
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
   * Add request to the dispatcher handler
   */
  add = (request: RequestInstance) => {
    const { queueKey } = request;

    // Create dump of the request to allow storing it in localStorage, AsyncStorage or any other
    // This way we don't save the Class but the instruction of the request to be done
    const storageElement = this.createStorageElement(request);
    const { requestId } = storageElement;

    const queue = this.getQueue(queueKey);
    const [latestRequest] = queue.requests.slice(-1);
    const requestType = getRequestType(request, latestRequest);

    this.logger.debug("Adding request to queue", { requestType, request, requestId });

    switch (requestType) {
      case DispatcherRequestType.oneByOne: {
        // Requests will go one by one
        this.addQueueElement(queueKey, storageElement);
        this.flushQueue(queueKey);
        return requestId;
      }
      case DispatcherRequestType.previousCanceled: {
        // Cancel all previous on-going requests
        this.cancelRunningRequests(queueKey);
        this.clearQueue(queueKey);
        this.addQueueElement(queueKey, storageElement);
        this.flushQueue(queueKey);
        return requestId;
      }
      case DispatcherRequestType.deduplicated: {
        // Return the running requestId to fullfil the events
        return queue.requests[0].requestId;
      }
      default: {
        this.addQueueElement(queueKey, storageElement);
        this.flushQueue(queueKey);
        return requestId;
      }
    }
  };

  /**
   * Delete from the storage and cancel request
   */
  delete = (queueKey: string, requestId: string, abortKey: string) => {
    this.logger.debug("Deleting request", { queueKey, requestId, abortKey });
    const queue = this.getQueue(queueKey);
    const existingRequest = queue.requests.find((req) => req.requestId === requestId);

    if (!existingRequest) return;

    const request = new Request(this.client, existingRequest.requestDump.requestOptions, existingRequest.requestDump);
    queue.requests = queue.requests.filter((req) => req.requestId !== requestId);
    this.storage.set(queueKey, queue);

    // Clean controllers
    if (this.hasRunningRequest(queueKey, requestId)) {
      this.deleteRunningRequest(queueKey, requestId);
      this.client.requestManager.abortByRequestId(abortKey, requestId);
    }

    // Emit Queue Changes
    this.options?.onDeleteFromStorage?.(queueKey, queue);
    this.events.setQueueChanged(queueKey, queue);
    this.client.requestManager.events.emitRemove(queueKey, requestId, { requestId, request });

    if (!queue.requests.length) {
      this.events.setDrained(queueKey, queue);
    }

    return queue;
  };

  /**
   * Request can run for some time, once it's done, we have to check if it's successful or if it was aborted
   * It can be different once the previous call was set as cancelled and removed from queue before this request got resolved
   */
  performRequest = async (storageElement: DispatcherStorageValueType) => {
    const request = new Request(this.client, storageElement.requestDump.requestOptions, storageElement.requestDump);
    const { requestDump, requestId } = storageElement;
    this.logger.info("Performing request", { request, requestId });

    const { retry, retryTime, queueKey, cacheKey, abortKey, offline } = requestDump;
    const { adapter, requestManager, cache, appManager } = this.client;

    const canRetry = canRetryRequest(storageElement.retries, retry);
    // When offline not perform any request
    const isOffline = !appManager.isOnline && offline;
    // When request with this id was triggered again
    const isAlreadyRunning = this.hasRunningRequest(queueKey, requestId);
    const isStopped = storageElement.stopped;

    if (isOffline || isAlreadyRunning || isStopped) {
      return this.logger.warning("Unable to perform request", { isOffline, isAlreadyRunning, isStopped });
    }

    // Additionally keep the running request to possibly abort it later
    this.addRunningRequest(queueKey, requestId, request);

    // Propagate the loading to all connected hooks
    requestManager.events.emitLoading(queueKey, requestId, {
      queueKey,
      requestId,
      loading: true,
      isRetry: !!storageElement.retries,
      isOffline,
    });

    // Trigger Request
    this.incrementQueueRequestCount(queueKey);

    const response = await adapter(request, requestId);

    // Do not continue the request handling when it got stopped and request was unsuccessful
    // Or when the request was aborted/canceled
    const isOfflineResponseStatus = !appManager.isOnline;
    // Request is failed when there is the error message or the status is 0 or equal/bigger than 400
    const isFailed = isFailedRequest(response);
    // If there is no running request with this id, it means it was cancelled and removed during send
    const isCancelMessage = getErrorMessage("abort").message === response[1]?.message;
    const isCanceled = !this.hasRunningRequest(queueKey, requestId) || isCancelMessage;

    // Remove running request, must be called after isCancelled
    this.deleteRunningRequest(queueKey, requestId);

    const requestDetails: ResponseDetailsType = {
      isFailed,
      isCanceled,
      isOffline: isOfflineResponseStatus,
      retries: storageElement.retries,
      timestamp: +new Date(),
    };

    // Turn off loading
    requestManager.events.emitLoading(queueKey, requestId, {
      queueKey,
      requestId,
      loading: false,
      isRetry: !!storageElement.retries,
      isOffline,
    });
    // Global response emitter to handle request execution
    requestManager.events.emitResponse(cacheKey, requestId, response, requestDetails);
    // Cache event to emit the data inside and store it
    cache.set(request, response, requestDetails);
    this.logger.info("Request finished", { requestId, request, response, requestDetails });

    // On cancelled
    if (isCanceled) {
      const queue = this.getQueue(queueKey);
      const existingRequest = queue.requests.find((req) => req.requestId === requestId);

      // do not remove cancelled request as it may be result of manual queue pause
      // if abort was done without stop action we can remove request
      if (!queue.stopped && !existingRequest?.stopped) {
        this.logger.debug("Request paused", { response, requestDetails, request });
        return this.delete(queueKey, requestId, abortKey);
      }
      return this.logger.debug("Request canceled", { response, requestDetails, request });
    }
    // On offline
    if (isFailed && isOfflineResponseStatus) {
      // if we don't want to keep offline request - just delete them
      if (!offline) {
        this.logger.warning("Removing non-offline request", { response, requestDetails, request });
        return this.delete(queueKey, requestId, abortKey);
      }
      // do not remove request from store as we want to re-send it later
      return this.logger.debug("Awaiting for network restoration", { response, requestDetails, request });
    }
    // On success
    if (!isFailed) {
      this.delete(queueKey, requestId, abortKey);
      return this.logger.debug("Successful response, removing request from queue.", {
        response,
        requestDetails,
        request,
      });
    }
    // On retry
    if (isFailed && canRetry) {
      this.logger.debug("Waiting for retry", { response, requestDetails, request });
      // Perform retry once request is failed
      setTimeout(() => {
        this.logger.warning("Error response, performing retry");
        this.performRequest({
          ...storageElement,
          retries: storageElement.retries + 1,
        });
      }, retryTime || 0);
    } else {
      this.logger.error("All retries have been used. Removing request from queue.");
      this.delete(queueKey, requestId, abortKey);
    }
  };
}
