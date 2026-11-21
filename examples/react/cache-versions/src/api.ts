import { Cache, type CacheStorageType, type CacheValueType, createClient, Time } from "@hyper-fetch/core";

const PREFIX = "hyper-fetch-cache:";

/** The two settings below stand in for a deploy. A real app would read the version from its build. */
export const release = Number(localStorage.getItem("demo-release") ?? "1");
export const bumpWithRelease = localStorage.getItem("demo-bump") !== "false";

export const setDemo = (nextRelease: number, bump: boolean) => {
  localStorage.setItem("demo-release", String(nextRelease));
  localStorage.setItem("demo-bump", String(bump));
  window.location.reload();
};

// Release 2 changes the shape of the cached user, so it needs a new cache version.
export const cacheVersion = bumpWithRelease ? `release-${release}` : "release-1";

const persistedKeys = () =>
  Object.keys(localStorage)
    .filter((key) => key.startsWith(PREFIX))
    .map((key) => key.slice(PREFIX.length));

const read = (key: string): CacheValueType | undefined => {
  const value = localStorage.getItem(PREFIX + key);
  return value ? JSON.parse(value) : undefined;
};

const localStorageCache: CacheStorageType = {
  set: (key, data) => localStorage.setItem(PREFIX + key, JSON.stringify(data)),
  get: read,
  keys: persistedKeys,
  delete: (key) => localStorage.removeItem(PREFIX + key),
  clear: () => persistedKeys().forEach((key) => localStorage.removeItem(PREFIX + key)),
};

/** What is in localStorage right now, with the version each entry was saved under. */
export const readPersisted = () => persistedKeys().map((key) => ({ key, version: read(key)?.version }));

export const client = createClient({
  url: "https://dummyjson.com",
  // Entries saved under another version are never returned, and are deleted when they are read.
  cache: () => new Cache({ storage: localStorageCache, version: cacheVersion }),
});

export type User = { id: number; firstName: string; lastName: string; email: string; image: string };

export const getUser = client
  .createRequest<{ response: User; queryParams: { select: string } }>()({
    endpoint: "/users/1",
    // One cache entry for both releases, as when an API starts returning more fields under the same URL.
    cacheKey: "current-user",
    staleTime: Time.DAY,
    cacheTime: Time.DAY,
  })
  .setQueryParams({ select: release === 1 ? "firstName,lastName" : "firstName,lastName,email,image" });
