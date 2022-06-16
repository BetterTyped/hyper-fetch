import {
  Dispatcher,
  ExtractError,
  CacheValueType,
  ExtractResponse,
  LoggerMethodsType,
  FetchProgressType,
  ExtractFetchReturn,
  CommandEventDetails,
  CommandInstance,
  CommandResponseDetails,
  DispatcherLoadingEventType,
} from "@better-typed/hyper-fetch";

import { UseDependentStateType, UseDependentStateActions } from "helpers";

// Misc
export type UseCommandEventsDataMap = { unmount: VoidFunction };
export type UseCommandEventsLifecycleMap = Map<string, { unmount: VoidFunction }>;

// Props
export type UseCommandEventsOptionsType<T extends CommandInstance> = {
  command: T;
  dispatcher: Dispatcher;
  logger: LoggerMethodsType;
  state: UseDependentStateType<T>;
  actions: UseDependentStateActions<T>;
  setCacheData: (cacheData: CacheValueType<ExtractResponse<T>, ExtractError<T>>) => void;
  initializeCallbacks?: boolean;
};

// Return
export type UseCommandEventsReturnType<T extends CommandInstance> = [
  {
    onRequest: (callback: OnRequestCallbackType) => void;
    onSuccess: (callback: OnSuccessCallbackType<ExtractResponse<T>>) => void;
    onError: (callback: OnErrorCallbackType<ExtractError<T>>) => void;
    onAbort: (callback: OnErrorCallbackType<ExtractError<T>>) => void;
    onOfflineError: (callback: OnErrorCallbackType<ExtractError<T>>) => void;
    onFinished: (callback: OnFinishedCallbackType<ExtractFetchReturn<T>>) => void;
    onRequestStart: (callback: OnStartCallbackType<T>) => void;
    onResponseStart: (callback: OnStartCallbackType<T>) => void;
    onDownloadProgress: (callback: OnProgressCallbackType) => void;
    onUploadProgress: (callback: OnProgressCallbackType) => void;
  },
  {
    addDataListener: (command: CommandInstance, clear?: boolean) => VoidFunction;
    clearDataListener: VoidFunction;
    addLifecycleListeners: (requestId: string) => VoidFunction;
    removeLifecycleListener: (requestId: string) => void;
    clearLifecycleListeners: () => void;
  },
];

// Lifecycle
export type OnRequestCallbackType = (options: Omit<DispatcherLoadingEventType, "isLoading" | "isOffline">) => void;
export type OnSuccessCallbackType<DataType> = (data: DataType, details: CommandResponseDetails) => void;
export type OnErrorCallbackType<ErrorType> = (error: ErrorType, details: CommandResponseDetails) => void;
export type OnFinishedCallbackType<ResponseType> = (response: ResponseType, details: CommandResponseDetails) => void;
export type OnStartCallbackType<T extends CommandInstance> = (details: CommandEventDetails<T>) => void;
export type OnProgressCallbackType = (progress: FetchProgressType) => void;
