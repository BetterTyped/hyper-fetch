import { RequestInstance } from "request";

export type DispatcherOptionsType = {
  storage?: DispatcherStorageType;
};

// Values
export type QueueItemType<Request extends RequestInstance = RequestInstance> = {
  requestId: string;
  request: Request;
  retries: number;
  timestamp: number;
  stopped: boolean;
  /** Resolved when we receive response */
  resolved: boolean;
};
export type QueueDataType<Request extends RequestInstance = RequestInstance> = {
  queryKey: string;
  requests: QueueItemType<Request>[];
  stopped: boolean;
};

// Storage
export type DispatcherStorageType = {
  set: <Request extends RequestInstance = RequestInstance>(key: string, data: QueueDataType<Request>) => void;
  get: <Request extends RequestInstance = RequestInstance>(key: string) => QueueDataType<Request> | undefined;
  keys: () => string[] | IterableIterator<string>;
  entries: () => [string, QueueDataType] | IterableIterator<[string, QueueDataType<any>]>;
  delete: (key: string) => void;
  clear: () => void;
};

// Running

export type RunningRequestValueType = {
  requestId: string;
  request: RequestInstance;
  timestamp: number;
};
