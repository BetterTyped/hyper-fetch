import type {
  Dispatcher,
  ExtractErrorType,
  CacheValueType,
  ExtractResponseType,
  ExtractMutationContextType,
  LoggerMethods,
  OptimisticCallbackResult,
  RequestEventType,
  RequestInstance,
  RequestProgressEventType,
  RequestResponseEventType,
  ResponseErrorType,
  ExtractAdapterType,
  ResponseType,
  ResponseSuccessType,
} from "@hyper-fetch/core";

import type { UseTrackedStateActions } from "helpers";

// Misc
export type UseRequestEventsDataMap = { unmount: VoidFunction };
export type UseRequestEventsLifecycleMap = Map<string, { unmount: VoidFunction }>;

// Props
export type UseRequestEventsPropsType<T extends RequestInstance> = {
  request: T;
  dispatcher: Dispatcher<ExtractAdapterType<T>>;
  logger: LoggerMethods;
  actions: UseTrackedStateActions<T>;
  setCacheData: (cacheData: CacheValueType<ExtractResponseType<T>, ExtractErrorType<T>>) => void;
  getIsDataProcessing: (cacheKey: string) => boolean;
};

export type UseRequestEventsActionsType<T extends RequestInstance> = {
  /**
   * Callback that allows canceling ongoing requests from the given queryKey.
   */
  abort: () => void;
  /**
   * Helper hook listening on success response. Includes `mutationContext` when `setOptimistic` is configured.
   */
  onSuccess: (callback: OnSuccessCallbackType<T>) => void;
  /**
   * Helper hook listening on error response. Includes `mutationContext` when `setOptimistic` is configured.
   */
  onError: (callback: OnErrorCallbackType<T>) => void;
  /**
   * Helper hook listening on aborting of requests. Includes `mutationContext` when `setOptimistic` is configured.
   */
  onAbort: (callback: OnErrorCallbackType<T>) => void;
  /**
   * Helper hook listening on request going into offline awaiting for network connection to be restored.
   */
  onOfflineError: (callback: OnErrorCallbackType<T>) => void;
  /**
   * Helper hook listening on any response. Includes `mutationContext` when `setOptimistic` is configured.
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
   * Helper hook listening on download progress ETA.
   */
  onDownloadProgress: (callback: OnProgressCallbackType) => void;
  /**
   * Helper hook listening on upload progress ETA.
   */
  onUploadProgress: (callback: OnProgressCallbackType) => void;
};

// Return
export type UseRequestEventsReturnType<T extends RequestInstance> = [
  UseRequestEventsActionsType<T>,
  {
    addCacheDataListener: (request: T) => VoidFunction;
    clearCacheDataListener: VoidFunction;
    addLifecycleListeners: (
      request: T,
      requestId?: string,
      optimisticResult?: OptimisticCallbackResult<any>,
    ) => VoidFunction;
    removeLifecycleListener: (requestId: string) => void;
    clearLifecycleListeners: () => void;
  },
];

// Lifecycle

export type CallbackParameters<Request extends RequestInstance, Resp> = {
  response: Resp;
  mutationContext: ExtractMutationContextType<Request> | undefined;
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
