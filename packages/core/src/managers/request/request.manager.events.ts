/* eslint-disable max-params */
import EventEmitter from "events";

import {
  getRequestStarByQueryKey,
  getResponseStartByQueryKey,
  getDownloadProgressByQueryKey,
  getUploadProgressByQueryKey,
  getResponseByIdKey,
  getAbortByAbortKey,
  getAbortByIdKey,
  getResponseByCacheKey,
  getUploadProgressByIdKey,
  getDownloadProgressByIdKey,
  getResponseStartByIdKey,
  getRequestStartByIdKey,
  getLoadingByQueryKey,
  getLoadingByIdKey,
  RequestEventType,
  RequestLoadingEventType,
  getRemoveByQueryKey,
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
  RequestRemovedEventType,
  getLoadingByCacheKey,
  RequestDeduplicatedEventType,
  getRequestDeduplicatedKey,
  getRequestDeduplicatedByIdKey,
  getRequestDeduplicatedByCacheKey,
  getRequestDeduplicatedByQueryKey,
} from "managers";
import { AdapterInstance } from "adapter";
import { RequestInstance } from "request";
import { Client } from "client";
import { ExtendRequest } from "types";

export const getRequestManagerEvents = (emitter: EventEmitter) => ({
  /**
   * Emiter
   */

  // Deduplicated
  emitDeduplicated: (data: RequestDeduplicatedEventType<RequestInstance>): void => {
    emitter.emit(getRequestDeduplicatedKey(), data);
    emitter.emit(getRequestDeduplicatedByIdKey(data.requestId), data);
    emitter.emit(getRequestDeduplicatedByCacheKey(data.request.cacheKey), data);
    emitter.emit(getRequestDeduplicatedByQueryKey(data.request.queryKey), data);
  },

  // Loading
  emitLoading: (data: RequestLoadingEventType<RequestInstance>): void => {
    emitter.emit(getLoadingKey(), data);
    emitter.emit(getLoadingByIdKey(data.requestId), data);
    emitter.emit(getLoadingByCacheKey(data.request.cacheKey), data);
    emitter.emit(getLoadingByQueryKey(data.request.queryKey), data);
  },

  // Start
  emitRequestStart: (data: RequestEventType<RequestInstance>): void => {
    emitter.emit(getRequestStartKey(), data);
    emitter.emit(getRequestStartByIdKey(data.requestId), data);
    emitter.emit(getRequestStarByQueryKey(data.request.queryKey), data);
  },
  emitResponseStart: (data: RequestEventType<RequestInstance>): void => {
    emitter.emit(getResponseStartKey(), data);
    emitter.emit(getResponseStartByIdKey(data.requestId), data);
    emitter.emit(getResponseStartByQueryKey(data.request.queryKey), data);
  },

  // Progress
  emitUploadProgress: (data: RequestProgressEventType<RequestInstance>): void => {
    emitter.emit(getUploadProgressKey(), data);
    emitter.emit(getUploadProgressByIdKey(data.requestId), data);
    emitter.emit(getUploadProgressByQueryKey(data.request.queryKey), data);
  },
  emitDownloadProgress: (data: RequestProgressEventType<RequestInstance>): void => {
    emitter.emit(getDownloadProgressKey(), data);
    emitter.emit(getDownloadProgressByIdKey(data.requestId), data);
    emitter.emit(getDownloadProgressByQueryKey(data.request.queryKey), data);
  },

  // Response
  emitResponse: <Adapter extends AdapterInstance>(
    data: RequestResponseEventType<ExtendRequest<RequestInstance, { client: Client<any, Adapter> }>>,
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
  emitRemove: (data: RequestRemovedEventType<RequestInstance>): void => {
    emitter.emit(getRemoveKey(), data);
    emitter.emit(getRemoveByIdKey(data.requestId), data);
    emitter.emit(getRemoveByQueryKey(data.request.queryKey), data);
  },

  /**
   * Listeners
   */

  // Deduplicated
  onDeduplicated: <T extends RequestInstance>(
    callback: (data: RequestDeduplicatedEventType<T>) => void,
  ): VoidFunction => {
    emitter.on(getRequestDeduplicatedKey(), callback);
    return () => emitter.removeListener(getRequestDeduplicatedKey(), callback);
  },
  onDeduplicatedByQueue: <T extends RequestInstance>(
    queryKey: string,
    callback: (data: RequestDeduplicatedEventType<T>) => void,
  ): VoidFunction => {
    emitter.on(getRequestDeduplicatedByQueryKey(queryKey), callback);
    return () => emitter.removeListener(getRequestDeduplicatedByQueryKey(queryKey), callback);
  },
  onDeduplicatedByCache: <T extends RequestInstance>(
    cacheKey: string,
    callback: (data: RequestDeduplicatedEventType<T>) => void,
  ): VoidFunction => {
    emitter.on(getRequestDeduplicatedByCacheKey(cacheKey), callback);
    return () => emitter.removeListener(getRequestDeduplicatedByCacheKey(cacheKey), callback);
  },
  onDeduplicatedById: <T extends RequestInstance>(
    requestId: string,
    callback: (data: RequestDeduplicatedEventType<T>) => void,
  ): VoidFunction => {
    emitter.on(getRequestDeduplicatedByIdKey(requestId), callback);
    return () => emitter.removeListener(getRequestDeduplicatedByIdKey(requestId), callback);
  },

  // Loading
  onLoading: <T extends RequestInstance>(callback: (data: RequestLoadingEventType<T>) => void): VoidFunction => {
    emitter.on(getLoadingKey(), callback);
    return () => emitter.removeListener(getLoadingKey(), callback);
  },
  onLoadingByQueue: <T extends RequestInstance>(
    queryKey: string,
    callback: (data: RequestLoadingEventType<T>) => void,
  ): VoidFunction => {
    emitter.on(getLoadingByQueryKey(queryKey), callback);
    return () => emitter.removeListener(getLoadingByQueryKey(queryKey), callback);
  },
  onLoadingByCache: <T extends RequestInstance>(
    cacheKey: string,
    callback: (data: RequestLoadingEventType<T>) => void,
  ): VoidFunction => {
    emitter.on(getLoadingByCacheKey(cacheKey), callback);
    return () => emitter.removeListener(getLoadingByCacheKey(cacheKey), callback);
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
    queryKey: string,
    callback: (details: RequestEventType<T>) => void,
  ): VoidFunction => {
    emitter.on(getRequestStarByQueryKey(queryKey), callback);
    return () => emitter.removeListener(getRequestStarByQueryKey(queryKey), callback);
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
    queryKey: string,
    callback: (details: RequestEventType<T>) => void,
  ): VoidFunction => {
    emitter.on(getResponseStartByQueryKey(queryKey), callback);
    return () => emitter.removeListener(getResponseStartByQueryKey(queryKey), callback);
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
    queryKey: string,
    callback: (data: RequestProgressEventType<T>) => void,
  ): VoidFunction => {
    emitter.on(getUploadProgressByQueryKey(queryKey), callback);
    return () => emitter.removeListener(getUploadProgressByQueryKey(queryKey), callback);
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
    queryKey: string,
    callback: (data: RequestProgressEventType<T>) => void,
  ): VoidFunction => {
    emitter.on(getDownloadProgressByQueryKey(queryKey), callback);
    return () => emitter.removeListener(getDownloadProgressByQueryKey(queryKey), callback);
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
  onAbortByKey: <T extends RequestInstance = RequestInstance>(
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
    callback: (data: RequestRemovedEventType<T>) => void,
  ): VoidFunction => {
    emitter.on(getRemoveKey(), callback);
    return () => emitter.removeListener(getRemoveKey(), callback);
  },
  onRemoveByQueue: <T extends RequestInstance = RequestInstance>(
    queryKey: string,
    callback: (data: RequestRemovedEventType<T>) => void,
  ): VoidFunction => {
    emitter.on(getRemoveByQueryKey(queryKey), callback);
    return () => emitter.removeListener(getRemoveByQueryKey(queryKey), callback);
  },
  onRemoveById: <T extends RequestInstance = RequestInstance>(
    requestId: string,
    callback: (data: RequestRemovedEventType<T>) => void,
  ): VoidFunction => {
    emitter.on(getRemoveByIdKey(requestId), callback);
    return () => emitter.removeListener(getRemoveByIdKey(requestId), callback);
  },
});
