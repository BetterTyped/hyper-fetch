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

import { isEqual } from "utils";
import { UseDependentStateType, UseDependentStateActions } from "helpers";

export type UseCommandStateOptionsType<T extends CommandInstance> = {
  command: T;
  dispatcher: Dispatcher;
  logger: LoggerMethodsType;
  state: UseDependentStateType<ExtractResponse<T>, ExtractError<T>>;
  actions: UseDependentStateActions<ExtractResponse<T>, ExtractError<T>>;
  setCacheData: (cacheData: CacheValueType<ExtractResponse<T>, ExtractError<T>>) => void;
  deepCompare: boolean | typeof isEqual;
  cacheInitialized: boolean;
  initializeCallbacks?: boolean;
};

export type UseCommandStateReturnType<T extends CommandInstance> = [
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
    addRequestListener: (
      requestId: string,
      command: CommandInstance,
    ) => (unmountLifecycleEvents: boolean, unmountDataEvents: boolean) => void;
  },
];

export type OnRequestCallbackType = (options: Omit<DispatcherLoadingEventType, "isLoading" | "isOffline">) => void;
export type OnSuccessCallbackType<DataType> = (data: DataType, details: CommandResponseDetails) => void;
export type OnErrorCallbackType<ErrorType> = (error: ErrorType, details: CommandResponseDetails) => void;
export type OnFinishedCallbackType<ResponseType> = (response: ResponseType, details: CommandResponseDetails) => void;
export type OnStartCallbackType<T extends CommandInstance> = (details: CommandEventDetails<T>) => void;
export type OnProgressCallbackType = (progress: FetchProgressType) => void;
