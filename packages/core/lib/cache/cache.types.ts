import { Cache } from "cache";
import { ClientResponseType } from "client";

export type CacheOptionsType<ErrorType, HttpOptions> = {
  storage?: CacheStorageType;
  initialData?: CacheInitialData;
  onInitialization?: (cache: Cache<ErrorType, HttpOptions>) => void;
};

// Values
export type CacheStoreKeyType = string;
export type CacheStoreValueType<T = any> = CacheValueType<T>;

export type CacheKeyType = string;
export type CacheValueType<DataType = any, ErrorType = any> = {
  response: ClientResponseType<DataType, ErrorType>;
  retries: number;
  timestamp: number;
  refreshError?: ErrorType;
  retryError?: ErrorType;
  isRefreshed: boolean;
};

// Events
export type CacheSetDataType<Response, ErrorType> = {
  cache: boolean;
  cacheKey: CacheKeyType;
  response: ClientResponseType<Response, ErrorType>;
  retries?: number;
  isRefreshed?: boolean;
  timestamp?: number;
  deepEqual?: boolean;
};

// Storage
export type CacheStorageSyncType = {
  set: <DataType>(key: string, data: CacheValueType<DataType>) => void;
  get: <DataType>(key: string) => CacheStoreValueType<DataType> | undefined;
  keys: () => string[] | IterableIterator<string>;
  delete: (key: string) => void;
  clear: () => void;
};
export type CacheStorageAsyncType = {
  set: <DataType>(key: string, data: CacheValueType<DataType>) => Promise<void>;
  get: <DataType>(key: string) => Promise<CacheStoreValueType<DataType> | undefined>;
  keys: () => Promise<string[] | IterableIterator<string>>;
  delete: (key: string) => Promise<void>;
  clear: () => Promise<void>;
};

export type CacheStorageType = CacheStorageSyncType | CacheStorageAsyncType;

export type CacheInitialData = Record<CacheStoreKeyType, CacheStoreValueType>;
