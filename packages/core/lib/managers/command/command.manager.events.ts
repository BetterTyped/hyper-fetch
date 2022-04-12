import EventEmitter from "events";

import {
  getRequestStartEventKey,
  getResponseStartEventKey,
  getDownloadProgressEventKey,
  getUploadProgressEventKey,
  getRequestIdEventKey,
  getAbortEventKey,
  getResponseEventKey,
  CommandEventDetails,
  CommandResponseDetails,
} from "managers";
import { CacheKeyType } from "cache";
import { FetchProgressType, ClientResponseType } from "client";
import { FetchCommandInstance } from "command";

export const getCommandManagerEvents = (emitter: EventEmitter) => ({
  /**
   * Emiter
   */

  // Start
  emitRequestStart: (queueKey: CacheKeyType, details: CommandEventDetails<FetchCommandInstance>): void => {
    emitter.emit(getRequestStartEventKey(queueKey), details);
  },
  emitResponseStart: (queueKey: CacheKeyType, details: CommandEventDetails<FetchCommandInstance>): void => {
    emitter.emit(getResponseStartEventKey(queueKey), details);
  },
  // Progress
  emitUploadProgress: (
    queueKey: CacheKeyType,
    values: FetchProgressType,
    details: CommandEventDetails<FetchCommandInstance>,
  ): void => {
    emitter.emit(getUploadProgressEventKey(queueKey), values, details);
  },
  emitDownloadProgress: (
    queueKey: CacheKeyType,
    values: FetchProgressType,
    details: CommandEventDetails<FetchCommandInstance>,
  ): void => {
    emitter.emit(getDownloadProgressEventKey(queueKey), values, details);
  },
  // Response
  emitResponse: (
    queueKey: CacheKeyType,
    response: ClientResponseType<unknown, unknown>,
    details: CommandResponseDetails,
  ): void => {
    emitter.emit(getResponseEventKey(queueKey), response, details);
  },
  // Response by requestId
  emitResponseById: (
    requestId: CacheKeyType,
    response: ClientResponseType<unknown, unknown>,
    details: CommandResponseDetails,
  ): void => {
    emitter.emit(getRequestIdEventKey(requestId), response, details);
  },
  // Abort
  emitAbort: (queueKey: CacheKeyType, command: FetchCommandInstance): void => {
    emitter.emit(getAbortEventKey(queueKey), command);
  },

  /**
   * Listeners
   */

  // Start
  onRequestStart: <T extends FetchCommandInstance>(
    queueKey: CacheKeyType,
    callback: (details: CommandEventDetails<T>) => void,
  ): VoidFunction => {
    emitter.on(getRequestStartEventKey(queueKey), callback);
    return () => emitter.removeListener(getRequestStartEventKey(queueKey), callback);
  },
  onResponseStart: <T extends FetchCommandInstance>(
    queueKey: CacheKeyType,
    callback: (details: CommandEventDetails<T>) => void,
  ): VoidFunction => {
    emitter.on(getResponseStartEventKey(queueKey), callback);
    return () => emitter.removeListener(getResponseStartEventKey(queueKey), callback);
  },
  // Progress
  onUploadProgress: <T extends FetchCommandInstance = FetchCommandInstance>(
    queueKey: CacheKeyType,
    callback: (values: FetchProgressType, details: CommandEventDetails<T>) => void,
  ): VoidFunction => {
    emitter.on(getUploadProgressEventKey(queueKey), callback);
    return () => emitter.removeListener(getUploadProgressEventKey(queueKey), callback);
  },
  onDownloadProgress: <T extends FetchCommandInstance = FetchCommandInstance>(
    queueKey: CacheKeyType,
    callback: (values: FetchProgressType, details: CommandEventDetails<T>) => void,
  ): VoidFunction => {
    emitter.on(getDownloadProgressEventKey(queueKey), callback);
    return () => emitter.removeListener(getDownloadProgressEventKey(queueKey), callback);
  },
  // Response
  onResponse: <ResponseType, ErrorType>(
    queueKey: CacheKeyType,
    callback: (response: ClientResponseType<ResponseType, ErrorType>, details: CommandResponseDetails) => void,
  ): VoidFunction => {
    emitter.on(getResponseEventKey(queueKey), callback);
    return () => emitter.removeListener(getResponseEventKey(queueKey), callback);
  },
  // Response by requestId
  onResponseById: <ResponseType, ErrorType>(
    queueKey: CacheKeyType,
    callback: (response: ClientResponseType<ResponseType, ErrorType>, details: CommandResponseDetails) => void,
  ): VoidFunction => {
    emitter.on(getResponseEventKey(queueKey), callback);
    return () => emitter.removeListener(getResponseEventKey(queueKey), callback);
  },
  // Abort
  onAbort: (queueKey: CacheKeyType, callback: (command: FetchCommandInstance) => void): VoidFunction => {
    emitter.on(getAbortEventKey(queueKey), callback);
    return () => emitter.removeListener(getAbortEventKey(queueKey), callback);
  },

  /**
   * Unmounting
   */

  umount: <T extends (...args: any[]) => void>(key: CacheKeyType, callback: T): void => {
    emitter.removeListener(key, callback);
  },
});
