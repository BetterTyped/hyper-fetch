import { FetchCommandDump, FetchCommandInstance } from "command";
import { SubmitQueue } from "queues";

export type SubmitQueueOptionsType<ErrorType, ClientOptions> = {
  storage: SubmitQueueStorageType<ClientOptions>;
  onInitialization: (submitQueue: SubmitQueue<ErrorType, ClientOptions>) => void;
};

// Values
export type SubmitQueueStoreKeyType = string;
export type SubmitQueueStoreValueType = FetchCommandInstance;

export type SubmitQueueDumpValueType<ClientOptions> = {
  commandDump: FetchCommandDump<ClientOptions>;
  retries: number;
  timestamp: number;
};
export type SubmitQueueData<ClientOptions> = {
  stopped: boolean;
  cancelable: boolean;
  queued: boolean;
  requests: SubmitQueueDumpValueType<ClientOptions>[];
};

// Events
export type SubmitLoadingEventType = {
  isLoading: boolean;
  isRetry: boolean;
};
export type SubmitQueueStatusEventType = {
  stopped: boolean;
};

// Storage
export type SubmitQueueStorageType<ClientOptions> = {
  set: (key: string, data: SubmitQueueData<ClientOptions>) => void;
  get: (key: string) => SubmitQueueData<ClientOptions> | undefined;
  keys: () => string[] | IterableIterator<string>;
  delete: (key: string) => void;
  clear: () => void;
};
