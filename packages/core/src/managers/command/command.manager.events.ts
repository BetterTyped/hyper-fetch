import EventEmitter from "events";

import {
  getRequestStartEventKey,
  getResponseStartEventKey,
  getDownloadProgressEventKey,
  getUploadProgressEventKey,
  getResponseIdEventKey,
  getAbortEventKey,
  getAbortByIdEventKey,
  getResponseEventKey,
  getUploadProgressIdEventKey,
  getDownloadProgressIdEventKey,
  getResponseStartIdEventKey,
  getRequestStartIdEventKey,
  getLoadingEventKey,
  getLoadingIdEventKey,
  CommandEventDetails,
  CommandResponseDetails,
  CommandLoadingEventType,
  getRemoveEventKey,
  getRemoveIdEventKey,
} from "managers";
import { FetchProgressType, ClientResponseType } from "client";
import { CommandInstance } from "command";

export const getCommandManagerEvents = (emitter: EventEmitter) => ({
  /**
   * Emiter
   */

  // Loading
  emitLoading: (queueKey: string, requestId: string, values: CommandLoadingEventType): void => {
    emitter.emit(getLoadingIdEventKey(requestId), values);
    emitter.emit(getLoadingEventKey(queueKey), values);
  },

  // Start
  emitRequestStart: (queueKey: string, requestId: string, details: CommandEventDetails<CommandInstance>): void => {
    emitter.emit(getRequestStartIdEventKey(requestId), details);
    emitter.emit(getRequestStartEventKey(queueKey), details);
  },
  emitResponseStart: (queueKey: string, requestId: string, details: CommandEventDetails<CommandInstance>): void => {
    emitter.emit(getResponseStartIdEventKey(requestId), details);
    emitter.emit(getResponseStartEventKey(queueKey), details);
  },

  // Progress
  emitUploadProgress: (
    queueKey: string,
    requestId: string,
    values: FetchProgressType,
    details: CommandEventDetails<CommandInstance>,
  ): void => {
    emitter.emit(getUploadProgressIdEventKey(requestId), values, details);
    emitter.emit(getUploadProgressEventKey(queueKey), values, details);
  },
  emitDownloadProgress: (
    queueKey: string,
    requestId: string,
    values: FetchProgressType,
    details: CommandEventDetails<CommandInstance>,
  ): void => {
    emitter.emit(getDownloadProgressIdEventKey(requestId), values, details);
    emitter.emit(getDownloadProgressEventKey(queueKey), values, details);
  },

  // Response
  emitResponse: (
    cacheKey: string,
    requestId: string,
    response: ClientResponseType<unknown, unknown>,
    details: CommandResponseDetails,
  ): void => {
    emitter.emit(getResponseIdEventKey(requestId), response, details);
    emitter.emit(getResponseEventKey(cacheKey), response, details);
  },

  // Abort
  emitAbort: (abortKey: string, requestId: string, command: CommandInstance): void => {
    emitter.emit(getAbortByIdEventKey(requestId), command);
    emitter.emit(getAbortEventKey(abortKey), command);
  },

  // Remove
  emitRemove: <T extends CommandInstance>(
    queueKey: string,
    requestId: string,
    details: CommandEventDetails<T>,
  ): void => {
    emitter.emit(getRemoveEventKey(queueKey), details);
    emitter.emit(getRemoveIdEventKey(requestId), details);
  },

  /**
   * Listeners
   */

  // Loading
  onLoading: (queueKey: string, callback: (values: CommandLoadingEventType) => void): VoidFunction => {
    emitter.on(getLoadingEventKey(queueKey), callback);
    return () => emitter.removeListener(getLoadingEventKey(queueKey), callback);
  },
  onLoadingById: (requestId: string, callback: (values: CommandLoadingEventType) => void): VoidFunction => {
    emitter.on(getLoadingIdEventKey(requestId), callback);
    return () => emitter.removeListener(getLoadingIdEventKey(requestId), callback);
  },

  // Request Start
  onRequestStart: <T extends CommandInstance>(
    queueKey: string,
    callback: (details: CommandEventDetails<T>) => void,
  ): VoidFunction => {
    emitter.on(getRequestStartEventKey(queueKey), callback);
    return () => emitter.removeListener(getRequestStartEventKey(queueKey), callback);
  },
  onRequestStartById: <T extends CommandInstance>(
    requestId: string,
    callback: (details: CommandEventDetails<T>) => void,
  ): VoidFunction => {
    emitter.on(getRequestStartIdEventKey(requestId), callback);
    return () => emitter.removeListener(getRequestStartIdEventKey(requestId), callback);
  },
  // Response Start
  onResponseStart: <T extends CommandInstance>(
    queueKey: string,
    callback: (details: CommandEventDetails<T>) => void,
  ): VoidFunction => {
    emitter.on(getResponseStartEventKey(queueKey), callback);
    return () => emitter.removeListener(getResponseStartEventKey(queueKey), callback);
  },
  onResponseStartById: <T extends CommandInstance>(
    requestId: string,
    callback: (details: CommandEventDetails<T>) => void,
  ): VoidFunction => {
    emitter.on(getResponseStartIdEventKey(requestId), callback);
    return () => emitter.removeListener(getResponseStartIdEventKey(requestId), callback);
  },

  // Progress
  onUploadProgress: <T extends CommandInstance = CommandInstance>(
    queueKey: string,
    callback: (values: FetchProgressType, details: CommandEventDetails<T>) => void,
  ): VoidFunction => {
    emitter.on(getUploadProgressEventKey(queueKey), callback);
    return () => emitter.removeListener(getUploadProgressEventKey(queueKey), callback);
  },
  onUploadProgressById: <T extends CommandInstance = CommandInstance>(
    requestId: string,
    callback: (values: FetchProgressType, details: CommandEventDetails<T>) => void,
  ): VoidFunction => {
    emitter.on(getUploadProgressIdEventKey(requestId), callback);
    return () => emitter.removeListener(getUploadProgressIdEventKey(requestId), callback);
  },
  onDownloadProgress: <T extends CommandInstance = CommandInstance>(
    queueKey: string,
    callback: (values: FetchProgressType, details: CommandEventDetails<T>) => void,
  ): VoidFunction => {
    emitter.on(getDownloadProgressEventKey(queueKey), callback);
    return () => emitter.removeListener(getDownloadProgressEventKey(queueKey), callback);
  },
  onDownloadProgressById: <T extends CommandInstance = CommandInstance>(
    requestId: string,
    callback: (values: FetchProgressType, details: CommandEventDetails<T>) => void,
  ): VoidFunction => {
    emitter.on(getDownloadProgressIdEventKey(requestId), callback);
    return () => emitter.removeListener(getDownloadProgressIdEventKey(requestId), callback);
  },

  // Response
  onResponse: <ResponseType, ErrorType>(
    cacheKey: string,
    callback: (response: ClientResponseType<ResponseType, ErrorType>, details: CommandResponseDetails) => void,
  ): VoidFunction => {
    emitter.on(getResponseEventKey(cacheKey), callback);
    return () => emitter.removeListener(getResponseEventKey(cacheKey), callback);
  },
  // Response by requestId
  onResponseById: <ResponseType, ErrorType>(
    requestId: string,
    callback: (response: ClientResponseType<ResponseType, ErrorType>, details: CommandResponseDetails) => void,
  ): VoidFunction => {
    emitter.on(getResponseIdEventKey(requestId), callback);
    return () => emitter.removeListener(getResponseIdEventKey(requestId), callback);
  },

  // Abort
  onAbort: (abortKey: string, callback: (command: CommandInstance) => void): VoidFunction => {
    emitter.on(getAbortEventKey(abortKey), callback);
    return () => emitter.removeListener(getAbortEventKey(abortKey), callback);
  },
  onAbortById: (requestId: string, callback: (command: CommandInstance) => void): VoidFunction => {
    emitter.on(getAbortByIdEventKey(requestId), callback);
    return () => emitter.removeListener(getAbortByIdEventKey(requestId), callback);
  },

  // Remove
  onRemove: <T extends CommandInstance = CommandInstance>(
    queueKey: string,
    callback: (details: CommandEventDetails<T>) => void,
  ): VoidFunction => {
    emitter.on(getRemoveEventKey(queueKey), callback);
    return () => emitter.removeListener(getRemoveEventKey(queueKey), callback);
  },
  onRemoveById: <T extends CommandInstance = CommandInstance>(
    requestId: string,
    callback: (details: CommandEventDetails<T>) => void,
  ): VoidFunction => {
    emitter.on(getRemoveIdEventKey(requestId), callback);
    return () => emitter.removeListener(getRemoveIdEventKey(requestId), callback);
  },
});
