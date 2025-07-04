import EventEmitter from "events";

import {
  CacheValueType,
  getInvalidateByKey,
  getInvalidateKey,
  getCacheByKey,
  getCacheKey,
  getDeleteKey,
  getDeleteByKey,
} from "cache";
import { AdapterInstance } from "adapter";

export const getCacheEvents = (emitter: EventEmitter) => ({
  /**
   * Set cache data
   * @param data
   */
  emitCacheData: <Response, Error, Adapter extends AdapterInstance>(
    data: CacheValueType<Response, Error, Adapter> & { cached: boolean },
    isTriggeredExternally = false,
  ): void => {
    emitter.emit(getCacheKey(), data, isTriggeredExternally);
    emitter.emit(getCacheByKey(data.cacheKey), data, isTriggeredExternally);
  },
  /**
   * Invalidate cache values event
   */
  emitInvalidation: (cacheKey: string, isTriggeredExternally = false): void => {
    emitter.emit(getInvalidateKey(), cacheKey, isTriggeredExternally);
    emitter.emit(getInvalidateByKey(cacheKey), isTriggeredExternally);
  },
  /**
   * Delete of cache values
   */
  emitDelete: (cacheKey: string, isTriggeredExternally = false): void => {
    emitter.emit(getDeleteKey(), cacheKey, isTriggeredExternally);
    emitter.emit(getDeleteByKey(cacheKey), isTriggeredExternally);
  },
  /**
   * Cache data listener
   * @param callback
   * @returns
   */
  onData: <Response, Error, Adapter extends AdapterInstance>(
    callback: (data: CacheValueType<Response, Error, Adapter> & { cached: boolean }) => void,
  ): VoidFunction => {
    emitter.on(getCacheKey(), callback);
    return () => emitter.removeListener(getCacheKey(), callback);
  },
  /**
   * Cache data listener
   * @param cacheKey
   * @param callback
   * @returns
   */
  onDataByKey: <Response, Error, Adapter extends AdapterInstance>(
    cacheKey: string,
    callback: (data: CacheValueType<Response, Error, Adapter>) => void,
  ): VoidFunction => {
    emitter.on(getCacheByKey(cacheKey), callback);
    return () => emitter.removeListener(getCacheByKey(cacheKey), callback);
  },
  /**
   * Cache invalidation listener
   * @param callback
   * @returns
   */
  onInvalidate: (callback: (cacheKey: string) => void): VoidFunction => {
    emitter.on(getInvalidateKey(), callback);
    return () => emitter.removeListener(getInvalidateKey(), callback);
  },
  /**
   * Cache invalidation listener
   * @param cacheKey
   * @param callback
   * @returns
   */
  onInvalidateByKey: (cacheKey: string, callback: () => void): VoidFunction => {
    emitter.on(getInvalidateByKey(cacheKey), callback);
    return () => emitter.removeListener(getInvalidateByKey(cacheKey), callback);
  },
  onDelete: (callback: (cacheKey: string) => void): VoidFunction => {
    emitter.on(getDeleteKey(), callback);
    return () => emitter.removeListener(getDeleteKey(), callback);
  },
  onDeleteByKey: (cacheKey: string, callback: () => void): VoidFunction => {
    emitter.on(getDeleteByKey(cacheKey), callback);
    return () => emitter.removeListener(getDeleteByKey(cacheKey), callback);
  },
});
