import {
  FetchCommandInstance,
  ExtractFetchReturn,
  ExtractResponse,
  ExtractError,
  CacheValueType,
} from "@better-typed/hyper-fetch";

import { OnErrorCallbackType, OnFinishedCallbackType, OnSuccessCallbackType } from "utils/use-command-state";
import { UseDependentStateActions, UseDependentStateType } from "utils/use-dependent-state";
import { isEqual } from "utils";

export type UseCacheOptionsType<T extends FetchCommandInstance> = {
  dependencyTracking?: boolean;
  initialData?: CacheValueType<ExtractResponse<T>, ExtractError<T>>["response"] | null;
  deepCompare?: boolean | typeof isEqual;
};

export type UseCacheReturnType<T extends FetchCommandInstance> = UseDependentStateType<
  ExtractResponse<T>,
  ExtractError<T>
> & {
  actions: UseDependentStateActions<ExtractResponse<T>, ExtractError<T>>;
  onCacheSuccess: (callback: OnSuccessCallbackType<ExtractResponse<T>>) => void;
  onCacheError: (callback: OnErrorCallbackType<ExtractError<T>>) => void;
  onCacheChange: (callback: OnFinishedCallbackType<ExtractFetchReturn<T>>) => void;
  isStale: boolean;
  isRefreshingError: boolean;
  invalidate: (invalidateKey?: string | FetchCommandInstance) => void;
};
