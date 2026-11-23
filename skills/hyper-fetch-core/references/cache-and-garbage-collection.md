# Cache and garbage collection

## Keys

| Key         | Default                                                                             | Used for                                    |
| ----------- | ----------------------------------------------------------------------------------- | ------------------------------------------- |
| `cacheKey`  | `${method}_${endpoint with params}_${serialized queryParams}`, e.g. `GET_/users/1_` | cache entry, data/invalidate/delete events  |
| `queryKey`  | same as `cacheKey`                                                                  | dispatcher queue: dedup, cancelable, queued |
| `abortKey`  | `${method}_${endpoint template}_${cancelable}`, e.g. `GET_/users/:userId_false`     | `request.abort()` groups                    |
| `requestId` | random per `send()`                                                                 | lifecycle events, `dispatcher.delete`       |

- Query param objects are serialized with `JSON.stringify` (string query params as they are), so property order matters.
- The base `url` is not part of any key; after `client.setUrl(newUrl)` pass `{ invalidate: true }` to refresh data.
- With `setScope(id)` every key is stored as `${id}__${key}` (`scopeKey(key, scope)` is exported).
- Override per request: `cacheKey`/`queryKey`/`abortKey` options or `setCacheKey`/`setQueryKey`/`setAbortKey` (sticky
  across clones). Override globally: `client.setCacheKeyMapper`, `setQueryKeyMapper`, `setAbortKeyMapper`,
  `setRequestIdMapper`; the mapper must return a string for every request:

```ts
import { getRequestKey } from "@hyper-fetch/core";

// Separate cache entries per tenant without touching every request
client.setCacheKeyMapper((request) => `${tenant.id}:${getRequestKey(request)}`);
```

Key mappers run when a request is created or cloned, so later tenant switches only affect requests created after them;
`setScope` is usually the better tool for per-user or per-tenant isolation.

`getRequestKey` and `getSimpleKey` (the default abort key generator) are exported for exactly this fallback.

## What gets cached

- `send()` writes every final response through the dispatcher; `exec()` never does.
- Only `success: true` responses are stored. A failed refetch is emitted to listeners with the **previous** `data` plus
  the new `error`, and the stored entry stays as it was.
- `cache: false` requests are never stored, but their responses are still emitted as cache data events (hooks still
  receive them).
- A response from a request sent **before** the currently cached one (out-of-order arrival) is not written.
- While an optimistic mutation on the key is pending, fetch responses for that key are not written; the key is refreshed
  after the mutation settles.
- `structuralSharing` (default `true`): unchanged parts of the new data keep the previous object references, an equal
  response keeps the same `data` reference.
- Response interceptors run before the write (they shape the stored data); response mappers do not.

Entry shape (`CacheValueType`): response fields (`data`, `error`, `status`, `success`, `extra`, timestamps), details
(`retries`, `isCanceled`, `isOffline`, `willRetry`, `addedTimestamp`, `triggerTimestamp`), plus `cacheKey`, `scope`,
`staleTime`, `cacheTime`, `version`, `cached`, `hydrated?`.

## staleTime, cacheTime and garbage collection

- **Fresh** while `Date.now() <= entry.responseTimestamp + entry.staleTime`. Freshness is a signal for consumers (hooks
  refetch stale data on mount, focus, reconnect); core never refetches by itself.
- **Garbage collection**: each stored entry gets a timer for `cacheTime` measured from `responseTimestamp`. When it
  fires the entry is deleted (sync and lazy storage) and a delete event is emitted.
- GC only deletes while the app is online; offline, entries outlive `cacheTime` and are rescheduled when the network
  returns, so offline users keep their data.
- `cacheTime: Infinity` (or `null` after a JSON round trip) disables GC for the entry. Very long times are scheduled in
  safe chunks.
- Keep `staleTime <= cacheTime`; data that is GC-ed earlier than it goes stale just disappears.
- Typical tuning: reference data `staleTime: Time.HOUR, cacheTime: Time.DAY`; live dashboards `staleTime: 0`; user
  specific data short `cacheTime` to limit memory.

## Reading

```ts
const entry = getUser.setParams({ userId: 1 }).read(); // ResponseType | undefined, raw (unmapped)

const request = getUser.setParams({ userId: 1 });
const raw = client.cache.get<User, ApiError>(scopeKey(request.cacheKey, request.scope)); // full CacheValueType
const isFresh = !!raw && Date.now() <= raw.responseTimestamp + raw.staleTime;
```

`cache.get(storageKey)` also starts loading the key from `lazyStorage` in the background. Entries written by another
cache `version` are never returned.

## SWR in core

`send({ cachePolicy })` gives the building blocks; neither policy looks at `staleTime`:

- `"cache-first"` - resolves with the cached entry (fresh or stale) if any, otherwise goes to the network.
- `"revalidate"` - resolves with the cached entry immediately and refreshes it in the background (the cache and its
  listeners get the new data); without an entry it awaits the network.

Freshness-aware stale-while-revalidate:

```ts
import { scopeKey, type RequestInstance, type RequestSendOptionsType } from "@hyper-fetch/core";

export const sendSwr = <T extends RequestInstance>(request: T, options = {} as RequestSendOptionsType<T>) => {
  const entry = request.client.cache.get(scopeKey(request.cacheKey, request.scope));
  const isFresh = !!entry && Date.now() <= entry.responseTimestamp + entry.staleTime;
  return request.send({ ...options, cachePolicy: isFresh ? "cache-first" : "revalidate" });
};
```

