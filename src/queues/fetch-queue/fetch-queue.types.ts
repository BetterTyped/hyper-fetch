import { FetchCommandDump, FetchCommandInstance } from "command";
import { isEqual } from "cache";

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
export type FetchQueueDumpValueType = {
  endpointKey: string;
  requestKey: string;
  request: FetchCommandDump<unknown>;
  retries: number;
  timestamp: number;
};

// Options
export type FetchQueueOptionsType = {
  cancelable?: boolean;
  isRetry?: boolean;
  isRefreshed?: boolean;
  isRevalidated?: boolean;
  deepCompareFn?: typeof isEqual | undefined;
};

// Events
export type FetchLoadingEventType = {
  isLoading: boolean;
  isRefreshed: boolean;
  isRevalidated: boolean;
  isRetry: boolean;
};

// Storage
export type FetchQueueStorageType = {
  set: (key: string, data: FetchQueueDumpValueType) => void;
  get: (key: string) => FetchQueueDumpValueType | undefined;
  delete: (key: string) => void;
  clear: () => void;
};
