import type { AdapterInstance } from "adapter";
import type { CacheValueType } from "cache";
import { getInvalidateByKey, getInvalidateKey, getCacheByKey, getCacheKey, getDeleteKey, getDeleteByKey } from "cache";
import type EventEmitter from "events";

/** Create the cache event emitters and listeners for data changes, invalidation, and deletion. */
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
   * @param cacheKey key of the invalidated element - the event data
   * @param isTriggeredExternally event comes from outside of the cache (for example from devtools)
   * @param listenersKey key the by-key listeners are subscribed with. Scoped elements are stored under
   * `scopeKey(cacheKey, scope)`, while their listeners use the `cacheKey` of the request
   */
  emitInvalidation: (cacheKey: string, isTriggeredExternally = false, listenersKey = cacheKey): void => {
    emitter.emit(getInvalidateKey(), cacheKey, isTriggeredExternally);
    // Key goes as the event data, so the external trigger flag stays at its place for the emit observers
    emitter.emit(getInvalidateByKey(listenersKey), cacheKey, isTriggeredExternally);
  },
  /**
   * Delete of cache values
   * @param cacheKey key of the deleted element - the event data
   * @param isTriggeredExternally event comes from outside of the cache (for example from devtools)
   * @param listenersKey key the by-key listeners are subscribed with. Scoped elements are stored under
   * `scopeKey(cacheKey, scope)`, while their listeners use the `cacheKey` of the request
   */
  emitDelete: (cacheKey: string, isTriggeredExternally = false, listenersKey = cacheKey): void => {
    emitter.emit(getDeleteKey(), cacheKey, isTriggeredExternally);
    // Key goes as the event data, so the external trigger flag stays at its place for the emit observers
    emitter.emit(getDeleteByKey(listenersKey), cacheKey, isTriggeredExternally);
  },
  /**
   * Cache data listener for all keys
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
   * Cache data listener filtered by a specific cache key
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
   * Cache invalidation listener filtered by the cache key of the request.
   * Requests of every scope share that key - the callback receives the key of the invalidated element
   * (`scopeKey(cacheKey, scope)`), which tells the scopes apart.
   * @param cacheKey
   * @param callback
   * @returns
   */
  onInvalidateByKey: (cacheKey: string, callback: (invalidatedKey: string) => void): VoidFunction => {
    emitter.on(getInvalidateByKey(cacheKey), callback);
    return () => emitter.removeListener(getInvalidateByKey(cacheKey), callback);
  },
  /** Cache deletion listener for all keys */
  onDelete: (callback: (cacheKey: string) => void): VoidFunction => {
    emitter.on(getDeleteKey(), callback);
    return () => emitter.removeListener(getDeleteKey(), callback);
  },
  /**
   * Cache deletion listener filtered by the cache key of the request.
   * Requests of every scope share that key - the callback receives the key of the deleted element
   * (`scopeKey(cacheKey, scope)`), which tells the scopes apart.
   */
  onDeleteByKey: (cacheKey: string, callback: (deletedKey: string) => void): VoidFunction => {
    emitter.on(getDeleteByKey(cacheKey), callback);
    return () => emitter.removeListener(getDeleteByKey(cacheKey), callback);
  },
});
