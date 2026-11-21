import type { RequestInstance, RequestJSON } from "request";

export type DispatcherOptionsType = {
  /** Synchronous storage of the queues - the in-memory `Map` by default */
  storage?: DispatcherStorageType;
  /**
   * Asynchronous persistent storage of the queues - IndexedDB, AsyncStorage and similar. Every change of the queues is
   * written to it as JSON data, in order. On start the dispatcher reads it, puts the persisted requests in front of the
   * ones added meanwhile and sends them.
   */
  lazyStorage?: DispatcherAsyncStorageType;
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

/**
 * Asynchronous storage of the queues. It receives plain JSON data - requests are saved with `request.toJSON()`, so
 * their functions (mappers, a function `retryTime`) are not kept.
 */
export type DispatcherAsyncStorageType = {
  set: (key: string, data: QueueDataType) => Promise<void>;
  get: (key: string) => Promise<QueueDataType | undefined>;
  keys: () => Promise<string[] | IterableIterator<string>>;
  delete: (key: string) => Promise<void>;
};

// Running

export type RunningRequestValueType = {
  requestId: string;
  request: RequestInstance;
  timestamp: number;
};

export type RunningRequestsChangeType = {
  queryKey: string;
  runningRequests: RunningRequestValueType[];
};
