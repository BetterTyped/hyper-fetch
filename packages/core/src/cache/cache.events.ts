import EventEmitter from "events";

import { CacheValueType, getRevalidateEventKey, getCacheKey } from "cache";
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
   * Revalidate cache values event
   */
  emitRevalidation: (cacheKey: string): void => {
    emitter.emit(getRevalidateEventKey(cacheKey));
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
  onRevalidate: (cacheKey: string, callback: () => void): VoidFunction => {
    emitter.on(getRevalidateEventKey(cacheKey), callback);
    return () => emitter.removeListener(getRevalidateEventKey(cacheKey), callback);
  },
});
