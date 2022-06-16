/// <reference types="node" />
import EventEmitter from "events";
/**
 * **Command Manager** is used to emit `command lifecycle events` like - request start, request end, upload and download progress.
 * It is also the place of `request aborting` system, here we store all the keys and controllers that are isolated for each builder instance.
 */
export declare class CommandManager {
    emitter: EventEmitter;
    events: {
        emitRequestStart: (queueKey: string, requestId: string, details: import("managers").CommandEventDetails<import("../..").CommandInstance>) => void;
        emitResponseStart: (queueKey: string, requestId: string, details: import("managers").CommandEventDetails<import("../..").CommandInstance>) => void;
        emitUploadProgress: (queueKey: string, requestId: string, values: import("../..").FetchProgressType, details: import("managers").CommandEventDetails<import("../..").CommandInstance>) => void;
        emitDownloadProgress: (queueKey: string, requestId: string, values: import("../..").FetchProgressType, details: import("managers").CommandEventDetails<import("../..").CommandInstance>) => void;
        emitResponse: (cacheKey: string, requestId: string, response: import("../..").ClientResponseType<unknown, unknown>, details: import("managers").CommandResponseDetails) => void;
        emitAbort: (abortKey: string, requestId: string, command: import("../..").CommandInstance) => void;
        onRequestStart: <T extends import("../..").CommandInstance>(queueKey: string, callback: (details: import("managers").CommandEventDetails<T>) => void) => VoidFunction;
        onRequestStartById: <T_1 extends import("../..").CommandInstance>(requestId: string, callback: (details: import("managers").CommandEventDetails<T_1>) => void) => VoidFunction;
        onResponseStart: <T_2 extends import("../..").CommandInstance>(queueKey: string, callback: (details: import("managers").CommandEventDetails<T_2>) => void) => VoidFunction;
        onResponseStartById: <T_3 extends import("../..").CommandInstance>(requestId: string, callback: (details: import("managers").CommandEventDetails<T_3>) => void) => VoidFunction;
        onUploadProgress: <T_4 extends import("../..").CommandInstance = import("../..").CommandInstance>(queueKey: string, callback: (values: import("../..").FetchProgressType, details: import("managers").CommandEventDetails<T_4>) => void) => VoidFunction;
        onUploadProgressById: <T_5 extends import("../..").CommandInstance = import("../..").CommandInstance>(requestId: string, callback: (values: import("../..").FetchProgressType, details: import("managers").CommandEventDetails<T_5>) => void) => VoidFunction;
        onDownloadProgress: <T_6 extends import("../..").CommandInstance = import("../..").CommandInstance>(queueKey: string, callback: (values: import("../..").FetchProgressType, details: import("managers").CommandEventDetails<T_6>) => void) => VoidFunction;
        onDownloadProgressById: <T_7 extends import("../..").CommandInstance = import("../..").CommandInstance>(requestId: string, callback: (values: import("../..").FetchProgressType, details: import("managers").CommandEventDetails<T_7>) => void) => VoidFunction;
        onResponse: <ResponseType_1, ErrorType>(queueKey: string, callback: (response: import("../..").ClientResponseType<ResponseType_1, ErrorType>, details: import("managers").CommandResponseDetails) => void) => VoidFunction;
        onResponseById: <ResponseType_2, ErrorType_1>(requestId: string, callback: (response: import("../..").ClientResponseType<ResponseType_2, ErrorType_1>, details: import("managers").CommandResponseDetails) => void) => VoidFunction;
        onAbort: (abortKey: string, callback: (command: import("../..").CommandInstance) => void) => VoidFunction;
        onAbortById: (requestId: string, callback: (command: import("../..").CommandInstance) => void) => VoidFunction;
    };
    abortControllers: Map<string, Map<string, AbortController>>;
    addAbortController: (abortKey: string, requestId: string) => void;
    getAbortController: (abortKey: string, requestId: string) => AbortController;
    removeAbortController: (abortKey: string, requestId: string) => void;
    useAbortController: (abortKey: string, requestId: string) => void;
    abortByKey: (abortKey: string) => void;
    abortByRequestId: (abortKey: string, requestId: string) => void;
    abortAll: () => void;
}
