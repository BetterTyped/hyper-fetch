import { Cache, type CacheStorageType, createClient } from "@hyper-fetch/core";

/** The error body dummyjson sends with a 4xx status, for example `{ "message": "products can not be empty" }`. */
export type ApiError = { message: string };

const PREFIX = "hyper-fetch-shop:";
const savedKeys = () =>
  Object.keys(localStorage)
    .filter((key) => key.startsWith(PREFIX))
    .map((key) => key.slice(PREFIX.length));

/** A synchronous localStorage storage: the cart and the visited pages are there on the first render after a reload. */
const localStorageCache: CacheStorageType = {
  set: (key, data) => localStorage.setItem(PREFIX + key, JSON.stringify(data)),
  get: (key) => {
    const value = localStorage.getItem(PREFIX + key);
    return value ? JSON.parse(value) : undefined;
  },
  keys: savedKeys,
  delete: (key) => localStorage.removeItem(PREFIX + key),
  clear: () => savedKeys().forEach((key) => localStorage.removeItem(PREFIX + key)),
};

export const client = createClient<{ error: ApiError }>({
  url: "https://dummyjson.com",
  // Bump `version` when the shape of the saved data changes: entries saved by another version are dropped.
  cache: () => new Cache({ storage: localStorageCache, version: "1" }),
});
