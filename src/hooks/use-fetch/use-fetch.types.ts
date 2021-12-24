import { FetchCommandInstance } from "command";
import { ExtractFetchReturn, ExtractResponse, ExtractError } from "types";
import { CacheValueType } from "cache";
import { FetchLoadingEventType } from "queues";
import { UseDependentStateActions, UseDependentStateType } from "../use-dependent-state/use-dependent-state.types";

export type UseFetchOptionsType<T extends FetchCommandInstance, MapperResponse> = {
  dependencies?: any[];
  disabled?: boolean;
  revalidateOnMount?: boolean;
  cacheOnMount?: boolean;
  cacheKey?: string;
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
  mapperFn?: ((data: ExtractResponse<T>) => MapperResponse) | null;
};

export type UseFetchReturnType<T extends FetchCommandInstance, MapperResponse = unknown> = Omit<
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
  refresh: (invalidateKey?: string | FetchCommandInstance) => void;
};

export type OnRequestCallbackType = (options: Omit<FetchLoadingEventType, "isLoading">) => void;
export type OnSuccessCallbackType<DataType> = (data: DataType) => void;
export type OnErrorCallbackType<ErrorType> = (error: ErrorType) => void;
export type OnFinishedCallbackType<ResponseType> = (response: ResponseType) => void;
