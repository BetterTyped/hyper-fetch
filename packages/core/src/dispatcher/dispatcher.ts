/* eslint-disable max-lines */
import type { AdapterInstance, RequestResponseType } from "adapter";
import { getErrorMessage } from "adapter";
import type { ClientInstance } from "client";
import type {
  QueueDataType,
  DispatcherOptionsType,
  DispatcherStorageType,
  ResolvedQueueDataType,
  ResolvedQueueItemType,
  RunningRequestValueType,
} from "dispatcher";
import { getRequestType, canRetryRequest, getDispatcherEvents, DispatcherMode } from "dispatcher";
import type { ResponseDetailsType, LoggerMethods } from "managers";
import type { RequestInstance, RequestJSON } from "request";
import { Request, scopeKey } from "request";
import { EventEmitter, throwOutsideLifecycle } from "utils";

/**
 * Dispatcher controls and manages the requests that are going to be executed with adapter. It manages them based on the options provided with request.
 * This class can also run them with different modes like deduplication, cancelation, queueing or run-all-at-once mode. With it's help we can pause,
 * stop, start and cancel requests.
 */
export class Dispatcher<Adapter extends AdapterInstance> {
  public emitter = new EventEmitter();
  public events = getDispatcherEvents(this.emitter);
  public storage: DispatcherStorageType = new Map<string, QueueDataType<any>>();

  private requestCount = new Map<string, number>();
  private runningRequests = new Map<string, RunningRequestValueType[]>();
  /** Failed requests waiting for their next attempt, by requestId */
  private retryTimers = new Map<string, ReturnType<typeof setTimeout>>();
  /** Requests which got their response and are still in the queue while their listeners run */
  private answeredRequests = new Set<string>();
  /** Order in which the requests were sent - responses can come back in another one */
  private sentCount = 0;
  /** Cache element (by its storage key) to the order number of the request whose data it holds */
  private cachedOrder = new Map<string, number>();

  private logger: LoggerMethods;
  private client: ClientInstance<{ adapter: Adapter }>;

  constructor(public options?: DispatcherOptionsType) {
    this.emitter?.setMaxListeners(1000);

    if (this.options?.storage) {
      this.storage = this.options.storage;
    }
  }

  // eslint-disable-next-line class-methods-use-this
  private isRequestJSON = (
    request: RequestInstance | RequestJSON<RequestInstance>,
  ): request is RequestJSON<RequestInstance> => {
    return !(request instanceof Request);
  };

