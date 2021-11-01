import { FetchMiddlewareInstance } from "middleware";
import { ExtractFetchReturn, ExtractResponse, ExtractError } from "types";
import { CacheValueType } from "cache";

export type FetchCacheTypes = "normal" | "service-worker" | "once";

export type ActionsType<T> = {
  setData: (data: T) => void;
};

export type UseFetchOptionsType<T extends FetchMiddlewareInstance> = {
  dependencies?: any[];
  disabled?: boolean;
  retry?: boolean | number;
  retryTime?: number;
  cacheType?: FetchCacheTypes;
  cacheTime?: number;
  cacheKey?: string;
  cacheOnMount?: boolean;
  initialCacheData?: ExtractFetchReturn<T> | null;
  initialData?: CacheValueType<ExtractResponse<T>, ExtractError<T>> | null;
  refreshTime?: number;
  refreshOnTabBlur?: boolean;
  refreshOnTabFocus?: boolean;
  refreshOnReconnect?: boolean;
  debounceTime?: number;
  suspense?: boolean;
  shouldThrow?: boolean;
  cancelable?: boolean;
  mapperFn?: (() => void) | null;
  deepCompareFn?: (() => void) | null;
  plugins?: any[];
};

export type UseFetchReturnType<T> = {
  // data: T
  // isLoading: boolean
  // error: T
  // actions: ActionsType<T>
  // onSuccess: fn (data, isRefreshed)
  // onError: fn (data, isRefreshed)
  // onFinished: fn (data, error, isRefreshed)
  // status: number 200 404 etc
  // isCanceled: bool
  // isCached: bool
  // isRefreshed: bool
  // timestamp: Date
  // isSuccess: bool
  // isError: bool
  // isRefreshingError: bool
  // isDebounce: bool
  // failureCount: number
  // fetchCount: number
  // refresh: fn
  // invalidateCache: fn - jednocześnie triggeruje refresh
  // cancel: fn
};

export type OnSuccessCallbackType<DataType> = (data: DataType) => void;
export type OnErrorCallbackType<ErrorType> = (error: ErrorType) => void;
export type OnFinishedCallbackType<ResponseType> = (response: ResponseType) => void;
