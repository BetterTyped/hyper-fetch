import { CommandInstance, ExtractResponse, ExtractError, CacheValueType } from "@better-typed/hyper-fetch";

import {
  OnErrorCallbackType,
  OnFinishedCallbackType,
  OnProgressCallbackType,
  OnStartCallbackType,
  OnSuccessCallbackType,
  UseTrackedStateActions,
  UseTrackedStateType,
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

export type UseFetchReturnType<T extends CommandInstance> = UseTrackedStateType<T> & {
  actions: UseTrackedStateActions<T>;
  onSuccess: (callback: OnSuccessCallbackType<T>) => void;
  onError: (callback: OnErrorCallbackType<T>) => void;
  onFinished: (callback: OnFinishedCallbackType<T>) => void;
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
