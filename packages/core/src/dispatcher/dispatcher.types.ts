import { Dispatcher } from "dispatcher";
import { RequestDump, RequestInstance } from "request";

export type DispatcherOptionsType = {
  storage?: DispatcherStorageType;
  onInitialization?: (dispatcherInstance: Dispatcher) => void;
  onUpdateStorage?: <Request extends RequestInstance>(queueKey: string, data: QueueDataType<Request>) => void;
  onDeleteFromStorage?: <Request extends RequestInstance>(queueKey: string, data: QueueDataType<Request>) => void;
  onClearStorage?: (dispatcherInstance: Dispatcher) => void;
};

// Values
export type DispatcherStorageValueType<Request extends RequestInstance = RequestInstance> = {
  requestId: string;
  requestDump: RequestDump<Request>;
  retries: number;
  timestamp: number;
  stopped: boolean;
};
export type QueueDataType<Request extends RequestInstance = RequestInstance> = {
  requests: DispatcherStorageValueType<Request>[];
  stopped: boolean;
};

// Storage
export type DispatcherStorageType = {
  set: <Request extends RequestInstance = RequestInstance>(key: string, data: QueueDataType<Request>) => void;
  get: <Request extends RequestInstance = RequestInstance>(key: string) => QueueDataType<Request> | undefined;
  keys: () => string[] | IterableIterator<string>;
  delete: (key: string) => void;
  clear: () => void;
};

// Running

export type RunningRequestValueType = {
  requestId: string;
  request: RequestInstance;
};