To react to updates (background refresh, invalidation, other requests on the same key) subscribe to cache events:

```ts
const unmount = client.cache.events.onDataByKey<User[], ApiError, typeof client.adapter>(getUsers.cacheKey, (entry) =>
  render(entry.data),
);
const unmountInvalidate = client.cache.events.onInvalidateByKey(getUsers.cacheKey, () => getUsers.send());
```

This is what `hyper-fetch-react` hooks do for you.

## Invalidation

```ts
client.cache.invalidate(getUsers); // a request: uses its cacheKey and scope
client.cache.invalidate("GET_/users_"); // an exact storage key
client.cache.invalidate(/^GET_\/users/); // RegExp tested against storage keys (g/y flags are ignored)
client.cache.invalidate([getUsers, getUser.setParams({ userId: 1 }), /^GET_\/posts/]);
client.cache.invalidate(); // everything
```

Invalidation sets the stored entry's `staleTime` to `0` and emits an invalidation event. It does **not** delete data or
send requests; subscribed consumers (hooks, your listeners) refetch. Scoped entries are stored as `scope__key`, so use
the request form or a RegExp without `^` for them. Invalidate narrowly: every match triggers its subscribers.

## Writing and deleting

```ts
// Patch an existing entry (no-op when there is no entry yet)
client.cache.update(getUsers, (previous) => ({ data: previous?.data ? [...previous.data, newUser] : null }));

// Remove one entry from memory and lazy storage, emits a delete event
client.cache.delete(scopeKey(getUsers.cacheKey, getUsers.scope));

// Remove everything (memory, lazy storage, GC timers); async because of lazy storage
await client.cache.clear();
```

`cache.set(request, response)` requires a full response plus details (`retries`, `isCanceled`, `isOffline`, `willRetry`,
`addedTimestamp`, `triggerTimestamp`); for seeding prefer `client.hydrate`, for mutations prefer `setOptimistic` (see
optimistic-updates) which handles rollback and refresh.

## Server mode and scopes

`createClient({ url, mode })`: `"auto"` (default) resolves to `"client"` in a browser (`window` and `document` exist),
in React Native (`navigator.product === "ReactNative"`) and in any Electron process (`process.versions.electron`), and
to `"server"` elsewhere (Node.js, Deno, Bun, edge). In `"server"` mode a response is cached only when the request has a
scope, which prevents sharing one user's data with another request on the same server process:

```ts
await getProfile.setScope(sessionId).send(); // cached under `${sessionId}__GET_/me_`
await getPublicConfig.setScope("public").send(); // deliberately shared
```

Prefer one client per server request when you need isolation of interceptors and queues as well.

## SSR hydration

```ts
// server
const response = await getUsers.exec();
const dehydrated = [getUsers.dehydrate({ response })]; // HydrateDataType[], JSON-serializable

// browser
client.hydrate(dehydrated); // writes the entries, marks them `hydrated: true`
client.hydrate(dehydrated, { override: false }); // keep existing entries
```

`dehydrate()` without `response` reads the cache (returns `undefined` when empty). `hydrate` options: `override`
(default `true`), `cache` (default `true`), plus any of `cacheKey`, `cacheTime`, `staleTime`, `scope`, or a function
`(item) => options`. `fetchInfinite(request, { pagination, pages })` fetches several pages with `exec()` and returns
`dehydrated` for infinite lists. In React use the `Hydrate` component from `hyper-fetch-react`.

## Persistence and versioning

```ts
import { Cache, type CacheAsyncStorageType } from "@hyper-fetch/core";
import { del, get, keys, set } from "idb-keyval";

const lazyStorage: CacheAsyncStorageType = {
  get: (key) => get(key),
  set: (key, value) => set(key, value),
  keys: () => keys() as Promise<string[]>,
  delete: (key) => del(key),
};

export const client = createClient({
  url: "https://api.example.com",
  cache: () => new Cache({ lazyStorage, version: "3" }),
});
```

- `lazyStorage` (async: IndexedDB, AsyncStorage) mirrors every write and delete; entries are loaded on demand when a key
  is read. A persisted entry is loaded only if it has the current `version`, is newer than the in-memory one, is not
  stale (`staleTime`) and is not past `cacheTime` (checked while online); outdated entries are removed when met. Give
  persisted resources a long `staleTime` if they should survive restarts.
- `storage` (sync) replaces the in-memory `Map`. It must implement `CacheStorageType` (`get`, `set`, `keys`, `delete`,
  `clear`) and store entry objects; `localStorage` itself does not fit. JSON-backed implementations work (Infinity
  becomes `null`, which is handled), but every write serializes the entry.
- `version` (default `"0.0.1"`): bump it when response shapes change; entries of other versions are ignored and deleted.
- Lazy storage failures are logged and never break requests.
- There is no cross-tab synchronization.

## Memory checklist

- Bound user-specific and paginated data with a finite `cacheTime`.
- Avoid unbounded key spaces (free-text search keys, timestamps in query params) or give them `cache: false` or a short
  `cacheTime`.
- `client.cache.keys()` lists sync keys, `getAllKeys()` includes lazy ones; useful for debugging growth.
- `client.clear()` resets cache, queues, abort controllers and optimistic state, and re-creates the modules.
