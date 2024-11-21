import {
  QueueDataType,
  getRequestType,
  canRetryRequest,
  getDispatcherEvents,
  DispatcherRequestType,
  DispatcherOptionsType,
  DispatcherStorageType,
  QueueElementType,
  RunningRequestValueType,
} from "dispatcher";
import { ClientInstance } from "client";
import { EventEmitter, getUniqueRequestId } from "utils";
import { ResponseDetailsType, LoggerType } from "managers";
import { RequestInstance } from "request";
import { getErrorMessage, RequestResponseType } from "adapter";

/**
 * Dispatcher controls and manages the requests that are going to be executed with adapter. It manages them based on the options provided with request.
 * This class can also run them with different modes like deduplication, cancelation, queueing or run-all-at-once mode. With it's help we can pause,
 * stop, start and cancel requests.
 */
export class Dispatcher {
  public emitter = new EventEmitter();
  public events = getDispatcherEvents(this.emitter);
  public storage: DispatcherStorageType = new Map<string, QueueDataType<any>>();

  private requestCount = new Map<string, number>();
  private runningRequests = new Map<string, RunningRequestValueType[]>();

  private logger: LoggerType;

  constructor(
    public client: ClientInstance,
    public options?: DispatcherOptionsType,
  ) {
    this.emitter?.setMaxListeners(20000);
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

  // *********************************************************************
  // *********************************************************************
  // Queue
  // *********************************************************************
  // *********************************************************************

  /**
   * Start request handling by queryKey
   */
  start = (queryKey: string) => {
    // Change status to running
    const queue = this.getQueue(queryKey);

    // Start the queue when its stopped
    queue.stopped = false;
    this.setQueue(queryKey, queue);
    this.flushQueue(queryKey);
    this.events.setQueueStatusChanged(queue);
  };

  /**
   * Pause request queue, but not cancel already started requests
   */
  pause = (queryKey: string) => {
    // Change state to stopped
    const queue = this.getQueue(queryKey);

    queue.stopped = true;
    this.setQueue(queryKey, queue);
    this.events.setQueueStatusChanged(queue);
  };

  /**
   * Stop request queue and cancel all started requests - those will be treated like not started
   */
  stop = (queryKey: string) => {
    // Change state to stopped
    const queue = this.getQueue(queryKey);

    queue.stopped = true;
    this.setQueue(queryKey, queue);

    // Cancel running requests
    this.cancelRunningRequests(queryKey);
    this.events.setQueueStatusChanged(queue);
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
  getQueue = <Request extends RequestInstance = RequestInstance>(queryKey: string) => {
    const initialQueueState: QueueDataType<Request> = { queryKey, requests: [], stopped: false };
    const storedEntity = this.storage.get<Request>(queryKey);

    return storedEntity || initialQueueState;
  };

  /**
   * Return request from queue state
   */
  getRequest = <Request extends RequestInstance = RequestInstance>(queryKey: string, requestId: string) => {
    const initialQueueState: QueueDataType<Request> = { queryKey, requests: [], stopped: false };
    const storedEntity = this.storage.get<Request>(queryKey) || initialQueueState;

    return storedEntity.requests.find((req) => req.requestId === requestId);
  };

  /**
   * Get value of the active queue status based on the stopped status
   */
  getIsActiveQueue = (queryKey: string) => {
    const queue = this.getQueue(queryKey);
    const hasAvailableRequests = queue.requests.some((req) => !req.stopped);
    const isRunningQueue = !queue.stopped;
    return hasAvailableRequests && isRunningQueue;
  };

  /**
   * Add new element to storage
   */
  addQueueElement = <Request extends RequestInstance = RequestInstance>(
    queryKey: string,
    element: QueueElementType<Request>,
  ) => {
    const queue = this.getQueue<Request>(queryKey);
    queue.requests.push(element);
    this.setQueue<Request>(queryKey, queue);
  };

  /**
   * Set new queue storage value
   */
  setQueue = <Request extends RequestInstance = RequestInstance>(queryKey: string, queue: QueueDataType<Request>) => {
    this.storage.set<Request>(queryKey, queue);

    // Emit Queue Changes
    this.options?.onUpdateStorage?.(queue);
    this.events.setQueueChanged(queue);

    return queue;
  };

  /**
   * Clear requests from queue cache
   */
  clearQueue = (queryKey: string) => {
    const queue = this.getQueue(queryKey);
    const newQueue = { queryKey, requests: [], stopped: queue.stopped };
    this.storage.set(queryKey, newQueue);

    // Emit Queue Changes
    this.options?.onDeleteFromStorage?.(newQueue);
    this.events.setQueueChanged(newQueue);

    return newQueue;
  };

  /**
   * Method used to flush the queue requests
   */
  flushQueue = async (queryKey: string) => {
    const queue = this.getQueue(queryKey);
    const runningRequests = this.getRunningRequests(queryKey);
    const queueElement = queue.requests.find((request) => !request.stopped);

    const isStopped = queue && queue.stopped;
    const isOffline = !this.client.appManager.isOnline;
    const isConcurrent = !queueElement?.request.queued;
    const isInactive = !runningRequests.length;
    const isEmpty = !queueElement;

    // When there are no requests to flush, when its stopped, there is running request
    // or there is no request to trigger - we don't want to perform actions
    if (isStopped || isOffline || isEmpty) {
      this.logger.debug("Skipping queue trigger", { isStopped, isOffline, isEmpty });
    } else if (isConcurrent) {
      queue.requests.forEach((element) => {
        if (!this.hasRunningRequest(queryKey, element.requestId)) {
          this.performRequest(element);
        }
      });
    } else if (isInactive) {
      await this.performRequest(queueElement);
      this.flushQueue(queryKey);
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
    keys.forEach((queryKey) => this.cancelRunningRequests(queryKey));

    this.runningRequests.clear();
    this.storage.clear();
    this.options?.onClearStorage?.(this);
  };

  // *********************************************************************
  // *********************************************************************
  // Requests
  // *********************************************************************
  // *********************************************************************

  /**
   * Start particular request
   */
  startRequest = (queryKey: string, requestId: string) => {
    // Change status to running
    const queue = this.getQueue(queryKey);
    const request = queue.requests.find((element) => element.requestId === requestId);

    // Start the queue when its stopped
    if (request) {
      request.stopped = false;
      this.setQueue(queryKey, queue);
      this.flushQueue(queryKey);
      this.events.setQueueStatusChanged(queue);
    }
  };

  /**
   * Stop particular request
   */
  stopRequest = (queryKey: string, requestId: string) => {
    // Change state to stopped
    const queue = this.getQueue(queryKey);
    const request = queue.requests.find((element) => element.requestId === requestId);

    if (request) {
      request.stopped = true;
      this.setQueue(queryKey, queue);

      // Cancel running requests
      this.cancelRunningRequest(queryKey, requestId);
      this.events.setQueueStatusChanged(queue);
    }
  };

  /**
   * Get currently running requests from all queryKeys
   */
  getAllRunningRequests = () => {
    return Array.from(this.runningRequests.values()).flat();
  };

  /**
   * Get currently running requests
   */
  getRunningRequests = (queryKey: string) => {
    return this.runningRequests.get(queryKey) || [];
  };

  /**
   * Get running request by id
   */
  getRunningRequest = (queryKey: string, requestId: string) => {
    const runningRequests = this.getRunningRequests(queryKey);
    return runningRequests.find((req) => req.requestId === requestId);
  };

  /**
   * Add request to the running requests list
   */
  addRunningRequest = (queryKey: string, requestId: string, request: RequestInstance): RunningRequestValueType => {
    const newRunningRequest = { requestId, request, timestamp: Date.now() };
    const runningRequests = this.getRunningRequests(queryKey);
    runningRequests.push(newRunningRequest);
    this.runningRequests.set(queryKey, runningRequests);
    return newRunningRequest;
  };

  /**
   * Get the value based on the currently running requests
   */
  hasRunningRequests = (queryKey: string) => {
    return !!this.getRunningRequests(queryKey).length;
  };

  /**
   * Check if request is currently processing
   */
  hasRunningRequest = (queryKey: string, requestId: string) => {
    const runningRequests = this.getRunningRequests(queryKey);
    return !!runningRequests.find((req) => req.requestId === requestId);
  };

  /**
   * Cancel all started requests, but do NOT remove it from main storage
   */
  cancelRunningRequests = (queryKey: string) => {
    this.runningRequests.get(queryKey)?.forEach((request) => {
      this.client.requestManager.abortByRequestId(request.request.abortKey, request.requestId);
    });
    this.deleteRunningRequests(queryKey);
  };
  /**
   * Cancel started request, but do NOT remove it from main storage
   */
  cancelRunningRequest = (queryKey: string, requestId: string) => {
    const requests = this.getRunningRequests(queryKey).filter((request) => {
      if (request.requestId === requestId) {
        this.client.requestManager.abortByRequestId(request.request.abortKey, request.requestId);
        return false;
      }
      return true;
    });

    this.runningRequests.set(queryKey, requests);
  };

  /**
   * Delete all started requests, but do NOT clear it from queue and do NOT cancel them
   */
  deleteRunningRequests = (queryKey: string) => {
    this.runningRequests.set(queryKey, []);
  };

  /**
   * Delete request by id, but do NOT clear it from queue and do NOT cancel them
   */
  deleteRunningRequest = (queryKey: string, requestId: string) => {
    const runningRequests = this.getRunningRequests(queryKey);
    this.runningRequests.set(
      queryKey,
      runningRequests.filter((req) => req.requestId !== requestId),
    );
  };

  /**
   * Get count of requests from the same queryKey
   */
  getQueueRequestCount = (queryKey: string) => {
    return this.requestCount.get(queryKey) || 0;
  };

  /**
   * Add request count to the queryKey
   */
  incrementQueueRequestCount = (queryKey: string) => {
    const count = this.requestCount.get(queryKey) || 0;
    this.requestCount.set(queryKey, count + 1);
  };

  /**
   * Create storage element from request
   */
  // eslint-disable-next-line class-methods-use-this
  createStorageElement = <Request extends RequestInstance>(request: Request) => {
    const requestId = getUniqueRequestId(request.queryKey);
    const storageElement: QueueElementType<Request> = {
      requestId,
      timestamp: +new Date(),
      request,
      retries: 0,
      stopped: false,
      resolved: false,
    };
    return storageElement;
  };

  // *********************************************************************
  // *********************************************************************
  // Dispatching
  // *********************************************************************
  // *********************************************************************

  /**
   * Add request to the dispatcher handler
   */
  add = (request: RequestInstance) => {
    const { queryKey } = request;

    // Create dump of the request to allow storing it in localStorage, AsyncStorage or any other
    // This way we don't save the Class but the instruction of the request to be done
    const storageElement = this.createStorageElement(request);
    const { requestId } = storageElement;

    const queue = this.getQueue(queryKey);
    const [latestRequest] = queue.requests.slice(-1);
    const requestType = getRequestType(request, latestRequest);

    this.logger.debug("Adding request to queue", { requestType, request, requestId });

    switch (requestType) {
      case DispatcherRequestType.ONE_BY_ONE: {
        // Requests will go one by one
        this.addQueueElement(queryKey, storageElement);
        this.flushQueue(queryKey);
        return requestId;
      }
      case DispatcherRequestType.PREVIOUS_CANCELED: {
        // Cancel all previous on-going requests
        this.cancelRunningRequests(queryKey);
        this.clearQueue(queryKey);
        this.addQueueElement(queryKey, storageElement);
        this.flushQueue(queryKey);
        return requestId;
      }
      case DispatcherRequestType.DEDUPLICATED: {
        // Return the running requestId to fulfill the events
        return queue.requests[0].requestId;
      }
      default: {
        this.addQueueElement(queryKey, storageElement);
        this.flushQueue(queryKey);
        return requestId;
      }
    }
  };

  /**
   * Delete from the storage and cancel request
   */
  delete = (queryKey: string, requestId: string, abortKey: string) => {
    this.logger.debug("Deleting request", { queryKey, requestId, abortKey });
    const queue = this.getQueue(queryKey);
    const queueElement = queue.requests.find((req) => req.requestId === requestId);

    if (!queueElement) return;

    queue.requests = queue.requests.filter((req) => req.requestId !== requestId);
    this.storage.set(queryKey, queue);

    // Clean controllers
    if (this.hasRunningRequest(queryKey, requestId)) {
      this.deleteRunningRequest(queryKey, requestId);
      this.client.requestManager.abortByRequestId(abortKey, requestId);
    }

    // Emit Queue Changes
    this.options?.onDeleteFromStorage?.(queue);
    this.events.setQueueChanged(queue);
    this.client.requestManager.events.emitRemove({
      requestId,
      request: queueElement.request,
      resolved: queueElement.resolved,
    });

    if (!queue.requests.length) {
      this.events.setDrained(queue);
    }

    return queue;
  };

  /**
   * Request can run for some time, once it's done, we have to check if it's successful or if it was aborted
   * It can be different once the previous call was set as cancelled and removed from queue before this request got resolved
   */
  performRequest = async (storageElement: QueueElementType) => {
    const { request, requestId } = storageElement;
    this.logger.info("Performing request", { request, requestId });

    const { retry, retryTime, queryKey, abortKey, offline } = request;
    const { adapter, requestManager, cache, appManager } = this.client;

    const canRetry = canRetryRequest(storageElement.retries, retry);
    // When offline not perform any request
    const isOffline = !appManager.isOnline && offline;
    // When request with this id was triggered again
    const isAlreadyRunning = this.hasRunningRequest(queryKey, requestId);
    const isStopped = storageElement.stopped;

    if (isOffline || isAlreadyRunning || isStopped) {
      return this.logger.warning("Unable to perform request", { isOffline, isAlreadyRunning, isStopped });
    }

    // Additionally keep the running request to possibly abort it later
    const runningRequest = this.addRunningRequest(queryKey, requestId, request);

    // Propagate the loading to all connected hooks
    requestManager.events.emitLoading({
      request,
      requestId,
      loading: true,
      isRetry: !!storageElement.retries,
      isOffline,
    });

    // Trigger Request
    this.incrementQueueRequestCount(queryKey);
    // Listen for aborting
    requestManager.addAbortController(abortKey, requestId);

    const response: RequestResponseType<any> = await adapter(request, requestId);

    // eslint-disable-next-line no-param-reassign
    storageElement.resolved = true;
    // Stop listening for aborting
    requestManager.removeAbortController(abortKey, requestId);
    // Do not continue the request handling when it got stopped and request was unsuccessful
    // Or when the request was aborted/canceled
    const isOfflineResponseStatus = !appManager.isOnline;
    // If there is no running request with this id, it means it was cancelled and removed during send
    const isCancelMessage = getErrorMessage("abort").message === response.error?.message;
    const isCanceled = !this.hasRunningRequest(queryKey, requestId) || isCancelMessage;

    // Remove running request, must be called after isCancelled
    this.deleteRunningRequest(queryKey, requestId);

    const requestDetails: ResponseDetailsType = {
      isCanceled,
      isOffline: isOfflineResponseStatus,
      retries: storageElement.retries,
      addedTimestamp: storageElement.timestamp,
      triggerTimestamp: runningRequest.timestamp,
      requestTimestamp: response.requestTimestamp,
      responseTimestamp: response.responseTimestamp,
    };

    // Turn off loading
    requestManager.events.emitLoading({
      request,
      requestId,
      loading: false,
      isRetry: !!storageElement.retries,
      isOffline,
    });
    // Global response emitter to handle request execution
    requestManager.events.emitResponse({ request, requestId, response, details: requestDetails });
    // Cache event to emit the data inside and store it
    cache.set(request, { ...response, ...requestDetails });
    this.logger.info("Request finished", { requestId, request, response, requestDetails });

    // On cancelled
    if (isCanceled) {
      const queue = this.getQueue(queryKey);
      const queueElement = queue.requests.find((req) => req.requestId === requestId);

      // do not remove cancelled request as it may be result of manual queue pause
      // if abort was done without stop action we can remove request
      if (!queue.stopped && !queueElement?.stopped) {
        this.logger.debug("Request paused", { response, requestDetails, request });
        return this.delete(queryKey, requestId, abortKey);
      }
      return this.logger.debug("Request canceled", { response, requestDetails, request });
    }
    // On offline
    if (!response.success && isOfflineResponseStatus) {
      // if we don't want to keep offline request - just delete them
      if (!offline) {
        this.logger.warning("Removing non-offline request", { response, requestDetails, request });
        return this.delete(queryKey, requestId, abortKey);
      }
      // do not remove request from store as we want to re-send it later
      return this.logger.debug("Awaiting for network restoration", { response, requestDetails, request });
    }
    // On success
    if (response.success) {
      this.delete(queryKey, requestId, abortKey);
      return this.logger.debug("Successful response, removing request from queue.", {
        response,
        requestDetails,
        request,
      });
    }
    // On retry
    if (!response.success && canRetry) {
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
      this.delete(queryKey, requestId, abortKey);
    }
  };
}
