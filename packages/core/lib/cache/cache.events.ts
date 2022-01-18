import EventEmitter from "events";

import { CacheKeyType, CacheValueType, getEqualEventKey, getRevalidateEventKey } from "cache";
import { ExtractResponse, ExtractError } from "types";

export const getCacheEvents = (emitter: EventEmitter) => ({
  set: <T>(key: CacheKeyType, data: CacheValueType<ExtractResponse<T>, ExtractError<T>>): void => {
    emitter.emit(key, data);
  },
  setEqualData: (key: CacheKeyType, isRefreshed: boolean, timestamp: number): void => {
    emitter.emit(getEqualEventKey(key), isRefreshed, timestamp);
  },
  revalidate: (key: CacheKeyType): void => {
    emitter.emit(getRevalidateEventKey(key));
  },
  get: <T>(
    key: CacheKeyType,
    callback: (data: CacheValueType<ExtractResponse<T>, ExtractError<T>>) => void,
  ): VoidFunction => {
    emitter.on(key, callback);
    return () => emitter.removeListener(key, callback);
  },
  getEqualData: (key: CacheKeyType, callback: (isRefreshed: boolean, timestamp: number) => void): VoidFunction => {
    emitter.on(getEqualEventKey(key), callback);
    return () => emitter.removeListener(getEqualEventKey(key), callback);
  },
  onRevalidate: (key: CacheKeyType, callback: () => void): VoidFunction => {
    emitter.on(getRevalidateEventKey(key), callback);
    return () => emitter.removeListener(getRevalidateEventKey(key), callback);
  },
  umount: <T extends (...args: any[]) => void>(key: CacheKeyType, callback: T): void => {
    emitter.removeListener(key, callback);
  },
});
