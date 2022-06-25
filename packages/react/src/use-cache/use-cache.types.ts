import { CommandInstance, ExtractResponse, ExtractError, CacheValueType } from "@better-typed/hyper-fetch";

import { isEqual } from "utils";
import {
  OnErrorCallbackType,
  OnFinishedCallbackType,
  OnSuccessCallbackType,
  UseDependentStateActions,
  UseDependentStateType,
} from "helpers";

export type UseCacheOptionsType<T extends CommandInstance> = {
  dependencyTracking?: boolean;
  initialData?: CacheValueType<ExtractResponse<T>, ExtractError<T>>["data"] | null;
  deepCompare?: boolean | typeof isEqual;
};

export type UseCacheReturnType<T extends CommandInstance> = UseDependentStateType<T> & {
  actions: UseDependentStateActions<T>;
  onCacheSuccess: (callback: OnSuccessCallbackType<T>) => void;
  onCacheError: (callback: OnErrorCallbackType<T>) => void;
  onCacheChange: (callback: OnFinishedCallbackType<T>) => void;
  isStale: boolean;
  isRefreshingError: boolean;
  revalidate: (revalidateKey?: string | CommandInstance) => void;
};
