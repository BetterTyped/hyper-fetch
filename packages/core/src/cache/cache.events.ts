import EventEmitter from "events";

import { CacheValueType, getInvalidateEventKey, getCacheKey } from "cache";
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
    emitter.emit(getCacheKey(cacheKey), data);
  },
  /**
   * Invalidate cache values event
   */
  emitInvalidation: (cacheKey: string): void => {
    emitter.emit(getInvalidateEventKey(cacheKey));
  },
  /** StatusType
   * Cache data listener
   * @param cacheKey
   * @param callback
   * @returns
   */
  onData: <Response, Error, Adapter extends AdapterInstance>(
    cacheKey: string,
    callback: (data: CacheValueType<Response, Error, Adapter>) => void,
  ): VoidFunction => {
    emitter.on(getCacheKey(cacheKey), callback);
    return () => emitter.removeListener(getCacheKey(cacheKey), callback);
  },
  /**
   * Cache invalidation listener
   * @param cacheKey
   * @param callback
   * @returns
   */
  onInvalidate: (cacheKey: string, callback: () => void): VoidFunction => {
    emitter.on(getInvalidateEventKey(cacheKey), callback);
    return () => emitter.removeListener(getInvalidateEventKey(cacheKey), callback);
  },
});
