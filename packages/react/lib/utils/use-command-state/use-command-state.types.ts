import {
  FetchCommandInstance,
  ExtractFetchReturn,
  ExtractResponse,
  ExtractError,
  CacheValueType,
  QueueLoadingEventType,
  FetchProgressType,
  FetchQueue,
  SubmitQueue,
  ExtractClientOptions,
  LoggerMethodsType,
} from "@better-typed/hyper-fetch";

import { isEqual } from "utils";

import { UseDependentStateActions, UseDependentStateType } from "utils/use-dependent-state";

export type UseCommandStateOptionsType<T extends FetchCommandInstance> = {
  command: T;
  queue: FetchQueue<ExtractError<T>, ExtractClientOptions<T>> | SubmitQueue<ExtractError<T>, ExtractClientOptions<T>>;
  logger: LoggerMethodsType;
  dependencyTracking: boolean;
  initialData: CacheValueType<ExtractResponse<T>, ExtractError<T>>["response"] | null;
  deepCompare: boolean | typeof isEqual;
};

export type UseCommandStateReturnType<T extends FetchCommandInstance> = [
  UseDependentStateType<ExtractResponse<T>, ExtractError<T>>,
  {
    actions: UseDependentStateActions<ExtractResponse<T>, ExtractError<T>>;
    onRequest: (callback: OnRequestCallbackType) => void;
    onSuccess: (callback: OnSuccessCallbackType<ExtractResponse<T>>) => void;
    onError: (callback: OnErrorCallbackType<ExtractError<T>>) => void;
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

export type OnRequestCallbackType = (options: Omit<QueueLoadingEventType, "isLoading">) => void;
export type OnSuccessCallbackType<DataType> = (data: DataType) => void;
export type OnErrorCallbackType<ErrorType> = (error: ErrorType) => void;
export type OnFinishedCallbackType<ResponseType> = (response: ResponseType) => void;
export type OnStartCallbackType<T extends FetchCommandInstance> = (middleware: T) => void;
export type OnProgressCallbackType = (progress: FetchProgressType) => void;
