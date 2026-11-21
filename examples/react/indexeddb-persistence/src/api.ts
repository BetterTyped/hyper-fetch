import { Cache, type CacheAsyncStorageType, createClient, Time } from "@hyper-fetch/core";
import { createStore, del, entries, get, keys, set } from "idb-keyval";

const store = createStore("hyper-fetch-indexeddb-persistence", "cache");

/**
 * An async storage. IndexedDB stores structured clones, so there is no JSON step, and the browser gives it a share of
 * the disk instead of the few megabytes of localStorage.
 */
const indexedDbStorage: CacheAsyncStorageType = {
  set: (key, data) => set(key, data, store),
  get: (key) => get(key, store),
  keys: () => keys<string>(store),
  delete: (key) => del(key, store),
};

export const client = createClient({
  url: "https://dummyjson.com",
  // Memory stays the main storage. `lazyStorage` gets every write, and is read when a key is missing in memory.
  cache: () => new Cache({ lazyStorage: indexedDbStorage }),
});

/** Bytes per saved entry, read straight from IndexedDB for the panel. */
export const readSavedEntries = async () => {
  const saved = await entries<string, { data: unknown }>(store);
  return saved.map(([key, value]) => ({ key, bytes: new Blob([JSON.stringify(value.data)]).size }));
};

export type Product = { id: number; title: string; category: string; price: number; stock: number };

export const getProducts = client.createRequest<{
  response: { products: Product[]; total: number };
  queryParams: { limit: number; delay: number };
}>()({
  endpoint: "/products",
  // Saved data is only loaded while it is fresh, so keep it fresh for a day and stored for a week.
  staleTime: Time.DAY,
  cacheTime: Time.WEEK,
});
