import { FetchCommandDump, FetchCommandInstance } from "command";

// Values
export type FetchQueueStoreKeyType = string;
export type FetchQueueStoreValueType = FetchQueueValueType;
export type FetchQueueValueType = {
  endpointKey: string;
  requestKey: string;
  request: FetchCommandInstance;
  retries: number;
  timestamp: Date;
};
export type FetchQueueDumpValueType<ClientOptions> = {
  endpointKey: string;
  requestKey: string;
  request: FetchCommandDump<ClientOptions>;
  retries: number;
  timestamp: number;
};

// Options
export type FetchQueueOptionsType = {
  isRetry?: boolean;
  isRefreshed?: boolean;
  isRevalidated?: boolean;
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
  delete: (key: string) => void;
  clear: () => void;
};
