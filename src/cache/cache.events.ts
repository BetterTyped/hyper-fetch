import EventEmitter from "events";

import { CacheKeyType, CacheValueType, getRefreshedKey, getRevalidateKey } from "cache";
import { ExtractResponse, ExtractError } from "types";

export const getCacheEvents = (emitter: EventEmitter) => ({
  set: <T>(key: CacheKeyType, data: CacheValueType<ExtractResponse<T>, ExtractError<T>>): void => {
    emitter.emit(key, data);
  },
  setRefreshed: (key: CacheKeyType): void => {
    emitter.emit(getRefreshedKey(key));
  },
  revalidate: (key: CacheKeyType): void => {
    emitter.emit(getRevalidateKey(key));
  },
  get: <T>(
    key: CacheKeyType,
    callback: (data: CacheValueType<ExtractResponse<T>, ExtractError<T>>) => void,
  ): VoidFunction => {
    emitter.on(key, callback);
    return () => emitter.removeListener(key, callback);
  },
  getRefreshed: (key: CacheKeyType, callback: () => void): VoidFunction => {
    emitter.on(getRefreshedKey(key), callback);
    return () => emitter.removeListener(getRefreshedKey(key), callback);
  },
  onRevalidate: (key: CacheKeyType, callback: () => void): VoidFunction => {
    emitter.on(getRevalidateKey(key), callback);
    return () => emitter.removeListener(getRevalidateKey(key), callback);
  },
  umount: <T extends (...args: any[]) => void>(key: CacheKeyType, callback: T): void => {
    emitter.removeListener(key, callback);
  },
});
