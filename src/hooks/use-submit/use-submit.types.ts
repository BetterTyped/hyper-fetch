import { FetchMethodType, FetchMiddlewareInstance } from "middleware";
import {
  ExtractFetchReturn,
  ExtractResponse,
  ExtractError,
  ExtractRequest,
  ExtractEndpoint,
  ExtractHasData,
  ExtractHasParams,
  ExtractHasQueryParams,
} from "types";
import { CacheValueType } from "cache";
import { ClientResponseType } from "client";
import { UseCacheStateActions, UseCacheStateType } from "../use-cache-state/use-cache-state.types";

export type UseSubmitOptionsType<T extends FetchMiddlewareInstance, MapperResponse> = {
  disabled?: boolean;
  queueKey: string;
  invalidate: (string | FetchMiddlewareInstance)[];
  dependencies?: any[];
  retry?: boolean | number;
  retryTime?: number;
  cacheTime?: number;
  cacheKey?: string;
  cacheOnMount?: boolean;
  initialCacheData?: ExtractFetchReturn<T> | null;
  initialData?: CacheValueType<ExtractResponse<T>, ExtractError<T>> | null;
  debounce?: boolean;
  debounceTime?: number;
  suspense?: boolean;
  shouldThrow?: boolean;
  cancelable?: boolean;
  offline?: boolean;
  mapperFn?: ((data: ExtractResponse<T>) => MapperResponse) | null;
  deepCompareFn?:
    | ((
        previousValues: ClientResponseType<ExtractResponse<T>, ExtractError<T>>,
        newValues: ClientResponseType<ExtractResponse<T>, ExtractError<T>>,
      ) => boolean)
    | null;
};

export type UseSubmitReturnType<T extends FetchMiddlewareInstance, MapperResponse = unknown> = Omit<
  UseCacheStateType<ExtractResponse<T>, ExtractError<T>>,
  "data"
> & {
  data: null | (MapperResponse extends never ? ExtractResponse<T> : MapperResponse);
  actions: UseCacheStateActions<ExtractResponse<T>, ExtractError<T>>;
  onSuccess: (callback: OnSuccessCallbackType<ExtractResponse<T>>) => void;
  onError: (callback: OnErrorCallbackType<ExtractError<T>>) => void;
  onFinished: (callback: OnFinishedCallbackType<ExtractFetchReturn<T>>) => void;
  isRefreshed: boolean;
  isRefreshingError: boolean;
  isDebouncing: boolean;
  refresh: () => void;
  submit: FetchMethodType<
    MapperResponse extends never ? ExtractResponse<T> : MapperResponse,
    ExtractRequest<T>,
    ExtractError<T>,
    ExtractEndpoint<T>,
    ExtractHasData<T>,
    ExtractHasParams<T>,
    ExtractHasQueryParams<T>
  >;
};

export type OnSuccessCallbackType<DataType> = (data: DataType) => void;
export type OnErrorCallbackType<ErrorType> = (error: ErrorType) => void;
export type OnFinishedCallbackType<ResponseType> = (response: ResponseType) => void;
