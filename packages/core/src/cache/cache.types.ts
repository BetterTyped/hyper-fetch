import { Cache } from "cache";
import { BaseAdapterType, ResponseReturnType } from "adapter";
import { ResponseDetailsType } from "managers";

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
   * Key to clear lazy storage data
   */
  clearKey?: string;
  /**
   * Initialization callback
   */
  onInitialization?: (cache: Cache) => void;
  /**
   * Callback for every change in the storage
   */
  onChange?: <Response = any, Error = any, AdapterType extends BaseAdapterType = BaseAdapterType>(
    key: string,
    data: CacheValueType<Response, Error, AdapterType>,
  ) => void;
  /**
   * Callback for every delete in the storage
   */
  onDelete?: (key: string) => void;
};

// Values
export type CacheValueType<Response = any, Error = any, AdapterType extends BaseAdapterType = BaseAdapterType> = {
  data: ResponseReturnType<Response, Error, AdapterType>;
  details: ResponseDetailsType;
  cacheTime: number;
  clearKey: string;
  garbageCollection: number;
};

// Storage
export type CacheAsyncStorageType = {
  set: <Response, Error, AdapterType extends BaseAdapterType>(
    key: string,
    data: CacheValueType<Response, Error, AdapterType>,
  ) => Promise<void>;
  get: <Response, Error, AdapterType extends BaseAdapterType>(
    key: string,
  ) => Promise<CacheValueType<Response, Error, AdapterType> | undefined>;
  keys: () => Promise<string[] | IterableIterator<string> | string[]>;
  delete: (key: string) => Promise<void>;
};

export type CacheStorageType = {
  set: <Response, Error, AdapterType extends BaseAdapterType>(
    key: string,
    data: CacheValueType<Response, Error, AdapterType>,
  ) => void;
  get: <Response, Error, AdapterType extends BaseAdapterType>(
    key: string,
  ) => CacheValueType<Response, Error, AdapterType> | undefined;
  keys: () => string[] | IterableIterator<string> | string[];
  delete: (key: string) => void;
  clear: () => void;
};

export type CacheInitialData = Record<string, CacheValueType>;
