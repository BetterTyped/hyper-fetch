import { CommandInstance, ExtractFetchReturn, ExtractResponse, ExtractError, CacheValueType } from "@better-typed/hyper-fetch";
import { isEqual } from "utils";
import { OnErrorCallbackType, OnFinishedCallbackType, OnSuccessCallbackType, UseDependentStateActions, UseDependentStateType } from "helpers";
export declare type UseCacheOptionsType<T extends CommandInstance> = {
    dependencyTracking?: boolean;
    initialData?: CacheValueType<ExtractResponse<T>, ExtractError<T>>["data"] | null;
    deepCompare?: boolean | typeof isEqual;
};
export declare type UseCacheReturnType<T extends CommandInstance> = UseDependentStateType<T> & {
    actions: UseDependentStateActions<T>;
    onCacheSuccess: (callback: OnSuccessCallbackType<ExtractResponse<T>>) => void;
    onCacheError: (callback: OnErrorCallbackType<ExtractError<T>>) => void;
    onCacheChange: (callback: OnFinishedCallbackType<ExtractFetchReturn<T>>) => void;
    isStale: boolean;
    isRefreshingError: boolean;
    revalidate: (revalidateKey?: string | CommandInstance) => void;
};
