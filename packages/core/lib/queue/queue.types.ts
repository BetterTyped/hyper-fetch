import { FetchCommandDump, FetchCommandInstance } from "command";
import { Queue } from "queue";

export type QueueOptionsType<ErrorType, HttpOptions> = {
  storage?: QueueStorageType<HttpOptions>;
  onInitialization?: (queueInstance: Queue<ErrorType, HttpOptions>) => void;
  onUpdateStorage?: (queueKey: string, queue: QueueData<HttpOptions>) => void;
  onDeleteFromStorage?: (queueKey: string, queue: QueueData<HttpOptions>) => void;
  onClearStorage?: (queueInstance: Queue<ErrorType, HttpOptions>) => void;
};

// Values
export type QueueStoreKeyType = string;
export type QueueStoreValueType = FetchCommandInstance;

export type QueueDumpValueType<HttpOptions, Command = unknown> = {
  requestId: string;
  commandDump: FetchCommandDump<HttpOptions, Command>;
  retries: number;
  timestamp: number;
  stopped: boolean;
};
export type QueueData<HttpOptions, Command = unknown> = {
  requests: QueueDumpValueType<HttpOptions, Command>[];
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

export type QueueStorageType<HttpOptions> = QueueStorageSyncType<HttpOptions>;

// Running

export type RunningRequestValueType = {
  requestId: string;
  command: FetchCommandInstance;
};

// Events
export type QueueLoadingEventType = {
  isLoading: boolean;
  isRetry: boolean;
  isOffline: boolean;
};
