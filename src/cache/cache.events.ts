import EventEmitter from "events";

import { CacheKeyType, CacheValueType, getRevalidateKey } from "cache";
import { ExtractResponse, ExtractError } from "types";

export const cacheEventEmitter = new EventEmitter();

export const CACHE_EVENTS = {
  set: <T>(key: CacheKeyType, data: CacheValueType<ExtractResponse<T>, ExtractError<T>>): void => {
    cacheEventEmitter.emit(key, data);
  },
  get: <T>(key: CacheKeyType, callback: (data: CacheValueType<ExtractResponse<T>, ExtractError<T>>) => void): void => {
    cacheEventEmitter.on(key, callback);
  },
  revalidate: (key: CacheKeyType): void => {
    cacheEventEmitter.emit(getRevalidateKey(key));
  },
  onRevalidate: (key: CacheKeyType, callback: () => void): void => {
    cacheEventEmitter.on(getRevalidateKey(key), callback);
  },
  umount: <T extends (...args: any[]) => void>(key: CacheKeyType, callback: T): void => {
    cacheEventEmitter.removeListener(key, callback);
  },
};
