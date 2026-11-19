import type { CacheAsyncStorageType, CacheStorageType, CacheValueType } from "cache";
import type { HttpAdapterType } from "http-adapter";
import { xhrExtra } from "http-adapter";
import type { ResponseDetailsType } from "managers";

/**
 * Promise controlled from the outside - an explicit gate used instead of sleeps and timers.
 */
export type Deferred<T> = {
  promise: Promise<T>;
  resolve: (value: T) => void;
  reject: (error: unknown) => void;
};

export const createDeferred = <T = void>(): Deferred<T> => {
  let resolve!: (value: T) => void;
  let reject!: (error: unknown) => void;
  const promise = new Promise<T>((promiseResolve, promiseReject) => {
    resolve = promiseResolve;
    reject = promiseReject;
  });

  return { promise, resolve, reject };
};

/**
 * Waits for the promise callbacks which are already scheduled - it does not depend on any timer.
 */
export const flushPromises = async (rounds = 10) => {
  for (let i = 0; i < rounds; i += 1) {
    // eslint-disable-next-line no-await-in-loop
    await Promise.resolve();
  }
};

/**
 * Runs the action and waits for a full turn of the event loop - the moment when Node.js reports the rejections
 * nobody handled. Returns the collected rejections.
 */
export const getUnhandledRejections = async (action: () => unknown) => {
  const rejections: unknown[] = [];
  const onRejection = (error: unknown) => rejections.push(error);
  process.on("unhandledRejection", onRejection);
  try {
    await action();
    await new Promise((resolve) => {
      setImmediate(resolve);
    });
  } finally {
    process.off("unhandledRejection", onRejection);
  }
  return rejections;
};

/**
 * Errors of the user code (callbacks, listeners, plugins) are thrown from a timer, outside of the request lifecycle,
 * where the environment reports them. Runs the action, waits for the timers which are already scheduled and returns
 * everything that was thrown this way. Requires real timers.
 */
export const getThrownErrors = async (action: () => unknown) => {
  const errors: unknown[] = [];
  const onError = (error: unknown) => errors.push(error);
  process.on("uncaughtException", onError);
  try {
    await action();
    // Timers of the same delay run in the order they were set, so this one runs after the ones throwing the errors
    await new Promise((resolve) => {
      setTimeout(resolve, 0);
    });
  } finally {
    process.off("uncaughtException", onError);
  }
  return errors;
};

/**
 * Removes the global value until `vi.unstubAllGlobals()` gets called - e.g. to simulate an environment without window
 */
export const removeGlobal = (name: string) => {
  const missing: Record<string, unknown> = {};
  vi.stubGlobal(name, missing[name]);
};

export const createResponseDetails = (details: Partial<ResponseDetailsType> = {}): ResponseDetailsType => ({
  retries: 0,
  isCanceled: false,
  isOffline: false,
  willRetry: false,
  addedTimestamp: Date.now(),
  triggerTimestamp: Date.now(),
  requestTimestamp: Date.now(),
  responseTimestamp: Date.now(),
  ...details,
});

type CacheResponse<Data, Error> = Pick<
  CacheValueType<Data, Error, HttpAdapterType>,
  "data" | "error" | "status" | "success" | "extra" | keyof ResponseDetailsType
>;

/**
 * Successful response with the request details - the shape expected by `cache.set()`
 */
export const createCacheResponse = <Data>(
  data: Data,
  overrides: Partial<CacheResponse<Data, null>> = {},
): CacheResponse<Data, null> => ({
  data,
  error: null,
  status: 200,
  success: true,
  extra: xhrExtra,
  ...createResponseDetails(),
  ...overrides,
});

/**
 * Failed response with the request details - the shape expected by `cache.set()`
 */
export const createCacheErrorResponse = <Error>(
  error: Error,
  overrides: Partial<CacheResponse<null, Error>> = {},
): CacheResponse<null, Error> => ({
  data: null,
  error,
  status: 400,
  success: false,
  extra: xhrExtra,
  ...createResponseDetails(),
  ...overrides,
});

/**
 * Complete cache element, as it is kept in the storages
 */
export const createCacheValue = <Data = unknown>(
  overrides: Partial<CacheValueType<Data>> = {},
): CacheValueType<Data> => ({
  data: null,
  error: null,
  status: 200,
  success: true,
  extra: xhrExtra,
  ...createResponseDetails(),
  cacheKey: "cache-key",
  scope: null,
  staleTime: 10_000,
  cacheTime: 60_000,
  version: "0.0.1",
  cached: true,
  ...overrides,
});

/**
 * Sync storage which keeps the values as JSON strings - like localStorage, MMKV and other persistent storages do
 */
export const createJsonStorage = (
  source = new Map<string, string>(),
): CacheStorageType & { source: Map<string, string> } => ({
  source,
  set: (key, data) => {
    source.set(key, JSON.stringify(data));
  },
  get: (key) => {
    const value = source.get(key);
    return value ? JSON.parse(value) : undefined;
  },
  keys: () => [...source.keys()],
  delete: (key) => {
    source.delete(key);
  },
  clear: () => {
    source.clear();
  },
});

/**
 * Async storage backed by a Map, with the methods wrapped in spies
 */
export const createLazyStorage = (source = new Map<string, CacheValueType>()) => {
  const storage = {
    get: vi.fn(async (key: string) => source.get(key)),
    set: vi.fn(async (key: string, data: CacheValueType) => {
      source.set(key, data);
    }),
    keys: vi.fn(async () => [...source.keys()]),
    delete: vi.fn(async (key: string) => {
      source.delete(key);
    }),
  };

  return { source, storage: storage as unknown as CacheAsyncStorageType, spies: storage };
};
