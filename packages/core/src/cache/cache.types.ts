import { AdapterInstance, ResponseType } from "adapter";
import { ResponseDetailsType } from "managers";
import { RequestInstance } from "request";

export type CacheOptionsType = {
  /**
   * Assign your custom sync storage
   */
  storage?: CacheStorageType;
  /**
   * Lazy loading from remote resources - possibly persistent
   */
  lazyStorage?: CacheAsyncStorageType;
  /**
   * Key to clear lazy storage data, often used for versioning
   * If the new key is different from the old one, the cache will be cleared
   */
  version?: string;
};

// Values
export type CacheValueType<
  Response = any,
  Error = any,
  Adapter extends AdapterInstance = AdapterInstance,
> = ResponseType<Response, Error, Adapter> &
  ResponseDetailsType & {
    cacheKey: string;
    staleTime: number;
    version: string;
    cacheTime: number;
    cached: boolean;
    hydrated?: boolean;
  };

// Storage
export type CacheAsyncStorageType = {
  set: <Response, Error, Adapter extends AdapterInstance>(
    key: string,
    data: CacheValueType<Response, Error, Adapter>,
  ) => Promise<void>;
  get: <Response, Error, Adapter extends AdapterInstance>(
    key: string,
  ) => Promise<CacheValueType<Response, Error, Adapter> | undefined>;
  keys: () => Promise<string[] | IterableIterator<string> | string[]>;
  delete: (key: string) => Promise<void>;
};

export type CacheStorageType = {
  set: <Response, Error, Adapter extends AdapterInstance>(
    key: string,
    data: CacheValueType<Response, Error, Adapter>,
  ) => void;
  get: <Response, Error, Adapter extends AdapterInstance>(
    key: string,
  ) => CacheValueType<Response, Error, Adapter> | undefined;
  keys: () => string[] | IterableIterator<string> | string[];
  delete: (key: string) => void;
  clear: () => void;
};

export type CacheInitialData = Record<string, CacheValueType>;

export type CacheSetState<CacheData> = CacheData | ((previousData: CacheData | null) => CacheData);

export type RequestCacheType<R extends RequestInstance> = Pick<R, "cacheKey" | "cache" | "staleTime" | "cacheTime">;
