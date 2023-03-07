import EventEmitter from "events";

import { CacheValueType, getRevalidateEventKey } from "cache";
import { getCacheKey } from "./cache.utils";

export const getCacheEvents = (emitter: EventEmitter) => ({
  /**
   * Set cache data
   * @param cacheKey
   * @param data
   */
  emitCacheData: <Response, Error, AdditionalData>(
    cacheKey: string,
    data: CacheValueType<Response, Error, AdditionalData>,
  ): void => {
    emitter.emit(getCacheKey(cacheKey), data);
  },
  /**
   * Revalidate cache values event
   */
  emitRevalidation: (cacheKey: string): void => {
    emitter.emit(getRevalidateEventKey(cacheKey));
  },
  /**
   * Cache data listener
   * @param cacheKey
   * @param callback
   * @returns
   */
  onData: <Response, Error, AdditionalData>(
    cacheKey: string,
    callback: (data: CacheValueType<Response, Error, AdditionalData>) => void,
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
