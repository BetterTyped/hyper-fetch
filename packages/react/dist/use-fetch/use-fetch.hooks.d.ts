import { CommandInstance } from "@better-typed/hyper-fetch";
import { UseFetchOptionsType } from "use-fetch";
/**
 * This hooks aims to retrieve data from server.
 * @param command Command instance
 * @param options Hook options
 * @returns
 */
export declare const useFetch: <T extends Command<any, any, any, any, any, any, any, any, any, any, any>>(command: T, { dependencies, disabled, dependencyTracking, revalidateOnMount, initialData, refresh, refreshTime, refreshBlurred, refreshOnTabBlur, refreshOnTabFocus, refreshOnReconnect, debounce, debounceTime, deepCompare, }?: UseFetchOptionsType<T>) => {
    isDebouncing: boolean;
    revalidate: (invalidateKey?: string | CommandInstance | RegExp) => void;
    abort: () => void;
    onSuccess: (callback: import("helpers").OnSuccessCallbackType<import("@better-typed/hyper-fetch").ExtractResponse<T>>) => void;
    onError: (callback: import("helpers").OnErrorCallbackType<import("@better-typed/hyper-fetch").ExtractError<T>>) => void;
    onAbort: (callback: import("helpers").OnErrorCallbackType<import("@better-typed/hyper-fetch").ExtractError<T>>) => void;
    onOfflineError: (callback: import("helpers").OnErrorCallbackType<import("@better-typed/hyper-fetch").ExtractError<T>>) => void;
    onFinished: (callback: import("helpers").OnFinishedCallbackType<ClientResponseType<import("@better-typed/hyper-fetch").ExtractResponse<T_1>, import("@better-typed/hyper-fetch").ExtractError<T_1>>>) => void;
    onRequestStart: (callback: import("helpers").OnStartCallbackType<T>) => void;
    onResponseStart: (callback: import("helpers").OnStartCallbackType<T>) => void;
    onDownloadProgress: (callback: import("helpers").OnProgressCallbackType) => void;
    onUploadProgress: (callback: import("helpers").OnProgressCallbackType) => void;
    setData: (data: import("@better-typed/hyper-fetch").ExtractResponse<T>, emitToCache?: boolean) => void;
    setError: (error: import("@better-typed/hyper-fetch").ExtractError<T>, emitToCache?: boolean) => void;
    setLoading: (loading: boolean, emitToHooks?: boolean) => void;
    setStatus: (status: number, emitToCache?: boolean) => void;
    setRetries: (retries: number, emitToCache?: boolean) => void;
    setTimestamp: (timestamp: Date, emitToCache?: boolean) => void;
    data: import("@better-typed/hyper-fetch").ExtractResponse<T>;
    error: import("@better-typed/hyper-fetch").ExtractError<T>;
    loading: boolean;
    status: number;
    retries: number;
    timestamp: Date;
};
