import { FetchCommandDump, FetchCommandInstance } from "command";

// Values
export type FetchQueueStoreKeyType = string;
export type FetchQueueStoreValueType = FetchCommandInstance;
export type FetchQueueAddOptionsType = {
  isRefreshed?: boolean;
  isRevalidated?: boolean;
};

export type FetchQueueDumpValueType<ClientOptions> = {
  isRefreshed: boolean;
  isRevalidated: boolean;
  commandDump: FetchCommandDump<ClientOptions>;
  retries: number;
  timestamp: number;
};

// Events
export type FetchLoadingEventType = {
  isLoading: boolean;
  isRefreshed: boolean;
  isRevalidated: boolean;
  isRetry: boolean;
};

// Storage
export type FetchQueueStorageType<ClientOptions> = {
  set: (key: string, data: FetchQueueDumpValueType<ClientOptions>) => void;
  get: (key: string) => FetchQueueDumpValueType<ClientOptions> | undefined;
  keys: () => string[] | IterableIterator<string>;
  delete: (key: string) => void;
  clear: () => void;
};
