import {
  Dispatcher,
  ExtractErrorType,
  CacheValueType,
  ExtractResponseType,
  LoggerType,
  ProgressType,
  ExtractAdapterReturnType,
  RequestEventType,
  RequestInstance,
  ResponseDetailsType,
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
  getIsDataProcessing: () => boolean;
};

export type UseRequestEventsActionsType<T extends RequestInstance> = {
  /**
   * Callback that allows canceling ongoing requests from the given queueKey.
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
    addCacheDataListener: (request: RequestInstance) => VoidFunction;
    clearCacheDataListener: VoidFunction;
    addLifecycleListeners: (request: RequestInstance, requestId?: string) => VoidFunction;
    removeLifecycleListener: (requestId: string) => void;
    clearLifecycleListeners: () => void;
  },
];

// Lifecycle

export type CallbackParameters<Request, ResponseType> = {
  response: ResponseType;
  details: ResponseDetailsType;
  request: Request;
};

export type OnSuccessCallbackType<Request extends RequestInstance> = (
  params: CallbackParameters<Request, ExtractResponseType<Request>>,
) => void | Promise<void>;
export type OnErrorCallbackType<Request extends RequestInstance> = (
  params: CallbackParameters<Request, ExtractErrorType<Request>>,
) => void | Promise<void>;
export type OnFinishedCallbackType<Request extends RequestInstance> = (
  params: CallbackParameters<Request, ExtractAdapterReturnType<Request>>,
) => void | Promise<void>;
export type OnStartCallbackType<Request extends RequestInstance> = (params: {
  details: RequestEventType<Request>;
  request: Request;
}) => void | Promise<void>;
export type OnProgressCallbackType = <Request extends RequestInstance>(
  progress: ProgressType,
  details: RequestEventType<Request>,
) => void | Promise<void>;
