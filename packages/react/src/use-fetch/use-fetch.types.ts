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

export type UseFetchReturnType<T extends CommandInstance> = UseDependentStateType<T> & {
  actions: UseDependentStateActions<T>;
  onSuccess: <Context = undefined>(callback: OnSuccessCallbackType<ExtractResponse<T>, Context>) => void;
  onError: <Context = undefined>(callback: OnErrorCallbackType<ExtractError<T>, Context>) => void;
  onFinished: <Context = undefined>(callback: OnFinishedCallbackType<ExtractFetchReturn<T>, Context>) => void;
  onRequestStart: <Context = undefined>(callback: OnStartCallbackType<T, Context>) => void;
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
