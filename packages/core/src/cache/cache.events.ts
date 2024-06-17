import EventEmitter from "events";

import { CacheValueType, getInvalidateByKey, getInvalidateKey, getCacheByKey, getCacheKey } from "cache";
import { AdapterInstance } from "adapter";

export const getCacheEvents = (emitter: EventEmitter) => ({
  /**
   * Set cache data
   * @param cacheKey
   * @param data
   */
  emitCacheData: <Response, Error, Adapter extends AdapterInstance>(
    cacheKey: string,
    data: CacheValueType<Response, Error, Adapter>,
  ): void => {
    emitter.emit(getCacheKey(), data);
    emitter.emit(getCacheByKey(cacheKey), data);
  },
  /**
   * Invalidate cache values event
   */
  emitInvalidation: (cacheKey: string): void => {
    emitter.emit(getInvalidateKey());
    emitter.emit(getInvalidateByKey(cacheKey));
  },
  /**
   * Cache data listener
   * @param callback
   * @returns
   */
  onData: <Response, Error, Adapter extends AdapterInstance>(
    callback: (data: CacheValueType<Response, Error, Adapter>) => void,
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
  onInvalidate: (callback: () => void): VoidFunction => {
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
});
