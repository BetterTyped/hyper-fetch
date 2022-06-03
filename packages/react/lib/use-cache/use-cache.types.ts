import {
  FetchCommandInstance,
  ExtractFetchReturn,
  ExtractResponse,
  ExtractError,
  CacheValueType,
} from "@better-typed/hyper-fetch";

import { isEqual } from "utils";
import {
  OnErrorCallbackType,
  OnFinishedCallbackType,
  OnSuccessCallbackType,
  UseDependentStateActions,
  UseDependentStateType,
} from "helpers";

export type UseCacheOptionsType<T extends FetchCommandInstance> = {
  dependencyTracking?: boolean;
  initialData?: CacheValueType<ExtractResponse<T>, ExtractError<T>>["data"] | null;
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
  revalidate: (revalidateKey?: string | FetchCommandInstance) => void;
};
