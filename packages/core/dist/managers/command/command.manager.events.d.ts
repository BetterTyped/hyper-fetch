import EventEmitter from "events";
import { CommandEventDetails, CommandResponseDetails } from "managers";
import { FetchProgressType, ClientResponseType } from "client";
import { CommandInstance } from "command";
export declare const getCommandManagerEvents: (emitter: EventEmitter) => {
    /**
     * Emiter
     */
    emitRequestStart: (queueKey: string, requestId: string, details: CommandEventDetails<CommandInstance>) => void;
    emitResponseStart: (queueKey: string, requestId: string, details: CommandEventDetails<CommandInstance>) => void;
    emitUploadProgress: (queueKey: string, requestId: string, values: FetchProgressType, details: CommandEventDetails<CommandInstance>) => void;
    emitDownloadProgress: (queueKey: string, requestId: string, values: FetchProgressType, details: CommandEventDetails<CommandInstance>) => void;
    emitResponse: (cacheKey: string, requestId: string, response: ClientResponseType<unknown, unknown>, details: CommandResponseDetails) => void;
    emitAbort: (abortKey: string, requestId: string, command: CommandInstance) => void;
    /**
     * Listeners
     */
    onRequestStart: <T extends CommandInstance>(queueKey: string, callback: (details: CommandEventDetails<T>) => void) => VoidFunction;
    onRequestStartById: <T_1 extends CommandInstance>(requestId: string, callback: (details: CommandEventDetails<T_1>) => void) => VoidFunction;
    onResponseStart: <T_2 extends CommandInstance>(queueKey: string, callback: (details: CommandEventDetails<T_2>) => void) => VoidFunction;
    onResponseStartById: <T_3 extends CommandInstance>(requestId: string, callback: (details: CommandEventDetails<T_3>) => void) => VoidFunction;
    onUploadProgress: <T_4 extends CommandInstance = CommandInstance>(queueKey: string, callback: (values: FetchProgressType, details: CommandEventDetails<T_4>) => void) => VoidFunction;
    onUploadProgressById: <T_5 extends CommandInstance = CommandInstance>(requestId: string, callback: (values: FetchProgressType, details: CommandEventDetails<T_5>) => void) => VoidFunction;
    onDownloadProgress: <T_6 extends CommandInstance = CommandInstance>(queueKey: string, callback: (values: FetchProgressType, details: CommandEventDetails<T_6>) => void) => VoidFunction;
    onDownloadProgressById: <T_7 extends CommandInstance = CommandInstance>(requestId: string, callback: (values: FetchProgressType, details: CommandEventDetails<T_7>) => void) => VoidFunction;
    onResponse: <ResponseType_1, ErrorType>(queueKey: string, callback: (response: ClientResponseType<ResponseType_1, ErrorType>, details: CommandResponseDetails) => void) => VoidFunction;
    onResponseById: <ResponseType_2, ErrorType_1>(requestId: string, callback: (response: ClientResponseType<ResponseType_2, ErrorType_1>, details: CommandResponseDetails) => void) => VoidFunction;
    onAbort: (abortKey: string, callback: (command: CommandInstance) => void) => VoidFunction;
    onAbortById: (requestId: string, callback: (command: CommandInstance) => void) => VoidFunction;
};
