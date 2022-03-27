import {
  CacheValueType,
  ExtractError,
  ExtractResponse,
  FetchCommandInstance,
  ExtractFetchReturn,
} from "@better-typed/hyper-fetch";

import { isEqual } from "utils";
import {
  OnErrorCallbackType,
  OnFinishedCallbackType,
  OnProgressCallbackType,
  OnRequestCallbackType,
  OnStartCallbackType,
  OnSuccessCallbackType,
} from "utils/use-command-state";

import { UseDependentStateType, UseDependentStateActions } from "utils/use-dependent-state";

export type UseSubmitOptionsType<T extends FetchCommandInstance> = {
  disabled?: boolean;
  invalidate?: (string | FetchCommandInstance)[];
  cacheOnMount?: boolean;
  initialData?: CacheValueType<ExtractResponse<T>, ExtractError<T>>["data"] | null;
  debounce?: boolean;
  debounceTime?: number;
  suspense?: boolean;
  shouldThrow?: boolean;
  dependencyTracking?: boolean;
  deepCompare?: boolean | typeof isEqual;
};

export type UseSubmitReturnType<T extends FetchCommandInstance> = Omit<
  UseDependentStateType<ExtractResponse<T>, ExtractError<T>>,
  "loading"
> & {
  actions: UseDependentStateActions<ExtractResponse<T>, ExtractError<T>>;
  onSubmitRequest: (callback: OnRequestCallbackType) => void;
  onSubmitSuccess: (callback: OnSuccessCallbackType<ExtractResponse<T>>) => void;
  onSubmitError: (callback: OnErrorCallbackType<ExtractError<T>>) => void;
  onSubmitFinished: (callback: OnFinishedCallbackType<ExtractFetchReturn<T>>) => void;
  onSubmitRequestStart: (callback: OnStartCallbackType<T>) => void;
  onSubmitResponseStart: (callback: OnStartCallbackType<T>) => void;
  onSubmitDownloadProgress: (callback: OnProgressCallbackType) => void;
  onSubmitUploadProgress: (callback: OnProgressCallbackType) => void;
  submit: (...parameters: Parameters<T["send"]>) => void;
  submitting: boolean;
  isStale: boolean;
  isDebouncing: boolean;
  invalidate: (invalidateKey: string | FetchCommandInstance | RegExp) => void;
};
