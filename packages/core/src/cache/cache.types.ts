import { Cache } from "cache";
import { AdapterInstance, ResponseReturnType } from "adapter";
import { ResponseDetailsType } from "managers";
import { ClientInstance } from "../client";

export type CacheOptionsType<C extends ClientInstance = ClientInstance> = {
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
  onInitialization?: (cache: Cache<C>) => void;
  /**
   * Callback for every change in the storage
   */
  onChange?: <Response = any, Error = any, Adapter extends AdapterInstance = AdapterInstance>(
    key: string,
    data: CacheValueType<Response, Error, Adapter>,
  ) => void;
  /**
   * Callback for every delete in the storage
   */
  onDelete?: (key: string) => void;
};

// Values
export type CacheValueType<
  Response = any,
  Error = any,
  Adapter extends AdapterInstance = AdapterInstance,
> = ResponseReturnType<Response, Error, Adapter> &
  ResponseDetailsType & {
    cacheTime: number;
    clearKey: string;
    garbageCollection: number;
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

export type CacheMethodType<CacheData> = CacheData | ((previousData: CacheData | null) => CacheData);
