import {
  CommandInstance,
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

export type UseCacheOptionsType<T extends CommandInstance> = {
  dependencyTracking?: boolean;
  initialData?: CacheValueType<ExtractResponse<T>, ExtractError<T>>["data"] | null;
  deepCompare?: boolean | typeof isEqual;
};

export type UseCacheReturnType<T extends CommandInstance> = UseDependentStateType<T> & {
  actions: UseDependentStateActions<T>;
  onCacheSuccess: <Context = undefined>(callback: OnSuccessCallbackType<ExtractResponse<T>, Context>) => void;
  onCacheError: <Context = undefined>(callback: OnErrorCallbackType<ExtractError<T>, Context>) => void;
  onCacheChange: <Context = undefined>(callback: OnFinishedCallbackType<ExtractFetchReturn<T>, Context>) => void;
  isStale: boolean;
  isRefreshingError: boolean;
  revalidate: (revalidateKey?: string | CommandInstance) => void;
};
