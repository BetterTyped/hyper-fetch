import EventEmitter from "events";

import { CacheKeyType, CacheValueType } from "cache";
import { ExtractResponse, ExtractError } from "types";

export const cacheEventEmitter = new EventEmitter();

export const CACHE_EVENTS = {
  set: <T>(key: CacheKeyType, data: CacheValueType<ExtractResponse<T>, ExtractError<T>>) =>
    cacheEventEmitter.emit(key, data),
  get: <T>(key: CacheKeyType, callback: (data: CacheValueType<ExtractResponse<T>, ExtractError<T>>) => void) =>
    cacheEventEmitter.on(key, callback),
};
