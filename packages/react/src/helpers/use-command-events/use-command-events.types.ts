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
    onSuccess: <Context = undefined>(callback: OnSuccessCallbackType<ExtractResponse<T>, Context>) => void;
    onError: <Context = undefined>(callback: OnErrorCallbackType<ExtractError<T>, Context>) => void;
    onAbort: <Context = undefined>(callback: OnErrorCallbackType<ExtractError<T>, Context>) => void;
    onOfflineError: <Context = undefined>(callback: OnErrorCallbackType<ExtractError<T>, Context>) => void;
    onFinished: <Context = undefined>(callback: OnFinishedCallbackType<ExtractFetchReturn<T>, Context>) => void;
    onRequestStart: <Context = undefined>(callback: OnStartCallbackType<T, Context>) => void;
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
export type OnSuccessCallbackType<DataType, Context> = (
  data: DataType,
  details: CommandResponseDetails,
  context: Context,
) => void;
export type OnErrorCallbackType<ErrorType, Context> = (
  error: ErrorType,
  details: CommandResponseDetails,
  context: Context,
) => void;
export type OnFinishedCallbackType<ResponseType, Context> = (
  response: ResponseType,
  details: CommandResponseDetails,
  context: Context,
) => void;
export type OnStartCallbackType<T extends CommandInstance, Context = undefined> = (
  details: CommandEventDetails<T>,
) => Context;
export type OnProgressCallbackType = (progress: FetchProgressType) => void;
