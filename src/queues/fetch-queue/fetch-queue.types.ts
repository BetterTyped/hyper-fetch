import { FetchCommandDump, FetchCommandInstance } from "command";

// Values
export type FetchQueueStoreKeyType = string;
export type FetchQueueStoreValueType = FetchQueueValueType;
export type FetchQueueValueType = {
  isRefreshed: boolean;
  isRevalidated: boolean;
  endpointKey: string;
  requestKey: string;
  request: FetchCommandInstance;
  retries: number;
  timestamp: Date;
};
export type FetchQueueDumpValueType<ClientOptions> = Omit<FetchQueueValueType, "request" | "timestamp"> & {
  request: FetchCommandDump<ClientOptions>;
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
