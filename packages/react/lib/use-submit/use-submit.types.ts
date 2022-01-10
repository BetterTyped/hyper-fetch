import {
  FetchMethodType,
  FetchCommandInstance,
  ExtractFetchReturn,
  ExtractResponse,
  ExtractError,
  ExtractRequest,
  ExtractEndpoint,
  ExtractHasData,
  ExtractHasParams,
  ExtractHasQueryParams,
  CacheValueType,
  ClientResponseType,
} from "@better-typed/hyper-fetch";
import { UseDependentStateActions, UseDependentStateType } from "../use-dependent-state/use-dependent-state.types";

export type UseSubmitOptionsType<T extends FetchCommandInstance, MapperResponse> = {
  disabled?: boolean;
  queueKey: string;
  invalidate: (string | FetchCommandInstance)[];
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

export type UseSubmitReturnType<T extends FetchCommandInstance, MapperResponse = unknown> = Omit<
  UseDependentStateType<ExtractResponse<T>, ExtractError<T>>,
  "data"
> & {
  data: null | (MapperResponse extends never ? ExtractResponse<T> : MapperResponse);
  actions: UseDependentStateActions<ExtractResponse<T>, ExtractError<T>>;
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
    any,
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
