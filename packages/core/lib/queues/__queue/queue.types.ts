import { FetchCommandDump, FetchCommandInstance } from "command";
import { Queue } from "queues";

export type QueueOptionsType<ErrorType, HttpOptions> = {
  storage: QueueStorageType<HttpOptions>;
  onInitialization: (queueInstance: Queue<ErrorType, HttpOptions>) => void;
  onUpdateStorage: (queueKey: string, queue: QueueData<HttpOptions>) => void;
  onDeleteFromStorage: (queueKey: string, queue: QueueData<HttpOptions>) => void;
  onClearStorage: (queueInstance: Queue<ErrorType, HttpOptions>) => void;
};

// Values
export type QueueStoreKeyType = string;
export type QueueStoreValueType = FetchCommandInstance;

export type QueueDumpValueType<HttpOptions> = {
  requestId: string;
  commandDump: FetchCommandDump<HttpOptions>;
  retries: number;
  timestamp: number;
};
export type QueueData<HttpOptions> = {
  stopped: boolean;
  requests: QueueDumpValueType<HttpOptions>[];
};

// Events
export type LoadingEventType = {
  isLoading: boolean;
  isRetry: boolean;
};
export type QueueStatusEventType = {
  stopped: boolean;
};

// Storage
export type QueueStorageSyncType<HttpOptions> = {
  set: (key: string, data: QueueData<HttpOptions>) => void;
  get: (key: string) => QueueData<HttpOptions> | undefined;
  keys: () => string[] | IterableIterator<string>;
  delete: (key: string) => void;
  clear: () => void;
};
export type QueueStorageAsyncType<HttpOptions> = {
  set: (key: string, data: QueueData<HttpOptions>) => Promise<void>;
  get: (key: string) => Promise<QueueData<HttpOptions> | undefined>;
  keys: () => Promise<string[] | IterableIterator<string>>;
  delete: (key: string) => Promise<void>;
  clear: () => Promise<void>;
};
export type QueueStorageType<HttpOptions> = QueueStorageSyncType<HttpOptions> | QueueStorageAsyncType<HttpOptions>;

// Running

export type RunningRequestValueType = {
  id: string;
  command: FetchCommandInstance;
};
