import { ProgressType, RequestInstance, QueueElementType, Dispatcher } from "@hyper-fetch/core";

export type UseQueueOptionsType = {
  queueType?: "auto" | "fetch" | "submit";
};

export type QueueRequest<Request extends RequestInstance> = QueueElementType<Request> & {
  /**
   * Uploading progress for given request
   */
  uploading?: ProgressType;
  /**
   * Downloading progress for given request
   */
  downloading?: ProgressType;
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
  dispatcher: Dispatcher;
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
