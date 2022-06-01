import { Dispatcher } from "dispatcher";
import { FetchCommandDump, FetchCommandInstance } from "command";

export type DispatcherOptionsType = {
  storage?: DispatcherStorageType;
  onInitialization?: (dispatcherInstance: Dispatcher) => void;
  onUpdateStorage?: <Command extends FetchCommandInstance>(queueKey: string, data: DispatcherData<Command>) => void;
  onDeleteFromStorage?: <Command extends FetchCommandInstance>(queueKey: string, data: DispatcherData<Command>) => void;
  onClearStorage?: (dispatcherInstance: Dispatcher) => void;
};

// Values
export type DispatcherDumpValueType<Command extends FetchCommandInstance = FetchCommandInstance> = {
  requestId: string;
  commandDump: FetchCommandDump<Command>;
  retries: number;
  timestamp: number;
  stopped: boolean;
};
export type DispatcherData<Command extends FetchCommandInstance = FetchCommandInstance> = {
  requests: DispatcherDumpValueType<Command>[];
  stopped: boolean;
};

// Storage
export type DispatcherStorageSyncType = {
  set: <Command extends FetchCommandInstance = FetchCommandInstance>(
    key: string,
    data: DispatcherData<Command>,
  ) => void;
  get: <Command extends FetchCommandInstance = FetchCommandInstance>(
    key: string,
  ) => DispatcherData<Command> | undefined;
  keys: () => string[] | IterableIterator<string>;
  delete: (key: string) => void;
  clear: () => void;
};

export type DispatcherStorageType = DispatcherStorageSyncType;

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
