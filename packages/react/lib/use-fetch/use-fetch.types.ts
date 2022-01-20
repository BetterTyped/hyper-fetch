import {
  FetchCommandInstance,
  ExtractFetchReturn,
  ExtractResponse,
  ExtractError,
  CacheValueType,
  FetchLoadingEventType,
  FetchProgressType,
} from "@better-typed/hyper-fetch";

import { UseDependentStateActions, UseDependentStateType } from "../use-dependent-state/use-dependent-state.types";

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
  onRequest: (callback: OnRequestCallbackType) => void;
  onSuccess: (callback: OnSuccessCallbackType<ExtractResponse<T>>) => void;
  onError: (callback: OnErrorCallbackType<ExtractError<T>>) => void;
  onFinished: (callback: OnFinishedCallbackType<ExtractFetchReturn<T>>) => void;
  onRequestStart: (callback: OnStartCallbackType<T>) => void;
  onResponseStart: (callback: OnStartCallbackType<T>) => void;
  onDownloadProgress: (callback: OnProgressCallbackType) => void;
  onUploadProgress: (callback: OnProgressCallbackType) => void;
  isRefreshed: boolean;
  isRefreshingError: boolean;
  isDebouncing: boolean;
  isStale: boolean;
  refresh: (invalidateKey?: string | FetchCommandInstance) => void;
};

export type OnRequestCallbackType = (options: Omit<FetchLoadingEventType, "isLoading">) => void;
export type OnSuccessCallbackType<DataType> = (data: DataType) => void;
export type OnErrorCallbackType<ErrorType> = (error: ErrorType) => void;
export type OnFinishedCallbackType<ResponseType> = (response: ResponseType) => void;
export type OnStartCallbackType<T extends FetchCommandInstance> = (middleware: T) => void;
export type OnProgressCallbackType = (progress: FetchProgressType) => void;
