import {
  FetchCommandInstance,
  ExtractFetchReturn,
  ExtractResponse,
  ExtractError,
  CacheValueType,
  QueueLoadingEventType,
  FetchProgressType,
  Queue,
  ExtractClientOptions,
  LoggerMethodsType,
  CommandResponseDetails,
  CommandEventDetails,
} from "@better-typed/hyper-fetch";

import { isEqual } from "utils";

import { UseDependentStateActions, UseDependentStateType } from "utils/use-dependent-state";

export type UseCommandStateOptionsType<T extends FetchCommandInstance> = {
  command: T;
  queue: Queue<ExtractError<T>, ExtractClientOptions<T>>;
  logger: LoggerMethodsType;
  dependencyTracking: boolean;
  initialData: CacheValueType<ExtractResponse<T>, ExtractError<T>>["data"] | null;
  deepCompare: boolean | typeof isEqual;
  commandListeners: Pick<T, "queueKey" | "builder">[];
  removeCommandListener: (queueKey: string) => void;
  refresh?: () => void;
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
    setRenderKey: (key: keyof UseDependentStateType<unknown, unknown>) => void;
    initialized: boolean;
  },
];

export type OnRequestCallbackType = (options: Omit<QueueLoadingEventType, "isLoading" | "isOffline">) => void;
export type OnSuccessCallbackType<DataType> = (data: DataType, details: CommandResponseDetails) => void;
export type OnErrorCallbackType<ErrorType> = (error: ErrorType, details: CommandResponseDetails) => void;
export type OnFinishedCallbackType<ResponseType> = (response: ResponseType, details: CommandResponseDetails) => void;
export type OnStartCallbackType<T extends FetchCommandInstance> = (details: CommandEventDetails<T>) => void;
export type OnProgressCallbackType = (progress: FetchProgressType) => void;
