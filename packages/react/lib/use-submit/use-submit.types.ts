import {
  FetchProgressType,
  QueueLoadingEventType,
  CacheValueType,
  ExtractError,
  ExtractResponse,
  FetchCommandInstance,
  ExtractFetchReturn,
} from "@better-typed/hyper-fetch";

import { UseDependentStateType, UseDependentStateActions } from "use-dependent-state";

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
  "refreshError" | "loading"
> & {
  onSubmitRequest: (callback: OnSubmitRequestCallbackType) => void;
  onSubmitSuccess: (callback: OnSubmitSuccessCallbackType<ExtractResponse<T>>) => void;
  onSubmitError: (callback: OnSubmitErrorCallbackType<ExtractError<T>>) => void;
  onSubmitFinished: (callback: OnSubmitFinishedCallbackType<ExtractFetchReturn<T>>) => void;
  onSubmitRequestStart: (callback: OnSubmitStartCallbackType<T>) => void;
  onSubmitResponseStart: (callback: OnSubmitStartCallbackType<T>) => void;
  onSubmitDownloadProgress: (callback: OnSubmitProgressCallbackType) => void;
  onSubmitUploadProgress: (callback: OnSubmitProgressCallbackType) => void;
  revalidate: (invalidateKey: string | FetchCommandInstance | RegExp) => void;
  submit: (...parameters: Parameters<T["send"]>) => void;
  actions: UseDependentStateActions<ExtractResponse<T>, ExtractError<T>>;
  submitting: boolean;
  isStale: boolean;
  isDebouncing: boolean;
};

export type OnSubmitRequestCallbackType = (options: Omit<QueueLoadingEventType, "isLoading">) => void;
export type OnSubmitSuccessCallbackType<DataType> = (data: DataType) => void;
export type OnSubmitErrorCallbackType<ErrorType> = (error: ErrorType) => void;
export type OnSubmitFinishedCallbackType<ResponseType> = (response: ResponseType) => void;
export type OnSubmitStartCallbackType<T extends FetchCommandInstance> = (middleware: T) => void;
export type OnSubmitProgressCallbackType = (progress: FetchProgressType) => void;
