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
export type SubmitQueueDumpValueType<ClientOptions> = {
  endpointKey: string;
  requestKey: string;
  request: FetchCommandDump<ClientOptions>;
  retries: number;
  timestamp: number;
};
export type SubmitQueueData<ClientOptions> = {
  stopped: boolean;
  cancelable: boolean;
  queued: boolean;
  requests: SubmitQueueDumpValueType<ClientOptions>[];
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
export type SubmitQueueStorageType<ClientOptions> = {
  set: (key: string, data: SubmitQueueData<ClientOptions>) => void;
  get: (key: string) => SubmitQueueData<ClientOptions> | undefined;
  delete: (key: string) => void;
  clear: () => void;
};
