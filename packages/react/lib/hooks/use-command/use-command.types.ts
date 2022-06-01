import {
  Dispatcher,
  ExtractError,
  CacheValueType,
  ExtractResponse,
  LoggerMethodsType,
  FetchProgressType,
  ExtractFetchReturn,
  CommandEventDetails,
  FetchCommandInstance,
  CommandResponseDetails,
  DispatcherLoadingEventType,
} from "@better-typed/hyper-fetch";

import { isEqual } from "utils";
import { UseDependentStateActions, UseDependentStateType } from "hooks";

export type UseCommandStateOptionsType<T extends FetchCommandInstance> = {
  command: T;
  dispatcher: Dispatcher;
  logger: LoggerMethodsType;
  dependencyTracking: boolean;
  initialData: CacheValueType<ExtractResponse<T>, ExtractError<T>>["data"] | null;
  deepCompare: boolean | typeof isEqual;
  initializeCallbacks?: boolean;
};

export type UseCommandStateReturnType<T extends FetchCommandInstance> = [
  UseDependentStateType<ExtractResponse<T>, ExtractError<T>>,
  {
    actions: UseDependentStateActions<ExtractResponse<T>, ExtractError<T>>;
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
    addRequestListener: (requestId: string, command: FetchCommandInstance) => void;
    setRenderKey: (key: keyof UseDependentStateType<unknown, unknown>) => void;
    getStaleStatus: () => boolean | Promise<boolean>;
  },
];

export type OnRequestCallbackType = (options: Omit<DispatcherLoadingEventType, "isLoading" | "isOffline">) => void;
export type OnSuccessCallbackType<DataType> = (data: DataType, details: CommandResponseDetails) => void;
export type OnErrorCallbackType<ErrorType> = (error: ErrorType, details: CommandResponseDetails) => void;
export type OnFinishedCallbackType<ResponseType> = (response: ResponseType, details: CommandResponseDetails) => void;
export type OnStartCallbackType<T extends FetchCommandInstance> = (details: CommandEventDetails<T>) => void;
export type OnProgressCallbackType = (progress: FetchProgressType) => void;
