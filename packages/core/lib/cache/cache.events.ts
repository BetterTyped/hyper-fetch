import EventEmitter from "events";

import { CacheKeyType, CacheValueType, getRevalidateEventKey, CacheStorageType } from "cache";
import { ExtractResponse, ExtractError } from "types";
import { getCacheKey } from "./cache.utils";

export const getCacheEvents = (emitter: EventEmitter, storage: CacheStorageType) => ({
  set: <T>(key: CacheKeyType, data: CacheValueType<ExtractResponse<T>, ExtractError<T>>): void => {
    emitter.emit(getCacheKey(key), data);
  },
  /**
   * Revalidate cache values and trigger revalidate event
   * @param pattern Allow to revalidate cache based on the `cacheKey`, `string pattern` or `regexp` pattern for matching
   */
  revalidate: async (pattern: CacheKeyType | RegExp): Promise<void> => {
    const keys = await storage.keys();

    if (typeof pattern === "string") {
      emitter.emit(getRevalidateEventKey(pattern));
    } else {
      // eslint-disable-next-line no-restricted-syntax
      for (const entityKey of keys) {
        if (pattern.test(entityKey)) {
          emitter.emit(getRevalidateEventKey(entityKey));
        }
      }
    }
  },
  get: <T>(
    key: CacheKeyType,
    callback: (data: CacheValueType<ExtractResponse<T>, ExtractError<T>>) => void,
  ): VoidFunction => {
    emitter.on(getCacheKey(key), callback);
    return () => emitter.removeListener(getCacheKey(key), callback);
  },
  onRevalidate: (key: CacheKeyType, callback: () => void): VoidFunction => {
    emitter.on(getRevalidateEventKey(key), callback);
    return () => emitter.removeListener(getRevalidateEventKey(key), callback);
  },
});
