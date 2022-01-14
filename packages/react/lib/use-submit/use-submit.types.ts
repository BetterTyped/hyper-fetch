import {
  FetchProgressType,
  SubmitLoadingEventType,
  CacheValueType,
  ExtractError,
  ExtractResponse,
  FetchCommandInstance,
  ExtractFetchReturn,
} from "@better-typed/hyper-fetch";

import { UseDependentStateType, UseDependentStateActions } from "../use-dependent-state/use-dependent-state.types";

export type UseSubmitOptionsType<T extends FetchCommandInstance, MapperResponse> = {
  disabled?: boolean;
  invalidate: (string | FetchCommandInstance)[];
  cacheOnMount?: boolean;
  initialData?: CacheValueType<ExtractResponse<T>, ExtractError<T>>["response"] | null;
  debounce?: boolean;
  debounceTime?: number;
  suspense?: boolean;
  shouldThrow?: boolean;
  responseDataModifierFn?: ((data: ExtractResponse<T>) => MapperResponse) | null;
  dependencyTracking?: boolean;
};

export type UseSubmitReturnType<T extends FetchCommandInstance, MapperResponse = unknown> = Omit<
  UseDependentStateType<ExtractResponse<T>, ExtractError<T>>,
  "data" | "refreshError" | "loading"
> & {
  data: null | (MapperResponse extends never ? ExtractResponse<T> : MapperResponse);
  actions: UseDependentStateActions<ExtractResponse<T>, ExtractError<T>>;
  onRequest: (callback: OnRequestCallbackType) => void;
  onSuccess: (callback: OnSuccessCallbackType<ExtractResponse<T>>) => void;
  onError: (callback: OnErrorCallbackType<ExtractError<T>>) => void;
  onFinished: (callback: OnFinishedCallbackType<ExtractFetchReturn<T>>) => void;
  onRequestStart: (callback: OnStartCallbackType<T>) => void;
  onResponseStart: (callback: OnStartCallbackType<T>) => void;
  onDownloadProgress: (callback: OnProgressCallbackType) => void;
  onUploadProgress: (callback: OnProgressCallbackType) => void;
  isSubmitting: boolean;
  isStale: boolean;
  isDebouncing: boolean;
  submit: () => void;
};

export type OnRequestCallbackType = (options: Omit<SubmitLoadingEventType, "isLoading">) => void;
export type OnSuccessCallbackType<DataType> = (data: DataType) => void;
export type OnErrorCallbackType<ErrorType> = (error: ErrorType) => void;
export type OnFinishedCallbackType<ResponseType> = (response: ResponseType) => void;
export type OnStartCallbackType<T extends FetchCommandInstance> = (middleware: T) => void;
export type OnProgressCallbackType = (progress: FetchProgressType) => void;
