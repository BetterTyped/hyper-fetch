import { Dispatcher } from "dispatcher";
import { CommandDump, CommandInstance } from "command";

export type DispatcherOptionsType = {
  storage?: DispatcherStorageType;
  onInitialization?: (dispatcherInstance: Dispatcher) => void;
  onUpdateStorage?: <Command extends CommandInstance>(queueKey: string, data: DispatcherData<Command>) => void;
  onDeleteFromStorage?: <Command extends CommandInstance>(queueKey: string, data: DispatcherData<Command>) => void;
  onClearStorage?: (dispatcherInstance: Dispatcher) => void;
};

// Values
export type DispatcherDumpValueType<Command extends CommandInstance = CommandInstance> = {
  requestId: string;
  commandDump: CommandDump<Command>;
  retries: number;
  timestamp: number;
  stopped: boolean;
};
export type DispatcherData<Command extends CommandInstance = CommandInstance> = {
  requests: DispatcherDumpValueType<Command>[];
  stopped: boolean;
};

// Storage
export type DispatcherStorageSyncType = {
  set: <Command extends CommandInstance = CommandInstance>(key: string, data: DispatcherData<Command>) => void;
  get: <Command extends CommandInstance = CommandInstance>(key: string) => DispatcherData<Command> | undefined;
  keys: () => string[] | IterableIterator<string>;
  delete: (key: string) => void;
  clear: () => void;
};

export type DispatcherStorageType = DispatcherStorageSyncType;

// Running

export type RunningRequestValueType = {
  requestId: string;
  command: CommandInstance;
};

// Events
export type DispatcherLoadingEventType = {
  isLoading: boolean;
  isRetry: boolean;
  isOffline: boolean;
};
