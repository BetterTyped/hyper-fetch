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
  RequestEventType,
  ResponseDetailsType,
  RequestLoadingEventType,
  getRemoveEventKey,
  getRemoveIdEventKey,
} from "managers";
import { BaseAdapterType, ProgressType, ResponseReturnType } from "adapter";
import { RequestInstance } from "request";

export const getRequestManagerEvents = (emitter: EventEmitter) => ({
  /**
   * Emiter
   */

  // Loading
  emitLoading: (queueKey: string, requestId: string, values: RequestLoadingEventType): void => {
    emitter.emit(getLoadingIdEventKey(requestId), values);
    emitter.emit(getLoadingEventKey(queueKey), values);
  },

  // Start
  emitRequestStart: (queueKey: string, requestId: string, details: RequestEventType<RequestInstance>): void => {
    emitter.emit(getRequestStartIdEventKey(requestId), details);
    emitter.emit(getRequestStartEventKey(queueKey), details);
  },
  emitResponseStart: (queueKey: string, requestId: string, details: RequestEventType<RequestInstance>): void => {
    emitter.emit(getResponseStartIdEventKey(requestId), details);
    emitter.emit(getResponseStartEventKey(queueKey), details);
  },

  // Progress
  emitUploadProgress: (
    queueKey: string,
    requestId: string,
    values: ProgressType,
    details: RequestEventType<RequestInstance>,
  ): void => {
    emitter.emit(getUploadProgressIdEventKey(requestId), values, details);
    emitter.emit(getUploadProgressEventKey(queueKey), values, details);
  },
  emitDownloadProgress: (
    queueKey: string,
    requestId: string,
    values: ProgressType,
    details: RequestEventType<RequestInstance>,
  ): void => {
    emitter.emit(getDownloadProgressIdEventKey(requestId), values, details);
    emitter.emit(getDownloadProgressEventKey(queueKey), values, details);
  },

  // Response
  emitResponse: <AdapterType extends BaseAdapterType>(
    cacheKey: string,
    requestId: string,
    response: ResponseReturnType<unknown, unknown, AdapterType>,
    details: ResponseDetailsType,
  ): void => {
    emitter.emit(getResponseIdEventKey(requestId), response, details);
    emitter.emit(getResponseEventKey(cacheKey), response, details);
  },

  // Abort
  emitAbort: (abortKey: string, requestId: string, request: RequestInstance): void => {
    emitter.emit(getAbortByIdEventKey(requestId), request);
    emitter.emit(getAbortEventKey(abortKey), request);
  },

  // Remove
  emitRemove: <T extends RequestInstance>(queueKey: string, requestId: string, details: RequestEventType<T>): void => {
    emitter.emit(getRemoveEventKey(queueKey), details);
    emitter.emit(getRemoveIdEventKey(requestId), details);
  },

  /**
   * Listeners
   */

  // Loading
  onLoading: (queueKey: string, callback: (values: RequestLoadingEventType) => void): VoidFunction => {
    emitter.on(getLoadingEventKey(queueKey), callback);
    return () => emitter.removeListener(getLoadingEventKey(queueKey), callback);
  },
  onLoadingById: (requestId: string, callback: (values: RequestLoadingEventType) => void): VoidFunction => {
    emitter.on(getLoadingIdEventKey(requestId), callback);
    return () => emitter.removeListener(getLoadingIdEventKey(requestId), callback);
  },

  // Request Start
  onRequestStart: <T extends RequestInstance>(
    queueKey: string,
    callback: (details: RequestEventType<T>) => void,
  ): VoidFunction => {
    emitter.on(getRequestStartEventKey(queueKey), callback);
    return () => emitter.removeListener(getRequestStartEventKey(queueKey), callback);
  },
  onRequestStartById: <T extends RequestInstance>(
    requestId: string,
    callback: (details: RequestEventType<T>) => void,
  ): VoidFunction => {
    emitter.on(getRequestStartIdEventKey(requestId), callback);
    return () => emitter.removeListener(getRequestStartIdEventKey(requestId), callback);
  },
  // Response Start
  onResponseStart: <T extends RequestInstance>(
    queueKey: string,
    callback: (details: RequestEventType<T>) => void,
  ): VoidFunction => {
    emitter.on(getResponseStartEventKey(queueKey), callback);
    return () => emitter.removeListener(getResponseStartEventKey(queueKey), callback);
  },
  onResponseStartById: <T extends RequestInstance>(
    requestId: string,
    callback: (details: RequestEventType<T>) => void,
  ): VoidFunction => {
    emitter.on(getResponseStartIdEventKey(requestId), callback);
    return () => emitter.removeListener(getResponseStartIdEventKey(requestId), callback);
  },

  // Progress
  onUploadProgress: <T extends RequestInstance = RequestInstance>(
    queueKey: string,
    callback: (values: ProgressType, details: RequestEventType<T>) => void,
  ): VoidFunction => {
    emitter.on(getUploadProgressEventKey(queueKey), callback);
    return () => emitter.removeListener(getUploadProgressEventKey(queueKey), callback);
  },
  onUploadProgressById: <T extends RequestInstance = RequestInstance>(
    requestId: string,
    callback: (values: ProgressType, details: RequestEventType<T>) => void,
  ): VoidFunction => {
    emitter.on(getUploadProgressIdEventKey(requestId), callback);
    return () => emitter.removeListener(getUploadProgressIdEventKey(requestId), callback);
  },
  onDownloadProgress: <T extends RequestInstance = RequestInstance>(
    queueKey: string,
    callback: (values: ProgressType, details: RequestEventType<T>) => void,
  ): VoidFunction => {
    emitter.on(getDownloadProgressEventKey(queueKey), callback);
    return () => emitter.removeListener(getDownloadProgressEventKey(queueKey), callback);
  },
  onDownloadProgressById: <T extends RequestInstance = RequestInstance>(
    requestId: string,
    callback: (values: ProgressType, details: RequestEventType<T>) => void,
  ): VoidFunction => {
    emitter.on(getDownloadProgressIdEventKey(requestId), callback);
    return () => emitter.removeListener(getDownloadProgressIdEventKey(requestId), callback);
  },

  // Response
  onResponse: <Response, ErrorType, AdapterType extends BaseAdapterType>(
    cacheKey: string,
    callback: (response: ResponseReturnType<Response, ErrorType, AdapterType>, details: ResponseDetailsType) => void,
  ): VoidFunction => {
    emitter.on(getResponseEventKey(cacheKey), callback);
    return () => emitter.removeListener(getResponseEventKey(cacheKey), callback);
  },
  // Response by requestId
  onResponseById: <Response, ErrorType, AdapterType extends BaseAdapterType>(
    requestId: string,
    callback: (response: ResponseReturnType<Response, ErrorType, AdapterType>, details: ResponseDetailsType) => void,
  ): VoidFunction => {
    emitter.on(getResponseIdEventKey(requestId), callback);
    return () => emitter.removeListener(getResponseIdEventKey(requestId), callback);
  },

  // Abort
  onAbort: (abortKey: string, callback: (request: RequestInstance) => void): VoidFunction => {
    emitter.on(getAbortEventKey(abortKey), callback);
    return () => emitter.removeListener(getAbortEventKey(abortKey), callback);
  },
  onAbortById: (requestId: string, callback: (request: RequestInstance) => void): VoidFunction => {
    emitter.on(getAbortByIdEventKey(requestId), callback);
    return () => emitter.removeListener(getAbortByIdEventKey(requestId), callback);
  },

  // Remove
  onRemove: <T extends RequestInstance = RequestInstance>(
    queueKey: string,
    callback: (details: RequestEventType<T>) => void,
  ): VoidFunction => {
    emitter.on(getRemoveEventKey(queueKey), callback);
    return () => emitter.removeListener(getRemoveEventKey(queueKey), callback);
  },
  onRemoveById: <T extends RequestInstance = RequestInstance>(
    requestId: string,
    callback: (details: RequestEventType<T>) => void,
  ): VoidFunction => {
    emitter.on(getRemoveIdEventKey(requestId), callback);
    return () => emitter.removeListener(getRemoveIdEventKey(requestId), callback);
  },
});
