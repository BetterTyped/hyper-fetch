import EventEmitter from "events";

import {
  getRequestStartEventKey,
  getResponseStartEventKey,
  getDownloadProgressEventKey,
  getUploadProgressEventKey,
  getAbortEventKey,
  getResponseEventKey,
  CommandEventDetails,
} from "managers";
import { CacheKeyType } from "cache";
import { FetchProgressType, ClientResponseType } from "client";
import { FetchCommandInstance } from "command";

export const getCommandManagerEvents = (emitter: EventEmitter) => ({
  /**
   * Emiters
   */

  // Start
  emitRequestStart: (key: CacheKeyType, command: FetchCommandInstance, details: CommandEventDetails): void => {
    emitter.emit(getRequestStartEventKey(key), command, details);
  },
  emitResponseStart: (key: CacheKeyType, command: FetchCommandInstance, details: CommandEventDetails): void => {
    emitter.emit(getResponseStartEventKey(key), command, details);
  },
  // Progress
  emitUploadProgress: (key: CacheKeyType, values: FetchProgressType, details: CommandEventDetails): void => {
    emitter.emit(getUploadProgressEventKey(key), values, details);
  },
  emitDownloadProgress: (key: CacheKeyType, values: FetchProgressType, details: CommandEventDetails): void => {
    emitter.emit(getDownloadProgressEventKey(key), values, details);
  },
  // Response
  emitResponse: (key: CacheKeyType, response: ClientResponseType<any, any>): void => {
    emitter.emit(getResponseEventKey(key), response);
  },
  // Abort
  emitAbort: (key: CacheKeyType, command: FetchCommandInstance): void => {
    emitter.emit(getAbortEventKey(key), command);
  },

  /**
   * Listeners
   */

  // Start
  onRequestStart: <T extends FetchCommandInstance>(
    key: CacheKeyType,
    callback: (command: T, details: CommandEventDetails) => void,
  ): VoidFunction => {
    emitter.on(getRequestStartEventKey(key), callback);
    return () => emitter.removeListener(getRequestStartEventKey(key), callback);
  },
  onResponseStart: <T extends FetchCommandInstance>(
    key: CacheKeyType,
    callback: (command: T, details: CommandEventDetails) => void,
  ): VoidFunction => {
    emitter.on(getResponseStartEventKey(key), callback);
    return () => emitter.removeListener(getResponseStartEventKey(key), callback);
  },
  // Progress
  onUploadProgress: (
    key: CacheKeyType,
    callback: (values: FetchProgressType, details: CommandEventDetails) => void,
  ): VoidFunction => {
    emitter.on(getUploadProgressEventKey(key), callback);
    return () => emitter.removeListener(getUploadProgressEventKey(key), callback);
  },
  onDownloadProgress: (
    key: CacheKeyType,
    callback: (values: FetchProgressType, details: CommandEventDetails) => void,
  ): VoidFunction => {
    emitter.on(getDownloadProgressEventKey(key), callback);
    return () => emitter.removeListener(getDownloadProgressEventKey(key), callback);
  },
  // Response
  onResponse: <ResponseType, ErrorType>(
    key: CacheKeyType,
    callback: (command: ClientResponseType<ResponseType, ErrorType>) => void,
  ): VoidFunction => {
    emitter.on(getResponseEventKey(key), callback);
    return () => emitter.removeListener(getResponseEventKey(key), callback);
  },
  // Abort
  onAbort: (key: CacheKeyType, callback: (command: FetchCommandInstance) => void): VoidFunction => {
    emitter.on(getAbortEventKey(key), callback);
    return () => emitter.removeListener(getAbortEventKey(key), callback);
  },

  /**
   * Unmounting
   */

  umount: <T extends (...args: any[]) => void>(key: CacheKeyType, callback: T): void => {
    emitter.removeListener(key, callback);
  },
});
