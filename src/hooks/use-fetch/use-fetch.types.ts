import { FetchMiddlewareInstance } from "middleware";
import { ExtractFetchReturn, ExtractResponse, ExtractError } from "types";
import { CacheValueType } from "cache";
import { ClientResponseType } from "client";
import { FetchLoadingEventType } from "queues";
import { UseDependentStateActions, UseDependentStateType } from "../use-dependent-state/use-dependent-state.types";

export type UseFetchOptionsType<T extends FetchMiddlewareInstance, MapperResponse> = {
  dependencies?: any[];
  disabled?: boolean;
  retry?: boolean | number;
  retryTime?: number;
  cacheTime?: number;
  cacheKey?: string;
  cacheOnMount?: boolean;
  initialCacheData?: ExtractFetchReturn<T> | null;
  initialData?: CacheValueType<ExtractResponse<T>, ExtractError<T>> | null;
  refresh?: boolean;
  refreshTime?: number;
  refreshOnTabBlur?: boolean;
  refreshOnTabFocus?: boolean;
  refreshOnReconnect?: boolean;
  debounce?: boolean;
  debounceTime?: number;
  suspense?: boolean;
  shouldThrow?: boolean;
  cancelable?: boolean;
  mapperFn?: ((data: ExtractResponse<T>) => MapperResponse) | null;
  deepCompareFn?:
    | ((
        previousValues: ClientResponseType<ExtractResponse<T>, ExtractError<T>>,
        newValues: ClientResponseType<ExtractResponse<T>, ExtractError<T>>,
      ) => boolean)
    | undefined;
};

export type UseFetchReturnType<T extends FetchMiddlewareInstance, MapperResponse = unknown> = Omit<
  UseDependentStateType<ExtractResponse<T>, ExtractError<T>>,
  "data"
> & {
  data: null | (MapperResponse extends never ? ExtractResponse<T> : MapperResponse);
  actions: UseDependentStateActions<ExtractResponse<T>, ExtractError<T>>;
  onRequest: (callback: OnRequestCallbackType) => void;
  onSuccess: (callback: OnSuccessCallbackType<ExtractResponse<T>>) => void;
  onError: (callback: OnErrorCallbackType<ExtractError<T>>) => void;
  onFinished: (callback: OnFinishedCallbackType<ExtractFetchReturn<T>>) => void;
  isRefreshed: boolean;
  isRefreshingError: boolean;
  isDebouncing: boolean;
  refresh: (invalidateKey?: string | FetchMiddlewareInstance) => void;
};

export type OnRequestCallbackType = (options: Omit<FetchLoadingEventType, "isLoading">) => void;
export type OnSuccessCallbackType<DataType> = (data: DataType) => void;
export type OnErrorCallbackType<ErrorType> = (error: ErrorType) => void;
export type OnFinishedCallbackType<ResponseType> = (response: ResponseType) => void;
