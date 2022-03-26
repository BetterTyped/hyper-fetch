import { Cache } from "cache";
import { ClientResponseType } from "client";
import { CommandResponseDetails } from "managers";

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
  data: ClientResponseType<DataType, ErrorType>;
  details: CommandResponseDetails;
  refreshError: ErrorType | null;
  retryError: ErrorType | null;
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
