import type {
  ProgressType,
  RequestInstance,
  ResolvedQueueItemType,
  Dispatcher,
  ExtractAdapterType,
} from "@hyper-fetch/core";

export type UseQueueOptionsType = {
  /** Which dispatcher to use: "auto" picks based on request method, "fetch" or "submit" forces a specific one */
  dispatcherType?: "auto" | "fetch" | "submit";
  /** When true, completed requests remain in the queue list for inspection */
  keepFinishedRequests?: boolean;
};

export type QueueRequest<Request extends RequestInstance> = ResolvedQueueItemType<Request> & {
  /** Whether the request has failed after all retry attempts */
  failed?: boolean;
  /** Whether the request was canceled before completing */
  canceled?: boolean;
  /** Whether the request was removed from the queue */
  removed?: boolean;
  /** Whether the request completed successfully */
  success?: boolean;
  /**
   * Uploading progress for given request
   */
  uploading: ProgressType;
  /**
   * Downloading progress for given request
   */
  downloading: ProgressType;
  /**
   * Callback which allow to start previously stopped request.
   */
  startRequest: () => void;
  /**
   * Callback which allow to stop request and cancel it if it's ongoing.
   */
  stopRequest: () => void;
  /**
   * Removes request from the queue
   */
  deleteRequest: () => void;
};

export type UseQueueReturnType<T extends RequestInstance> = {
  /**
   * Queue status for provided request
   */
  stopped: boolean;
  /**
   * List of requests for provided request
   */
  requests: QueueRequest<T>[];
  /**
   * Request dispatcher instance
   */
  dispatcher: Dispatcher<ExtractAdapterType<T>>;
  /**
   * Callback which allow to stop queue, it will cancel ongoing requests.
   */
  stop: () => void;
  /**
   * Callback which allow to pause queue. It will allow ongoing requests to be finished, but will stop next from being send.
   */
  pause: () => void;
  /**
   * Callback which allow to start queue.
   */
  start: () => void;
};