  initialize = (client: ClientInstance<{ adapter: Adapter }>) => {
    this.client = client;
    this.logger = client.loggerManager.initialize(client, "Dispatcher");

    // Going back from offline should re-trigger all requests
    this.client.appManager.events.onOnline(() => {
      this.flush();
    });

    return this;
  };

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
    this.client.triggerPlugins("onDispatcherQueueRunning", { dispatcher: this, queue, status: "running" });
    this.events.emitQueueStatusChanged(queue);
  };

  /**
   * Pause request queue, but do not cancel already started requests
   */
  pause = (queryKey: string) => {
    // Change state to stopped
    const queue = this.getQueue(queryKey);

    queue.stopped = true;
    this.setQueue(queryKey, queue);
    this.client.triggerPlugins("onDispatcherQueueRunning", { dispatcher: this, queue, status: "paused" });
    this.events.emitQueueStatusChanged(queue);
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
    this.client.triggerPlugins("onDispatcherQueueRunning", { dispatcher: this, queue, status: "stopped" });
    this.events.emitQueueStatusChanged(queue);
  };

  /**
   * Return all queue keys currently tracked by the dispatcher storage
   */
  getQueuesKeys = () => {
    return [...this.storage.keys()];
  };

  /**
   * Return queue state object.
   * Automatically reconstructs any serialized (JSON) requests back into
   * proper Request class instances so the rest of the pipeline can rely on
   * having a real `RequestInstance`.
   */
  getQueue = <R extends RequestInstance = RequestInstance>(queryKey: string): ResolvedQueueDataType<R> => {
    const initialQueueState: ResolvedQueueDataType<R> = { queryKey, requests: [], stopped: false };
    const storedEntity = this.storage.get<R>(queryKey);

    if (!storedEntity) {
      return initialQueueState;
    }

    const resolvedRequests: ResolvedQueueItemType<R>[] = storedEntity.requests.map((item) => {
      if (this.isRequestJSON(item.request)) {
        return { ...item, request: this.client.fromJSON(item.request as RequestJSON<RequestInstance>) as unknown as R };
      }
      return item as ResolvedQueueItemType<R>;
    });

    return { ...storedEntity, requests: resolvedRequests };
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
  addQueueItem = <Request extends RequestInstance = RequestInstance>(
    queryKey: string,
    element: ResolvedQueueItemType<Request>,
  ) => {
    const queue = this.getQueue<Request>(queryKey);
    queue.requests.push(element);

    this.client.triggerPlugins("onDispatcherItemAdded", { dispatcher: this, queue, queueItem: element });

    this.setQueue<Request>(queryKey, queue);
  };

  /**
   * Set new queue storage value
   */
  setQueue = <Request extends RequestInstance = RequestInstance>(
    queryKey: string,
    queue: ResolvedQueueDataType<Request>,
  ) => {
    this.storage.set<Request>(queryKey, queue as QueueDataType<Request>);

    // Emit Queue Changes
    this.client.triggerPlugins("onDispatcherQueueCreated", { dispatcher: this, queue });
    this.events.emitQueueChanged(queue);

    return queue;
  };

  /**
   * Clear requests from queue cache
   */
  clearQueue = (queryKey: string) => {
    return this.removeQueueItems(
      queryKey,
      this.getRunningRequests(queryKey).map((running) => running.requestId),
    );
  };

  /**
   * Empty the queue. Requests listed in `answeredIds` are running or were just canceled, so they still report
   * their own response. All the others would never be heard of again - those are reported as removed.
   */
  private removeQueueItems = (queryKey: string, answeredIds: string[]) => {
    const queue = this.getQueue(queryKey);
    const newQueue = { queryKey, requests: [], stopped: queue.stopped };
    this.storage.set(queryKey, newQueue);

    // Emit Queue Changes
    this.client.triggerPlugins("onDispatcherQueueCleared", { dispatcher: this, queue: newQueue });
    this.events.emitQueueChanged(newQueue);
    this.emitRemovedItems(queue.requests, answeredIds);
    this.events.emitDrained(newQueue);

    return newQueue;
  };

  private emitRemovedItems = (items: ResolvedQueueItemType[], answeredIds: string[]) => {
    items.forEach((item) => {
      this.cancelRetry(item.requestId);

      if (!answeredIds.includes(item.requestId)) {
        this.client.requestManager.events.emitRemove({
          requestId: item.requestId,
          request: item.request,
          resolved: item.resolved,
        });
      }
    });
  };

  /**
   * A request can be sent when it is not in flight, not held by `stopRequest`, not waiting for its retry,
   * not just answered and - for the requests kept for later with the `offline` option - when there is a connection
   */
  private canPerformRequest = (item: ResolvedQueueItemType, runningIds: Set<string>) => {
    const isWaitingForNetwork = !this.client.appManager.isOnline && item.request.offline;

    return (
      !item.stopped &&
      !isWaitingForNetwork &&
      !this.retryTimers.has(item.requestId) &&
      !this.answeredRequests.has(item.requestId) &&
      !runningIds.has(item.requestId)
    );
  };

  /**
   * Method used to flush the queue requests
   */
  flushQueue = async (queryKey: string) => {
    const queue = this.getQueue(queryKey);
    const runningRequests = this.getRunningRequests(queryKey);
    const queueItem = queue.requests.find((request) => !request.stopped);

    const isStopped = queue && queue.stopped;
    const isOffline = !this.client.appManager.isOnline;
    const isConcurrent = !queueItem?.request.queued;
    const isInactive = runningRequests.length === 0;
    const isEmpty = !queueItem;

    // When there are no requests to flush, when its stopped, there is running request
    // or there is no request to trigger - we don't want to perform actions
    if (isStopped || isEmpty) {
      this.logger.debug({ title: "Skipping queue trigger", type: "system", extra: { isStopped, isOffline, isEmpty } });
    } else if (isConcurrent) {
      // Collected once - looking for every request in the list of the running ones gets slow with a long queue
      const runningIds = new Set(runningRequests.map((running) => running.requestId));
      queue.requests.forEach((element) => {
        if (this.canPerformRequest(element, runningIds)) {
          runningIds.add(element.requestId);
          this.performRequest(element);
        }
      });
    }
    // One by one - the first request holds the queue also while it waits for its retry or for the network
    else if (isInactive && this.canPerformRequest(queueItem, new Set())) {
      await this.performRequest(queueItem);
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
      const storageItem = this.getQueue(key);

      if (storageItem) {
        this.flushQueue(key);
      }
    }
  };

  /**
   * Clear all running requests and storage
   */
  clear = () => {
    const keys = this.getQueuesKeys();
    // Running requests are canceled and report it on their own, the waiting ones are reported as removed
    const removed = keys.map((queryKey) => ({
      items: this.getQueue(queryKey).requests,
      answeredIds: this.getRunningRequests(queryKey).map((running) => running.requestId),
    }));
    keys.forEach((queryKey) => this.cancelRunningRequests(queryKey));

    [...this.runningRequests.keys()].forEach((queryKey) => this.setRunningRequests(queryKey, []));
    this.runningRequests.clear();
    this.cachedOrder.clear();
    this.storage.clear();
    removed.forEach(({ items, answeredIds }) => this.emitRemovedItems(items, answeredIds));
    this.client.triggerPlugins("onDispatcherCleared", { dispatcher: this });
  };

  /**
   * Drop the scheduled retry of the request
   */
  private cancelRetry = (requestId: string) => {
    const timer = this.retryTimers.get(requestId);
    if (timer === undefined) {
      return false;
    }

    clearTimeout(timer);
    return this.retryTimers.delete(requestId);
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
      this.events.emitQueueStatusChanged(queue);
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
      this.events.emitQueueStatusChanged(queue);
    }
  };

  /**
   * Get currently running requests from all queryKeys
   */
  getAllRunningRequests = () => {
    return [...this.runningRequests.values()].flat();
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
   * Single place for changing the running requests - notifies about the change
   */
  private setRunningRequests = (queryKey: string, runningRequests: RunningRequestValueType[]) => {
    const previousRequests = this.getRunningRequests(queryKey);
    if (runningRequests.length > 0) {
      this.runningRequests.set(queryKey, runningRequests);
    } else {
      // Do not keep an empty list for every queryKey that was ever used
      this.runningRequests.delete(queryKey);
    }
    if (
      previousRequests.length !== runningRequests.length ||
      previousRequests.some((req, i) => req !== runningRequests[i])
    ) {
      this.events.emitRunningRequestsChanged({ queryKey, runningRequests });
    }
  };

  /**
   * Add request to the running requests list
   */
  addRunningRequest = (queryKey: string, requestId: string, request: RequestInstance): RunningRequestValueType => {
    const newRunningRequest = { requestId, request, timestamp: Date.now() };
    this.setRunningRequests(queryKey, [...this.getRunningRequests(queryKey), newRunningRequest]);
    return newRunningRequest;
  };

  /**
   * Get the value based on the currently running requests
   */
  hasRunningRequests = (queryKey: string) => {
    return this.getRunningRequests(queryKey).length > 0;
  };

  /**
   * Check if request is currently processing
   */
  hasRunningRequest = (queryKey: string, requestId: string) => {
    const runningRequests = this.getRunningRequests(queryKey);
    return !!runningRequests.some((req) => req.requestId === requestId);
  };

  /**
   * Cancel all started requests, but do NOT remove it from main storage
   */
  cancelRunningRequests = (queryKey: string) => {
    this.runningRequests.get(queryKey)?.forEach((req) => {
      const ak = scopeKey(req.request.abortKey, req.request.scope);
      this.client.requestManager.abortByRequestId(ak, req.requestId);
    });
    this.deleteRunningRequests(queryKey);
  };
  /**
   * Cancel started request, but do NOT remove it from main storage
   */
  cancelRunningRequest = (queryKey: string, requestId: string) => {
    const requests = this.getRunningRequests(queryKey).filter((request) => {
      if (request.requestId === requestId) {
        const ak = scopeKey(request.request.abortKey, request.request.scope);
        this.client.requestManager.abortByRequestId(ak, request.requestId);
        return false;
      }
      return true;
    });

    this.setRunningRequests(queryKey, requests);
  };

  /**
   * Delete all started requests, but do NOT clear it from queue and do NOT cancel them
   */
  deleteRunningRequests = (queryKey: string) => {
    this.setRunningRequests(queryKey, []);
  };

  /**
   * Delete request by id, but do NOT clear it from queue and do NOT cancel them
   */
  deleteRunningRequest = (queryKey: string, requestId: string) => {
    const runningRequests = this.getRunningRequests(queryKey);
    this.setRunningRequests(
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
  createStorageItem = <R extends RequestInstance>(request: R): ResolvedQueueItemType<R> => {
    const requestId = this.client.unstable_requestIdMapper(request);
    return {
      requestId,
      timestamp: Date.now(),
      request,
      retries: 0,
      stopped: false,
      resolved: false,
    };
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
    const queryKey = scopeKey(request.queryKey, request.scope);

    // Create dump of the request to allow storing it in localStorage, AsyncStorage or any other
    // This way we don't save the Class but the instruction of the request to be done
    const storageItem = this.createStorageItem(request);
    const { requestId } = storageItem;

    const queue = this.getQueue(queryKey);
    const [latestRequest] = queue.requests.slice(-1);
    const requestType = getRequestType(request, latestRequest);

    this.logger.debug({ title: "Adding request to queue", type: "system", extra: { requestType, request, requestId } });

    switch (requestType) {
      case DispatcherMode.ONE_BY_ONE: {
        // Requests will go one by one
        this.addQueueItem(queryKey, storageItem);
        this.flushQueue(queryKey);
        return requestId;
      }
      case DispatcherMode.PREVIOUS_CANCELED: {
        // Cancel all previous on-going requests
        const canceledIds = this.getRunningRequests(queryKey).map((running) => running.requestId);
        this.cancelRunningRequests(queryKey);
        this.removeQueueItems(queryKey, canceledIds);
        this.addQueueItem(queryKey, storageItem);
        this.flushQueue(queryKey);
        return requestId;
      }
      case DispatcherMode.DEDUPLICATED: {
        this.client.requestManager.events.emitDeduplicated({
          request: latestRequest.request,
          requestId,
          deduplicatedRequest: request,
        });
        // Return the running requestId to fulfill the events
        return latestRequest.requestId;
      }
      default: {
        this.addQueueItem(queryKey, storageItem);
        this.flushQueue(queryKey);
        return requestId;
      }
    }
  };

  /**
   * Delete from the storage and cancel request
   */
  delete = (queryKey: string, requestId: string, abortKey: string) => {
    this.logger.debug({ title: "Deleting request", type: "system", extra: { queryKey, requestId, abortKey } });
    const queue = this.getQueue(queryKey);
    const queueItem = queue.requests.find((req) => req.requestId === requestId);

    if (!queueItem) {
      return;
    }

    queue.requests = queue.requests.filter((req) => req.requestId !== requestId);
    this.storage.set(queryKey, queue);
    this.cancelRetry(requestId);

    // Clean controllers
    if (this.hasRunningRequest(queryKey, requestId)) {
      this.deleteRunningRequest(queryKey, requestId);
      this.client.requestManager.abortByRequestId(abortKey, requestId);
    }

    // Emit Queue Changes
    this.client.triggerPlugins("onDispatcherItemDeleted", { queue, dispatcher: this, queueItem });

    this.events.emitQueueChanged(queue);
    this.client.requestManager.events.emitRemove({
      requestId,
      request: queueItem.request,
      resolved: queueItem.resolved,
    });

    if (queue.requests.length === 0) {
      this.client.triggerPlugins("onDispatcherQueueDrained", { queue, dispatcher: this });
      this.events.emitDrained(queue);
    }

    return queue;
  };

  /**
   * Save the number of used attempts on the queued request
   */
  private setQueueItemRetries = (queryKey: string, requestId: string, retries: number) => {
    const queue = this.getQueue(queryKey);
    const queueItem = queue.requests.find((item) => item.requestId === requestId);

    if (queueItem) {
      queueItem.retries = retries;
      this.storage.set(queryKey, queue);
    }
  };

  /**
   * The `retryOnError` callback belongs to the user - when it throws, the request is not retried
   */
  private getShouldRetryOnError = (request: RequestInstance, response: RequestResponseType<any>) => {
    if (!request.retryOnError) {
      return true;
    }
    try {
      return !!request.retryOnError(response);
    } catch (error) {
      this.logger.error({ title: "The retryOnError callback failed", type: "system", extra: { error, request } });
      return false;
    }
  };

  /**
   * Request can run for some time, once it's done, we have to check if it's successful or if it was aborted
   * It can be different once the previous call was set as cancelled and removed from queue before this request got resolved
   */
  performRequest = async (storageItem: ResolvedQueueItemType) => {
    const { request, requestId } = storageItem;
    this.logger.debug({ title: "Performing request", type: "system", extra: { request, requestId } });

    const { retry, retryTime, queryKey: rawQueryKey, abortKey: rawAbortKey, offline, scope } = request;
    const queryKey = scopeKey(rawQueryKey, scope);
    const abortKey = scopeKey(rawAbortKey, scope);
    const { adapter, requestManager, cache, appManager } = this.client;

    const canRetry = canRetryRequest(storageItem.retries, retry);
    // When offline not perform any request
    const isOffline = !appManager.isOnline && offline;
    // When request with this id was triggered again
    const isAlreadyRunning = this.hasRunningRequest(queryKey, requestId);
    const isStopped = storageItem.stopped;

    if (isOffline || isAlreadyRunning || isStopped) {
      return this.logger.warning({
        title: "Unable to perform request",
        type: "system",
        extra: { isOffline, isAlreadyRunning, isStopped },
      });
    }

    // Additionally keep the running request to possibly abort it later
    const runningRequest = this.addRunningRequest(queryKey, requestId, request);
    this.sentCount += 1;
    const sentOrder = this.sentCount;

    // Propagate the loading to all connected hooks
    requestManager.events.emitLoading({
      request,
      requestId,
      loading: true,
      isRetry: !!storageItem.retries,
      isOffline,
    });

    // Trigger Request
    this.incrementQueueRequestCount(queryKey);
    // Listen for aborting
    requestManager.addAbortController(abortKey, requestId);

    const response: RequestResponseType<any> = await adapter.fetch(request, requestId);

    // TODO: improve this
    // eslint-disable-next-line no-param-reassign
    storageItem.resolved = true;
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

    // The request is no longer running, but it stays in the queue until its response is handled below. Listeners
    // of the response can add requests to this queue - flushing it must not send the answered request again.
    this.answeredRequests.add(requestId);
    try {
      // A request removed from the queue while it was running (cleared queue) has nothing left to retry
      const isQueued = !!this.getRequest(queryKey, requestId);
      const canRetryResponse = !response.success && canRetry && isQueued && !isCanceled && !isOfflineResponseStatus;
      const willRetry = canRetryResponse && this.getShouldRetryOnError(request, response);

      const requestDetails: ResponseDetailsType = {
        isCanceled,
        isOffline: isOfflineResponseStatus,
        retries: storageItem.retries,
        willRetry,
        addedTimestamp: storageItem.timestamp,
        triggerTimestamp: runningRequest.timestamp,
        requestTimestamp: response.requestTimestamp,
        responseTimestamp: response.responseTimestamp,
      };

      // A throwing listener must not leave the request in the queue forever (and block all the queued ones behind it)
      const notify = (callback: VoidFunction) => {
        try {
          callback();
        } catch (error) {
          this.logger.error({
            title: "Response listener failed",
            type: "system",
            extra: { error, request, requestId },
          });
          throwOutsideLifecycle(error);
        }
      };

      // Global response emitter to handle request execution
      notify(() => requestManager.events.emitResponse({ request, requestId, response, details: requestDetails }));

      // Turn off loading
      notify(() =>
        requestManager.events.emitLoading({
          request,
          requestId,
          loading: false,
          isRetry: !!storageItem.retries,
          isOffline,
        }),
      );

      // Requests of one cache key can answer in another order than they were sent. Once the data of a request is in
      // the cache, a response of a request sent before it is outdated - it must not replace that data.
      const storageKey = scopeKey(request.cacheKey, scope);
      const isOutdated = (this.cachedOrder.get(storageKey) ?? 0) > sentOrder;

      if (isOutdated) {
        this.logger.debug({
          title: "Response of a request sent before the cached one, skipping the cache",
          type: "system",
          extra: { requestId, request, response },
        });
      } else {
        if (response.success) {
          this.cachedOrder.set(storageKey, sentOrder);
        }
        // Cache event to emit the data inside and store it
        notify(() => cache.set(request, { ...response, ...requestDetails }));
      }
      this.logger.debug({
        title: "Dispatcher processing response",
        type: "system",
        extra: { requestId, request, response, details: requestDetails },
      });

      // On cancelled
      if (isCanceled) {
        const queue = this.getQueue(queryKey);
        const queueItem = queue.requests.find((req) => req.requestId === requestId);

        // do not remove cancelled request as it may be result of manual queue pause
        // if abort was done without stop action we can remove request
        if (!queue.stopped && !queueItem?.stopped) {
          this.logger.debug({ title: "Request paused", type: "system", extra: { response, requestDetails, request } });
          return this.delete(queryKey, requestId, abortKey);
        }
        return this.logger.debug({
          title: "Request canceled",
          type: "system",
          extra: { response, requestDetails, request },
        });
      }
      // On offline
      if (!response.success && isOfflineResponseStatus) {
        // if we don't want to keep offline request - just delete them
        if (!offline) {
          this.logger.warning({
            title: "Removing non-offline request",
            type: "system",
            extra: { response, requestDetails, request },
          });
          return this.delete(queryKey, requestId, abortKey);
        }
        // do not remove request from store as we want to re-send it later
        return this.logger.debug({
          title: "Awaiting for network restoration",
          type: "system",
          extra: { response, requestDetails, request },
        });
      }
      // On success
      if (response.success) {
        this.delete(queryKey, requestId, abortKey);
        return this.logger.debug({
          title: "Successful response, removing request from queue.",
          type: "system",
          extra: {
            response,
            requestDetails,
            request,
          },
        });
      }
      // On retry
      if (willRetry) {
        this.logger.debug({ title: "Waiting for retry", type: "system", extra: { response, requestDetails, request } });
        const retries = storageItem.retries + 1;
        // The attempts are counted on the queued item - whatever sends it next (the timer below, a new request
        // flushing the queue, the network coming back, the queue being started) continues from this number
        this.setQueueItemRetries(queryKey, requestId, retries);
        // Only the latest failure schedules the retry
        this.cancelRetry(requestId);
        // Perform retry once request is failed
        const retryTimer = setTimeout(async () => {
          this.retryTimers.delete(requestId);
          const queueItem = this.getRequest(queryKey, requestId);

          // Dispatcher methods cancel this timer, so the item was taken directly from the storage and nobody announced it
          if (!queueItem) {
            this.logger.debug({
              title: "Request no longer in queue, skipping retry",
              type: "request",
              extra: { response, requestDetails, request, requestId },
            });
            requestManager.events.emitRemove({ requestId, request, resolved: storageItem.resolved });
            return;
          }
          // Stopped while waiting - it will be sent again when the request gets started
          if (queueItem.stopped) {
            return;
          }

          this.logger.warning({
            title: "Error response, performing retry",
            type: "request",
            extra: { response, requestDetails, request, requestId },
          });
          await this.performRequest({
            ...storageItem,
            retries,
          });
          // Let the queue go on when it was held by this request
          this.flushQueue(queryKey);
        }, retryTime || 0);
        this.retryTimers.set(requestId, retryTimer);
      } else {
        if (request.retry) {
          this.logger.error({
            title: "All retries have been used. Removing request from queue.",
            type: "request",
            extra: { response, requestDetails, request, requestId },
          });
        }
        this.delete(queryKey, requestId, abortKey);
      }
    } finally {
      this.answeredRequests.delete(requestId);
      // A request which stays in the queue was skipped by the flushes made from its listeners - for example
      // the one of the network coming back - so it gets its chance now
      if (this.getRequest(queryKey, requestId)) {
        this.flushQueue(queryKey);
      }
    }
  };
}
