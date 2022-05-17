import { FetchCommandDump, FetchCommandInstance } from "command";
import { Dispatcher } from "dispatcher";

export type DispatcherOptionsType<ErrorType, HttpOptions> = {
  storage?: DispatcherStorageType<HttpOptions>;
  onInitialization?: (dispatcherInstance: Dispatcher<ErrorType, HttpOptions>) => void;
  onUpdateStorage?: (queueKey: string, data: DispatcherData<HttpOptions>) => void;
  onDeleteFromStorage?: (queueKey: string, data: DispatcherData<HttpOptions>) => void;
  onClearStorage?: (dispatcherInstance: Dispatcher<ErrorType, HttpOptions>) => void;
};

// Values
export type DispatcherDumpValueType<HttpOptions, Command = unknown> = {
  requestId: string;
  commandDump: FetchCommandDump<HttpOptions, Command>;
  retries: number;
  timestamp: number;
  stopped: boolean;
};
export type DispatcherData<HttpOptions, Command = unknown> = {
  requests: DispatcherDumpValueType<HttpOptions, Command>[];
  stopped: boolean;
};

// Storage
export type DispatcherStorageSyncType<HttpOptions> = {
  set: (key: string, data: DispatcherData<HttpOptions>) => void;
  get: (key: string) => DispatcherData<HttpOptions> | undefined;
  keys: () => string[] | IterableIterator<string>;
  delete: (key: string) => void;
  clear: () => void;
};

export type DispatcherStorageType<HttpOptions> = DispatcherStorageSyncType<HttpOptions>;

// Running

export type RunningRequestValueType = {
  requestId: string;
  command: FetchCommandInstance;
};

// Events
export type DispatcherLoadingEventType = {
  isLoading: boolean;
  isRetry: boolean;
  isOffline: boolean;
};
