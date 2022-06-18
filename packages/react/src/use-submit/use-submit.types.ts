import {
  CacheValueType,
  ExtractError,
  ExtractResponse,
  CommandInstance,
  ExtractFetchReturn,
} from "@better-typed/hyper-fetch";

import { isEqual } from "utils";
import {
  OnErrorCallbackType,
  OnFinishedCallbackType,
  OnProgressCallbackType,
  OnStartCallbackType,
  OnSuccessCallbackType,
  UseDependentStateType,
  UseDependentStateActions,
} from "helpers";

export type UseSubmitOptionsType<T extends CommandInstance> = {
  disabled?: boolean;
  invalidate?: (string | CommandInstance)[];
  cacheOnMount?: boolean;
  initialData?: CacheValueType<ExtractResponse<T>, ExtractError<T>>["data"] | null;
  debounce?: boolean;
  debounceTime?: number;
  suspense?: boolean;
  shouldThrow?: boolean;
  dependencyTracking?: boolean;
  deepCompare?: boolean | typeof isEqual;
};

export type UseSubmitReturnType<T extends CommandInstance> = Omit<UseDependentStateType<T>, "loading"> & {
  actions: UseDependentStateActions<T>;
  onSubmitSuccess: (callback: OnSuccessCallbackType<ExtractResponse<T>>) => void;
  onSubmitError: (callback: OnErrorCallbackType<ExtractError<T>>) => void;
  onSubmitFinished: (callback: OnFinishedCallbackType<ExtractFetchReturn<T>>) => void;
  onSubmitRequestStart: (callback: OnStartCallbackType<T>) => void;
  onSubmitResponseStart: (callback: OnStartCallbackType<T>) => void;
  onSubmitDownloadProgress: (callback: OnProgressCallbackType) => void;
  onSubmitUploadProgress: (callback: OnProgressCallbackType) => void;
  submit: (...parameters: Parameters<T["send"]>) => void;
  submitting: boolean;
  abort: VoidFunction;
  isStale: boolean;
  isDebouncing: boolean;
  revalidate: (revalidateKey: string | CommandInstance | RegExp) => void;
};
