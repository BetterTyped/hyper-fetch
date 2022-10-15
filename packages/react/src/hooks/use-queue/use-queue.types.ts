import { FetchProgressType, CommandInstance, DispatcherDumpValueType } from "@hyper-fetch/core";

export type UseQueueOptionsType = {
  queueType?: "auto" | "fetch" | "submit";
};

export type QueueRequest<Command extends CommandInstance> = DispatcherDumpValueType<Command> & {
  /**
   * Uploading progress for given request
   */
  uploading?: FetchProgressType;
  /**
   * Downloading progress for given request
   */
  downloading?: FetchProgressType;
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

export type UseQueueReturnType<T extends CommandInstance> = {
  /**
   * Queue status for provided command
   */
  stopped: boolean;
  /**
   * List of requests for provided command
   */
  requests: QueueRequest<T>[];
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
