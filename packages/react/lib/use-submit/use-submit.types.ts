import {
  FetchProgressType,
  QueueLoadingEventType,
  CacheValueType,
  ExtractError,
  ExtractResponse,
  FetchCommandInstance,
  ExtractFetchReturn,
} from "@better-typed/hyper-fetch";

import { UseDependentStateType, UseDependentStateActions } from "../use-dependent-state/use-dependent-state.types";

export type UseSubmitOptionsType<T extends FetchCommandInstance> = {
  disabled?: boolean;
  invalidate?: (string | FetchCommandInstance)[];
  cacheOnMount?: boolean;
  initialData?: CacheValueType<ExtractResponse<T>, ExtractError<T>>["response"] | null;
  debounce?: boolean;
  debounceTime?: number;
  suspense?: boolean;
  shouldThrow?: boolean;
  dependencyTracking?: boolean;
};

export type UseSubmitReturnType<T extends FetchCommandInstance> = Omit<
  UseDependentStateType<ExtractResponse<T>, ExtractError<T>>,
  "data" | "refreshError" | "loading"
> & {
  data: null | ExtractResponse<T>;
  actions: UseDependentStateActions<ExtractResponse<T>, ExtractError<T>>;
  invalidate: (invalidateKey: string | FetchCommandInstance | RegExp) => void;
  onSubmitRequest: (callback: OnRequestCallbackType) => void;
  onSubmitSuccess: (callback: OnSuccessCallbackType<ExtractResponse<T>>) => void;
  onSubmitError: (callback: OnErrorCallbackType<ExtractError<T>>) => void;
  onSubmitFinished: (callback: OnFinishedCallbackType<ExtractFetchReturn<T>>) => void;
  onSubmitRequestStart: (callback: OnStartCallbackType<T>) => void;
  onSubmitResponseStart: (callback: OnStartCallbackType<T>) => void;
  onSubmitDownloadProgress: (callback: OnProgressCallbackType) => void;
  onSubmitUploadProgress: (callback: OnProgressCallbackType) => void;
  submitting: boolean;
  isStale: boolean;
  isDebouncing: boolean;
  submit: (...parameters: Parameters<T["send"]>) => void;
};

export type OnRequestCallbackType = (options: Omit<QueueLoadingEventType, "isLoading">) => void;
export type OnSuccessCallbackType<DataType> = (data: DataType) => void;
export type OnErrorCallbackType<ErrorType> = (error: ErrorType) => void;
export type OnFinishedCallbackType<ResponseType> = (response: ResponseType) => void;
export type OnStartCallbackType<T extends FetchCommandInstance> = (middleware: T) => void;
export type OnProgressCallbackType = (progress: FetchProgressType) => void;
