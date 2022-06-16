import EventEmitter from "events";
import { CacheValueType, CacheStorageType } from "cache";
export declare const getCacheEvents: (emitter: EventEmitter, storage: CacheStorageType) => {
    set: <Response_1, Error_1>(cacheKey: string, data: CacheValueType<Response_1, Error_1>) => void;
    /**
     * Revalidate cache values and trigger revalidate event
     * @param cacheKey Allow to revalidate cache based on the `cacheKey`, `string pattern` or `regexp` pattern for matching
     */
    revalidate: (cacheKey: string | RegExp) => void;
    get: <Response_2, Error_2>(cacheKey: string, callback: (data: CacheValueType<Response_2, Error_2>) => void) => VoidFunction;
    onRevalidate: (cacheKey: string, callback: () => void) => VoidFunction;
};
