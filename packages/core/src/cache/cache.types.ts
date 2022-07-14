import { Cache } from "cache";
import { ClientResponseType } from "client";
import { CommandResponseDetails } from "managers";

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
  onChange?: <Response = any, Error = any>(key: string, data: CacheValueType<Response, Error>) => void;
  /**
   * Callback for every delete in the storage
   */
  onDelete?: (key: string) => void;
};

// Values
export type CacheValueType<Response = any, Error = any> = {
  data: ClientResponseType<Response, Error>;
  details: CommandResponseDetails;
  cacheTime: number;
  clearKey: string;
};

// Storage
export type CacheAsyncStorageType = {
  set: <Response, Error>(key: string, data: CacheValueType<Response, Error>) => Promise<void>;
  get: <Response, Error>(key: string) => Promise<CacheValueType<Response, Error> | undefined>;
  keys: () => Promise<string[] | IterableIterator<string> | string[]>;
  delete: (key: string) => Promise<void>;
};

export type CacheStorageType = {
  set: <Response, Error>(key: string, data: CacheValueType<Response, Error>) => void;
  get: <Response, Error>(key: string) => CacheValueType<Response, Error> | undefined;
  keys: () => string[] | IterableIterator<string> | string[];
  delete: (key: string) => void;
  clear: () => void;
};

export type CacheInitialData = Record<string, CacheValueType>;
