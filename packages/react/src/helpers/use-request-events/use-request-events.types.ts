import {
  Dispatcher,
  ExtractErrorType,
  CacheValueType,
  ExtractResponseType,
  LoggerType,
  RequestEventType,
  RequestInstance,
  RequestProgressEventType,
  RequestResponseEventType,
  ResponseErrorType,
  ExtractAdapterType,
  ResponseType,
  ResponseSuccessType,
} from "@hyper-fetch/core";

import { UseTrackedStateActions } from "helpers";

// Misc
export type UseRequestEventsDataMap = { unmount: VoidFunction };
export type UseRequestEventsLifecycleMap = Map<string, { unmount: VoidFunction }>;

// Props
export type UseRequestEventsPropsType<T extends RequestInstance> = {
  request: T;
  dispatcher: Dispatcher;
  logger: LoggerType;
  actions: UseTrackedStateActions<T>;
  setCacheData: (cacheData: CacheValueType<ExtractResponseType<T>, ExtractErrorType<T>>) => void;
};

export type UseRequestEventsActionsType<T extends RequestInstance> = {
  /**
   * Callback that allows canceling ongoing requests from the given queryKey.
   */
  abort: () => void;
  /**
   * Helper hook listening on success response.
   */
  onSuccess: (callback: OnSuccessCallbackType<T>) => void;
  /**
   * Helper hook listening on error response.
   */
  onError: (callback: OnErrorCallbackType<T>) => void;
  /**
   * Helper hook listening on aborting of requests. Abort events are not triggering onError callbacks.
   */
  onAbort: (callback: OnErrorCallbackType<T>) => void;
  /**
   * Helper hook listening on request going into offline awaiting for network connection to be restored. It will not trigger onError when 'offline' mode is set on request.
   */
  onOfflineError: (callback: OnErrorCallbackType<T>) => void;
  /**
   * Helper hook listening on any response.
   */
  onFinished: (callback: OnFinishedCallbackType<T>) => void;
  /**
   * Helper hook listening on request start.
   */
  onRequestStart: (callback: OnStartCallbackType<T>) => void;
  /**
   * Helper hook listening on response start(before we receive all data from server).
   */
  onResponseStart: (callback: OnStartCallbackType<T>) => void;
  /**
   * Helper hook listening on download progress ETA. We can later match given requests by their id's or request instance which holds all data which is being transferred.
   */
  onDownloadProgress: (callback: OnProgressCallbackType) => void;
  /**
   * Helper hook listening on upload progress ETA. We can later match given requests by their id's or request instance which holds all data which is being transferred.
   */
  onUploadProgress: (callback: OnProgressCallbackType) => void;
};

// Return
export type UseRequestEventsReturnType<T extends RequestInstance> = [
  UseRequestEventsActionsType<T>,
  {
    addDataListener: (request: T) => VoidFunction;
    clearDataListener: VoidFunction;
    addLifecycleListeners: (request: T, requestId?: string) => VoidFunction;
    removeLifecycleListener: (requestId: string) => void;
    clearLifecycleListeners: () => void;
  },
];

// Lifecycle

export type CallbackParameters<Request extends RequestInstance, ResponseType> = {
  response: ResponseType;
} & Omit<RequestResponseEventType<Request>, "response">;

export type OnSuccessCallbackType<Request extends RequestInstance> = (
  params: CallbackParameters<Request, ResponseSuccessType<ExtractResponseType<Request>, ExtractAdapterType<Request>>>,
) => void | Promise<void>;
export type OnErrorCallbackType<Request extends RequestInstance> = (
  params: CallbackParameters<Request, ResponseErrorType<ExtractErrorType<Request>, ExtractAdapterType<Request>>>,
) => void | Promise<void>;
export type OnFinishedCallbackType<Request extends RequestInstance> = (
  params: CallbackParameters<
    Request,
    ResponseType<ExtractResponseType<Request>, ExtractErrorType<Request>, ExtractAdapterType<Request>>
  >,
) => void | Promise<void>;
export type OnStartCallbackType<Request extends RequestInstance> = (
  data: RequestEventType<Request>,
) => void | Promise<void>;
export type OnProgressCallbackType = <Request extends RequestInstance>(
  data: RequestProgressEventType<Request>,
) => void | Promise<void>;
