import {
  FetchCommandInstance,
  ExtractFetchReturn,
  ExtractResponse,
  ExtractError,
  CacheValueType,
  QueueLoadingEventType,
} from "@better-typed/hyper-fetch";

import { UseDependentStateActions, UseDependentStateType } from "use-dependent-state";

export type UseCacheOptionsType<T extends FetchCommandInstance> = {
  dependencyTracking?: boolean;
  initialData?: CacheValueType<ExtractResponse<T>, ExtractError<T>>["response"] | null;
};

export type UseCacheReturnType<T extends FetchCommandInstance> = UseDependentStateType<
  ExtractResponse<T>,
  ExtractError<T>
> &
  UseDependentStateActions<ExtractResponse<T>, ExtractError<T>> & {
    onSuccess: (callback: OnCacheSuccessCallbackType<ExtractResponse<T>>) => void;
    onError: (callback: OnCacheErrorCallbackType<ExtractError<T>>) => void;
    onFinished: (callback: OnCacheFinishedCallbackType<ExtractFetchReturn<T>>) => void;
    onChange: (callback: OnCacheChangeCallbackType<ExtractFetchReturn<T>>) => void;
    isStale: boolean;
    isRefreshingError: boolean;
    revalidate: (invalidateKey?: string | FetchCommandInstance) => void;
  };

export type OnCacheRequestCallbackType = (options: Omit<QueueLoadingEventType, "isLoading">) => void;
export type OnCacheSuccessCallbackType<DataType> = (data: DataType) => void;
export type OnCacheErrorCallbackType<ErrorType> = (error: ErrorType) => void;
export type OnCacheFinishedCallbackType<ResponseType> = (response: ResponseType) => void;
export type OnCacheChangeCallbackType<ResponseType> = (response: ResponseType) => void;
