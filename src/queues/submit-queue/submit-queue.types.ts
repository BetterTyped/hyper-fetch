import { FetchCommandDump, FetchCommandInstance } from "command";
import { isEqual } from "cache";

// Values
export type SubmitQueueStoreKeyType = string;
export type SubmitQueueStoreValueType = SubmitQueueValueType;
export type SubmitQueueValueType = {
  endpointKey: string;
  requestKey: string;
  request: FetchCommandInstance;
  retries: number;
  timestamp: Date;
};
export type SubmitQueueDumpValueType = {
  endpointKey: string;
  requestKey: string;
  request: FetchCommandDump<unknown>;
  retries: number;
  timestamp: number;
};
export type SubmitQueueData = {
  stopped: boolean;
  requests: SubmitQueueDumpValueType[];
};

// Options
export type SubmitQueueOptionsType = {
  cancelable?: boolean;
  queue?: boolean;
  queueName?: boolean;
  deepCompareFn?: typeof isEqual | undefined;
};

// Events
export type SubmitLoadingEventType = {
  isLoading: boolean;
  isRefreshed: boolean;
  isRevalidated: boolean;
  isRetry: boolean;
};

// Storage
export type SubmitQueueStorageType = {
  set: (key: string, data: SubmitQueueData) => void;
  get: (key: string) => SubmitQueueData | undefined;
  delete: (key: string) => void;
  clear: () => void;
};
