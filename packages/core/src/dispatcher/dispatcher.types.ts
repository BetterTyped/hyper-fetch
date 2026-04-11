import { RequestInstance, RequestJSON } from "request";

export type DispatcherOptionsType = {
  storage?: DispatcherStorageType;
};

// Values
export type QueueItemType<Request extends RequestInstance = RequestInstance> = {
  requestId: string;
  request: Request | RequestJSON<Request>;
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

/**
 * Queue item after JSON requests have been reconstructed back to class instances.
 * This is the type returned by `getQueue` and consumed by `performRequest`.
 */
export type ResolvedQueueItemType<Request extends RequestInstance = RequestInstance> = Omit<
  QueueItemType<Request>,
  "request"
> & {
  request: Request;
};

export type ResolvedQueueDataType<Request extends RequestInstance = RequestInstance> = {
  queryKey: string;
  requests: ResolvedQueueItemType<Request>[];
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
