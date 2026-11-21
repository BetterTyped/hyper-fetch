import { Cache, type CacheStorageType, createClient, Time } from "@hyper-fetch/core";

const PREFIX = "hyper-fetch-cache:";

/** Keys of the cache entries saved in localStorage. */
export const persistedKeys = () =>
  Object.keys(localStorage)
    .filter((key) => key.startsWith(PREFIX))
    .map((key) => key.slice(PREFIX.length));

/** A synchronous storage, so cached data is available on the very first render after a reload. */
const localStorageCache: CacheStorageType = {
  set: (key, data) => localStorage.setItem(PREFIX + key, JSON.stringify(data)),
  get: (key) => {
    const value = localStorage.getItem(PREFIX + key);
    return value ? JSON.parse(value) : undefined;
  },
  keys: persistedKeys,
  delete: (key) => localStorage.removeItem(PREFIX + key),
  clear: () => persistedKeys().forEach((key) => localStorage.removeItem(PREFIX + key)),
};

export const client = createClient({
  url: "https://dummyjson.com",
  // Bump `version` when the shape of the cached data changes: entries saved by another version are dropped.
  cache: () => new Cache({ storage: localStorageCache, version: "1" }),
});

export type Recipe = { id: number; name: string; image: string; cuisine: string; difficulty: string };

export const getRecipes = client.createRequest<{
  response: { recipes: Recipe[]; total: number };
  queryParams: { limit: number; skip: number; select: string; delay: number };
}>()({
  endpoint: "/recipes",
  // Data counts as fresh for a minute, so a reload within that time sends no request at all.
  staleTime: Time.MIN,
  // Persisted data is kept for a day. The default of 5 minutes would drop it soon after a reload.
  cacheTime: Time.DAY,
});
