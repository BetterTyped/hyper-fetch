import { CacheValueType, ExtractError, ExtractResponse, FetchCommandInstance } from "@better-typed/hyper-fetch";
import { UseDependentStateType } from "../use-dependent-state/use-dependent-state.types";

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
  "data" | "refreshError"
> & {
  data: null | (MapperResponse extends never ? ExtractResponse<T> : MapperResponse);
  // actions: UseDependentStateActions<ExtractResponse<T>, ExtractError<T>>;
  // onSubmitSuccess: (callback: OnSuccessCallbackType<ExtractResponse<T>>) => void;
  // onSubmitError: (callback: OnErrorCallbackType<ExtractError<T>>) => void;
  // onSubmitFinished: (callback: OnFinishedCallbackType<ExtractFetchReturn<T>>) => void;
  isStale: boolean;
  isDebouncing: boolean;
  refresh: () => void;
  submit: () => void;
};

export type OnSuccessCallbackType<DataType> = (data: DataType) => void;
export type OnErrorCallbackType<ErrorType> = (error: ErrorType) => void;
export type OnFinishedCallbackType<ResponseType> = (response: ResponseType) => void;
