import {
  FetchCommandInstance,
  ExtractFetchReturn,
  ExtractResponse,
  ExtractError,
  CacheValueType,
  QueueLoadingEventType,
  FetchProgressType,
} from "@better-typed/hyper-fetch";

import { UseDependentStateActions, UseDependentStateType } from "use-dependent-state";

export type UseFetchOptionsType<T extends FetchCommandInstance> = {
  dependencies?: any[];
  disabled?: boolean;
  dependencyTracking?: boolean;
  revalidateOnMount?: boolean;
  initialData?: CacheValueType<ExtractResponse<T>, ExtractError<T>>["response"] | null;
  refresh?: boolean;
  refreshTime?: number;
  refreshBlurred?: boolean;
  refreshOnTabBlur?: boolean;
  refreshOnTabFocus?: boolean;
  refreshOnReconnect?: boolean;
  debounce?: boolean;
  debounceTime?: number;
  suspense?: boolean;
  shouldThrow?: boolean;
};

export type UseFetchReturnType<T extends FetchCommandInstance> = Omit<
  UseDependentStateType<ExtractResponse<T>, ExtractError<T>>,
  "data"
> & {
  data: null | ExtractResponse<T>;
  actions: UseDependentStateActions<ExtractResponse<T>, ExtractError<T>>;
  onRequest: (callback: OnFetchRequestCallbackType) => void;
  onSuccess: (callback: OnFetchSuccessCallbackType<ExtractResponse<T>>) => void;
  onError: (callback: OnFetchErrorCallbackType<ExtractError<T>>) => void;
  onFinished: (callback: OnFetchFinishedCallbackType<ExtractFetchReturn<T>>) => void;
  onRequestStart: (callback: OnFetchStartCallbackType<T>) => void;
  onResponseStart: (callback: OnFetchStartCallbackType<T>) => void;
  onDownloadProgress: (callback: OnFetchProgressCallbackType) => void;
  onUploadProgress: (callback: OnFetchProgressCallbackType) => void;
  isRefreshed: boolean;
  isRefreshingError: boolean;
  isDebouncing: boolean;
  isStale: boolean;
  refresh: (invalidateKey?: string | FetchCommandInstance) => void;
};

export type OnFetchRequestCallbackType = (options: Omit<QueueLoadingEventType, "isLoading">) => void;
export type OnFetchSuccessCallbackType<DataType> = (data: DataType) => void;
export type OnFetchErrorCallbackType<ErrorType> = (error: ErrorType) => void;
export type OnFetchFinishedCallbackType<ResponseType> = (response: ResponseType) => void;
export type OnFetchStartCallbackType<T extends FetchCommandInstance> = (middleware: T) => void;
export type OnFetchProgressCallbackType = (progress: FetchProgressType) => void;
