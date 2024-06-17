/* eslint-disable max-params */
import EventEmitter from "events";

import {
  getRequestStarByQueueKey,
  getResponseStartByQueueKey,
  getDownloadProgressByQueueKey,
  getUploadProgressByQueueKey,
  getResponseByIdKey,
  getAbortByAbortKey,
  getAbortByIdKey,
  getResponseByCacheKey,
  getUploadProgressByIdKey,
  getDownloadProgressByIdKey,
  getResponseStartByIdKey,
  getRequestStartByIdKey,
  getLoadingByQueueKey,
  getLoadingByIdKey,
  RequestEventType,
  RequestLoadingEventType,
  getRemoveByQueueKey,
  getRemoveByIdKey,
  getLoadingKey,
  getRequestStartKey,
  getUploadProgressKey,
  getDownloadProgressKey,
  getResponseKey,
  getAbortKey,
  getRemoveKey,
  getResponseStartKey,
  RequestProgressEventType,
  RequestResponseEventType,
} from "managers";
import { AdapterInstance } from "adapter";
import { ExtendRequest, RequestInstance } from "request";

export const getRequestManagerEvents = (emitter: EventEmitter) => ({
  /**
   * Emiter
   */

  // Loading
  emitLoading: (data: RequestLoadingEventType<RequestInstance>): void => {
    emitter.emit(getLoadingKey(), data);
    emitter.emit(getLoadingByIdKey(data.requestId), data);
    emitter.emit(getLoadingByQueueKey(data.request.queueKey), data);
  },

  // Start
  emitRequestStart: (data: RequestEventType<RequestInstance>): void => {
    emitter.emit(getRequestStartKey(), data);
    emitter.emit(getRequestStartByIdKey(data.requestId), data);
    emitter.emit(getRequestStarByQueueKey(data.request.queueKey), data);
  },
  emitResponseStart: (data: RequestEventType<RequestInstance>): void => {
    emitter.emit(getResponseStartKey(), data);
    emitter.emit(getResponseStartByIdKey(data.requestId), data);
    emitter.emit(getResponseStartByQueueKey(data.request.queueKey), data);
  },

  // Progress
  emitUploadProgress: (data: RequestProgressEventType<RequestInstance>): void => {
    emitter.emit(getUploadProgressKey(), data);
    emitter.emit(getUploadProgressByIdKey(data.requestId), data);
    emitter.emit(getUploadProgressByQueueKey(data.request.queueKey), data);
  },
  emitDownloadProgress: (data: RequestProgressEventType<RequestInstance>): void => {
    emitter.emit(getDownloadProgressKey(), data);
    emitter.emit(getDownloadProgressByIdKey(data.requestId), data);
    emitter.emit(getDownloadProgressByQueueKey(data.request.queueKey), data);
  },

  // Response
  emitResponse: <Adapter extends AdapterInstance>(
    data: RequestResponseEventType<ExtendRequest<RequestInstance, { adapter: Adapter }>>,
  ): void => {
    emitter.emit(getResponseKey(), data);
    emitter.emit(getResponseByIdKey(data.requestId), data);
    emitter.emit(getResponseByCacheKey(data.request.cacheKey), data);
  },

  // Abort
  emitAbort: (data: RequestEventType<RequestInstance>): void => {
    emitter.emit(getAbortKey(), data);
    emitter.emit(getAbortByIdKey(data.requestId), data);
    emitter.emit(getAbortByAbortKey(data.request.abortKey), data);
  },

  // Remove
  emitRemove: (data: RequestEventType<RequestInstance>): void => {
    emitter.emit(getRemoveKey(), data);
    emitter.emit(getRemoveByIdKey(data.requestId), data);
    emitter.emit(getRemoveByQueueKey(data.request.queueKey), data);
  },

  /**
   * Listeners
   */

  // Loading
  onLoading: <T extends RequestInstance>(callback: (data: RequestLoadingEventType<T>) => void): VoidFunction => {
    emitter.on(getLoadingKey(), callback);
    return () => emitter.removeListener(getLoadingKey(), callback);
  },
  onLoadingByQueue: <T extends RequestInstance>(
    queueKey: string,
    callback: (data: RequestLoadingEventType<T>) => void,
  ): VoidFunction => {
    emitter.on(getLoadingByQueueKey(queueKey), callback);
    return () => emitter.removeListener(getLoadingByQueueKey(queueKey), callback);
  },
  onLoadingById: <T extends RequestInstance>(
    requestId: string,
    callback: (data: RequestLoadingEventType<T>) => void,
  ): VoidFunction => {
    emitter.on(getLoadingByIdKey(requestId), callback);
    return () => emitter.removeListener(getLoadingByIdKey(requestId), callback);
  },

  // Request Start
  onRequestStart: <T extends RequestInstance>(callback: (details: RequestEventType<T>) => void): VoidFunction => {
    emitter.on(getRequestStartKey(), callback);
    return () => emitter.removeListener(getRequestStartKey(), callback);
  },
  onRequestStartByQueue: <T extends RequestInstance>(
    queueKey: string,
    callback: (details: RequestEventType<T>) => void,
  ): VoidFunction => {
    emitter.on(getRequestStarByQueueKey(queueKey), callback);
    return () => emitter.removeListener(getRequestStarByQueueKey(queueKey), callback);
  },
  onRequestStartById: <T extends RequestInstance>(
    requestId: string,
    callback: (details: RequestEventType<T>) => void,
  ): VoidFunction => {
    emitter.on(getRequestStartByIdKey(requestId), callback);
    return () => emitter.removeListener(getRequestStartByIdKey(requestId), callback);
  },

  // Response Start
  onResponseStart: <T extends RequestInstance>(callback: (details: RequestEventType<T>) => void): VoidFunction => {
    emitter.on(getResponseStartKey(), callback);
    return () => emitter.removeListener(getResponseStartKey(), callback);
  },
  onResponseStartByQueue: <T extends RequestInstance>(
    queueKey: string,
    callback: (details: RequestEventType<T>) => void,
  ): VoidFunction => {
    emitter.on(getResponseStartByQueueKey(queueKey), callback);
    return () => emitter.removeListener(getResponseStartByQueueKey(queueKey), callback);
  },
  onResponseStartById: <T extends RequestInstance>(
    requestId: string,
    callback: (details: RequestEventType<T>) => void,
  ): VoidFunction => {
    emitter.on(getResponseStartByIdKey(requestId), callback);
    return () => emitter.removeListener(getResponseStartByIdKey(requestId), callback);
  },

  // Progress
  onUploadProgress: <T extends RequestInstance = RequestInstance>(
    callback: (data: RequestProgressEventType<T>) => void,
  ): VoidFunction => {
    emitter.on(getUploadProgressKey(), callback);
    return () => emitter.removeListener(getUploadProgressKey(), callback);
  },
  onUploadProgressByQueue: <T extends RequestInstance = RequestInstance>(
    queueKey: string,
    callback: (data: RequestProgressEventType<T>) => void,
  ): VoidFunction => {
    emitter.on(getUploadProgressByQueueKey(queueKey), callback);
    return () => emitter.removeListener(getUploadProgressByQueueKey(queueKey), callback);
  },
  onUploadProgressById: <T extends RequestInstance = RequestInstance>(
    requestId: string,
    callback: (data: RequestProgressEventType<T>) => void,
  ): VoidFunction => {
    emitter.on(getUploadProgressByIdKey(requestId), callback);
    return () => emitter.removeListener(getUploadProgressByIdKey(requestId), callback);
  },

  onDownloadProgress: <T extends RequestInstance = RequestInstance>(
    callback: (data: RequestProgressEventType<T>) => void,
  ): VoidFunction => {
    emitter.on(getDownloadProgressKey(), callback);
    return () => emitter.removeListener(getDownloadProgressKey(), callback);
  },
  onDownloadProgressByQueue: <T extends RequestInstance = RequestInstance>(
    queueKey: string,
    callback: (data: RequestProgressEventType<T>) => void,
  ): VoidFunction => {
    emitter.on(getDownloadProgressByQueueKey(queueKey), callback);
    return () => emitter.removeListener(getDownloadProgressByQueueKey(queueKey), callback);
  },
  onDownloadProgressById: <T extends RequestInstance = RequestInstance>(
    requestId: string,
    callback: (data: RequestProgressEventType<T>) => void,
  ): VoidFunction => {
    emitter.on(getDownloadProgressByIdKey(requestId), callback);
    return () => emitter.removeListener(getDownloadProgressByIdKey(requestId), callback);
  },

  // Response
  onResponse: <T extends RequestInstance>(callback: (data: RequestResponseEventType<T>) => void): VoidFunction => {
    emitter.on(getResponseKey(), callback);
    return () => emitter.removeListener(getResponseKey(), callback);
  },
  onResponseByCache: <T extends RequestInstance>(
    cacheKey: string,
    callback: (data: RequestResponseEventType<T>) => void,
  ): VoidFunction => {
    emitter.on(getResponseByCacheKey(cacheKey), callback);
    return () => emitter.removeListener(getResponseByCacheKey(cacheKey), callback);
  },
  onResponseById: <T extends RequestInstance>(
    requestId: string,
    callback: (data: RequestResponseEventType<T>) => void,
  ): VoidFunction => {
    emitter.on(getResponseByIdKey(requestId), callback);
    return () => emitter.removeListener(getResponseByIdKey(requestId), callback);
  },

  // Abort
  onAbort: <T extends RequestInstance = RequestInstance>(
    callback: (request: RequestEventType<T>) => void,
  ): VoidFunction => {
    emitter.on(getAbortKey(), callback);
    return () => emitter.removeListener(getAbortKey(), callback);
  },
  onAbortByAbortKey: <T extends RequestInstance = RequestInstance>(
    abortKey: string,
    callback: (request: RequestEventType<T>) => void,
  ): VoidFunction => {
    emitter.on(getAbortByAbortKey(abortKey), callback);
    return () => emitter.removeListener(getAbortByAbortKey(abortKey), callback);
  },
  onAbortById: <T extends RequestInstance = RequestInstance>(
    requestId: string,
    callback: (data: RequestEventType<T>) => void,
  ): VoidFunction => {
    emitter.on(getAbortByIdKey(requestId), callback);
    return () => emitter.removeListener(getAbortByIdKey(requestId), callback);
  },

  // Remove
  onRemove: <T extends RequestInstance = RequestInstance>(
    callback: (data: RequestEventType<T>) => void,
  ): VoidFunction => {
    emitter.on(getRemoveKey(), callback);
    return () => emitter.removeListener(getRemoveKey(), callback);
  },
  onRemoveByQueue: <T extends RequestInstance = RequestInstance>(
    queueKey: string,
    callback: (data: RequestEventType<T>) => void,
  ): VoidFunction => {
    emitter.on(getRemoveByQueueKey(queueKey), callback);
    return () => emitter.removeListener(getRemoveByQueueKey(queueKey), callback);
  },
  onRemoveById: <T extends RequestInstance = RequestInstance>(
    requestId: string,
    callback: (data: RequestEventType<T>) => void,
  ): VoidFunction => {
    emitter.on(getRemoveByIdKey(requestId), callback);
    return () => emitter.removeListener(getRemoveByIdKey(requestId), callback);
  },
});
