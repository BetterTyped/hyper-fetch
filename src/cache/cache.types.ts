import { ClientResponseType } from "client";

export type CacheStoreKeyType = string;
export type CacheStoreValueType<T = unknown> = Record<CacheKeyType, CacheValueType<T>>;

export type CacheKeyType = string;
export type CacheValueType<DataType = any, ErrorType = any> = {
  response: ClientResponseType<DataType, ErrorType>;
  retries: number;
  timestamp: number;
  refreshError: ErrorType;
  retryError: ErrorType;
  isRefreshed: boolean;
};

export type CacheSetDataType<Response, ErrorType> = {
  cacheKey: CacheKeyType;
  requestKey: CacheKeyType;
  response: ClientResponseType<Response, ErrorType>;
  retries: number;
  isRefreshed: boolean;
  timestamp?: number;
  deepEqual?: boolean;
};

export type CacheStorageType = {
  set: (key: string, data: CacheStoreValueType) => void;
  get: (key: string) => CacheStoreValueType | undefined;
  delete: (key: string) => void;
  clear: () => void;
};

export type CacheInitialData = Record<CacheStoreKeyType, CacheStoreValueType>;
