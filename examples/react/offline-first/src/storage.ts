import type { CacheAsyncStorageType, CacheValueType, DispatcherStorageType } from "@hyper-fetch/core";
import { createStore, del, entries, get, keys, set } from "idb-keyval";

// ---------- Cache: IndexedDB ----------

const cacheStore = createStore("hyper-fetch-offline-first", "cache");

/** Async storage for the cache. IndexedDB keeps structured data and has room for far more than localStorage. */
export const indexedDbCache: CacheAsyncStorageType = {
  set: (key, data) => set(key, data, cacheStore),
  get: (key) => get(key, cacheStore),
  keys: () => keys<string>(cacheStore),
  delete: (key) => del(key, cacheStore),
};

/** Everything the cache saved in earlier visits, read once before the first render. */
export const readPersistedCache = () => entries<string, CacheValueType>(cacheStore);

// ---------- Queue: localStorage ----------

const QUEUE_PREFIX = "hyper-fetch-queue:";

const queueKeys = () =>
  Object.keys(localStorage)
    .filter((key) => key.startsWith(QUEUE_PREFIX))
    .map((key) => key.slice(QUEUE_PREFIX.length));

const readQueue = (key: string) => {
  const value = localStorage.getItem(QUEUE_PREFIX + key);
  return value ? JSON.parse(value) : undefined;
};

/** The dispatcher reads its queue synchronously, so the queue goes to localStorage, not IndexedDB. */
export const localStorageQueue: DispatcherStorageType = {
  set: (key, data) => localStorage.setItem(QUEUE_PREFIX + key, JSON.stringify(data)),
  get: readQueue,
  keys: queueKeys,
  entries: function* () {
    for (const key of queueKeys()) yield [key, readQueue(key)];
  },
  delete: (key) => localStorage.removeItem(QUEUE_PREFIX + key),
  clear: () => queueKeys().forEach((key) => localStorage.removeItem(QUEUE_PREFIX + key)),
};

// ---------- Demo network switch ----------

const OFFLINE_KEY = "demo-offline";

export const wasOffline = () => localStorage.getItem(OFFLINE_KEY) === "true";
export const saveOffline = (offline: boolean) => localStorage.setItem(OFFLINE_KEY, String(offline));
