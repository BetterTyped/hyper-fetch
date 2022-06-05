import {
  CommandInstance,
  ExtractFetchReturn,
  ExtractResponse,
  ExtractError,
  CacheValueType,
} from "@better-typed/hyper-fetch";

import {
  OnErrorCallbackType,
  OnFinishedCallbackType,
  OnProgressCallbackType,
  OnRequestCallbackType,
  OnStartCallbackType,
  OnSuccessCallbackType,
  UseDependentStateActions,
  UseDependentStateType,
} from "helpers";
import { isEqual } from "utils";

export type UseFetchOptionsType<T extends CommandInstance> = {
  dependencies?: any[];
  disabled?: boolean;
  dependencyTracking?: boolean;
  revalidateOnMount?: boolean;
  initialData?: CacheValueType<ExtractResponse<T>, ExtractError<T>>["data"] | null;
  refresh?: boolean;
  refreshTime?: number;
  refreshBlurred?: boolean;
  refreshOnTabBlur?: boolean;
  refreshOnTabFocus?: boolean;
  refreshOnReconnect?: boolean;
  debounce?: boolean;
  debounceTime?: number;
  deepCompare?: boolean | typeof isEqual;
};

export type UseFetchReturnType<T extends CommandInstance> = UseDependentStateType<
  ExtractResponse<T>,
  ExtractError<T>
> & {
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
  revalidate: (invalidateKey?: string | CommandInstance) => void;
  abort: VoidFunction;
};
