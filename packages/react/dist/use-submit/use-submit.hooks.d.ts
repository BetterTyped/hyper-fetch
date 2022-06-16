import { CommandInstance } from "@better-typed/hyper-fetch";
import { UseSubmitOptionsType } from "use-submit";
/**
 * This hooks aims to mutate data on the server.
 * @param command
 * @param options
 * @returns
 */
export declare const useSubmit: <T extends Command<any, any, any, any, any, any, any, any, any, any, any>>(commandInstance: T, { disabled, dependencyTracking, initialData, debounce, debounceTime, deepCompare, }?: UseSubmitOptionsType<T>) => {
    isDebouncing: boolean;
    isRefreshed: boolean;
    revalidate: (invalidateKey: string | CommandInstance | RegExp) => void;
    onSubmitRequest: (callback: import("helpers").OnRequestCallbackType) => void;
    onSubmitSuccess: (callback: import("helpers").OnSuccessCallbackType<import("@better-typed/hyper-fetch").ExtractResponse<T>>) => void;
    onSubmitError: (callback: import("helpers").OnErrorCallbackType<import("@better-typed/hyper-fetch").ExtractError<T>>) => void;
    onSubmitFinished: (callback: import("helpers").OnFinishedCallbackType<ClientResponseType<import("@better-typed/hyper-fetch").ExtractResponse<T_1>, import("@better-typed/hyper-fetch").ExtractError<T_1>>>) => void;
    onSubmitRequestStart: (callback: import("helpers").OnStartCallbackType<T>) => void;
    onSubmitResponseStart: (callback: import("helpers").OnStartCallbackType<T>) => void;
    onSubmitDownloadProgress: (callback: import("helpers").OnProgressCallbackType) => void;
    onSubmitUploadProgress: (callback: import("helpers").OnProgressCallbackType) => void;
    onSubmitOfflineError: (callback: import("helpers").OnErrorCallbackType<import("@better-typed/hyper-fetch").ExtractError<T>>) => void;
    onSubmitAbort: (callback: import("helpers").OnErrorCallbackType<import("@better-typed/hyper-fetch").ExtractError<T>>) => void;
    setData: (data: import("@better-typed/hyper-fetch").ExtractResponse<T>, emitToCache?: boolean) => void;
    setError: (error: import("@better-typed/hyper-fetch").ExtractError<T>, emitToCache?: boolean) => void;
    setLoading: (loading: boolean, emitToHooks?: boolean) => void;
    setStatus: (status: number, emitToCache?: boolean) => void;
    setRetries: (retries: number, emitToCache?: boolean) => void;
    setTimestamp: (timestamp: Date, emitToCache?: boolean) => void;
    submit: (...parameters: Parameters<T["send"]>) => number[] | Promise<any>;
    data: import("@better-typed/hyper-fetch").ExtractResponse<T>;
    error: import("@better-typed/hyper-fetch").ExtractError<T>;
    submitting: boolean;
    status: number;
    retries: number;
    timestamp: Date;
    abort: () => void;
};
