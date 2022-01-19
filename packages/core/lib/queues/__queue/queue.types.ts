import { FetchCommandDump, FetchCommandInstance } from "command";
import { Queue } from "queues";

export type QueueOptionsType<ErrorType, ClientOptions> = {
  storage: QueueStorageType<ClientOptions>;
  onInitialization: (queueInstance: Queue<ErrorType, ClientOptions>) => void;
  onUpdateStorage: (queueKey: string, queue: QueueData<ClientOptions>) => void;
  onDeleteFromStorage: (queueKey: string, queue: QueueData<ClientOptions>) => void;
  onClearStorage: (queueInstance: Queue<ErrorType, ClientOptions>) => void;
};

// Values
export type QueueStoreKeyType = string;
export type QueueStoreValueType = FetchCommandInstance;

export type QueueDumpValueType<ClientOptions> = {
  requestId: string;
  commandDump: FetchCommandDump<ClientOptions>;
  retries: number;
  timestamp: number;
};
export type QueueData<ClientOptions> = {
  stopped: boolean;
  requests: QueueDumpValueType<ClientOptions>[];
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
export type QueueStorageSyncType<ClientOptions> = {
  set: (key: string, data: QueueData<ClientOptions>) => void;
  get: (key: string) => QueueData<ClientOptions> | undefined;
  keys: () => string[] | IterableIterator<string>;
  delete: (key: string) => void;
  clear: () => void;
};
export type QueueStorageAsyncType<ClientOptions> = {
  set: (key: string, data: QueueData<ClientOptions>) => Promise<void>;
  get: (key: string) => Promise<QueueData<ClientOptions> | undefined>;
  keys: () => Promise<string[] | IterableIterator<string>>;
  delete: (key: string) => Promise<void>;
  clear: () => Promise<void>;
};
export type QueueStorageType<ClientOptions> =
  | QueueStorageSyncType<ClientOptions>
  | QueueStorageAsyncType<ClientOptions>;

// Running

export type RunningRequestValueType = {
  id: string;
  command: FetchCommandInstance;
};
