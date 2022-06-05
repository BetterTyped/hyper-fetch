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
  CommandEventDetails,
  CommandResponseDetails,
} from "managers";
import { FetchProgressType, ClientResponseType } from "client";
import { CommandInstance } from "command";

export const getCommandManagerEvents = (emitter: EventEmitter) => ({
  /**
   * Emiter
   */

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
    queueKey: string,
    requestId: string,
    response: ClientResponseType<unknown, unknown>,
    details: CommandResponseDetails,
  ): void => {
    emitter.emit(getResponseIdEventKey(requestId), response, details);
    emitter.emit(getResponseEventKey(queueKey), response, details);
  },
  // Abort
  emitAbort: (abortKey: string, requestId: string, command: CommandInstance): void => {
    emitter.emit(getAbortByIdEventKey(requestId), command);
    emitter.emit(getAbortEventKey(abortKey), command);
  },

  /**
   * Listeners
   */

  // Start
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
    queueKey: string,
    callback: (response: ClientResponseType<ResponseType, ErrorType>, details: CommandResponseDetails) => void,
  ): VoidFunction => {
    emitter.on(getResponseEventKey(queueKey), callback);
    return () => emitter.removeListener(getResponseEventKey(queueKey), callback);
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
});
