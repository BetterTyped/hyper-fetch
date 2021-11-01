import { FetchMiddlewareInstance } from "middleware";
import { ExtractFetchReturn, ExtractResponse, ExtractError } from "types";
import { CacheValueType } from "cache";
import { ClientResponseType } from "client";
import { UseCacheStateActions, UseCacheStateType } from "../use-cache-state/use-cache-state.types";

export type FetchCacheTypes = "normal" | "service-worker" | "once";

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
  refresh: boolean;
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
    | null;
  plugins?: any[];
};

export type UseFetchReturnType<T extends FetchMiddlewareInstance, MapperResponse> = Omit<
  UseCacheStateType<ExtractResponse<T>, ExtractError<T>>,
  "data"
> & {
  data: null | (MapperResponse extends never ? ExtractResponse<T> : MapperResponse);
  actions: UseCacheStateActions<ExtractResponse<T>, ExtractError<T>>;
  onSuccess: (callback: OnSuccessCallbackType<ExtractResponse<T>>) => void;
  onError: (callback: OnErrorCallbackType<ExtractError<T>>) => void;
  onFinished: (callback: OnFinishedCallbackType<ExtractFetchReturn<T>>) => void;
  isCanceled: boolean;
  isRefreshed: boolean;
  isRefreshingError: boolean;
  isDebouncing: boolean;
  refresh: () => void;
};

export type OnSuccessCallbackType<DataType> = (data: DataType) => void;
export type OnErrorCallbackType<ErrorType> = (error: ErrorType) => void;
export type OnFinishedCallbackType<ResponseType> = (response: ResponseType) => void;
