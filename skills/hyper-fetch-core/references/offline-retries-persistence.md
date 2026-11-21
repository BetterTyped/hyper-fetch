# Offline, retries and persistence

## Online state

`client.appManager` tracks `isOnline` and `isFocused`. In browsers it listens to `online`/`offline`, `focus`/`blur` and
`visibilitychange`; the initial online value is `navigator.onLine` (or `true` where unknown, e.g. Node, React Native).
Set your own detection by passing a factory:

```ts
import NetInfo from "@react-native-community/netinfo";
import { AppState } from "react-native";
import { AppManager, createClient } from "@hyper-fetch/core";

export const client = createClient({
  url: "https://api.example.com",
  appManager: () =>
    new AppManager({
      initiallyOnline: () => NetInfo.fetch().then((state) => !!state.isConnected),
      onlineEvent: (setOnline) => NetInfo.addEventListener((state) => setOnline(!!state.isConnected)),
      focusEvent: (setFocused) => {
        const subscription = AppState.addEventListener("change", (status) => setFocused(status === "active"));
        return () => subscription.remove();
      },
    }),
});
```

- `initiallyOnline` / `initiallyFocused`: a boolean, a getter, or an async getter (the state starts `false` and is
  emitted once resolved; a throwing getter falls back to `true`).
- `onlineEvent` / `focusEvent` receive a setter and should return a cleanup function.
- Manual control (tests, custom heartbeat): `client.appManager.setOnline(false)`, `setFocused(true)`.

## Offline behavior

`offline` defaults to `true`.

|                                                  | `offline: true` (default)                           | `offline: false`                               |
| ------------------------------------------------ | --------------------------------------------------- | ---------------------------------------------- |
| Sent while offline                               | kept in the queue, not sent, `send()` stays pending | sent anyway, fails fast with the network error |
| Connection lost during the request and it failed | kept, re-sent when online                           | removed, `send()` resolves with the error      |
| Retries while offline                            | paused until online                                 | not retried                                    |
| On `online` event                                | every dispatcher flushes its queues                 | -                                              |

- A `queued` queue waits behind its first offline item, so later items keep order.
- A response that arrives successfully despite the offline flag is used normally (`details.isOffline` tells you).
- Because `await send()` can wait indefinitely for the network, use `offline: false` for user actions that must give
  immediate feedback, or race it with your own timer and keep the request queued.
- Garbage collection pauses while offline, so cached data stays available.
- Framework hooks also refetch on reconnect/focus; that logic lives in `hyper-fetch-react`.

## Retries

```ts
const getFeed = client
  .createRequest<{ response: Post[] }>()({ endpoint: "/feed", retry: 3, retryTime: Time.SEC })
  .setRetryOnError((response) => response.status === 0 || (response.status ?? 0) >= 500);
```

- `retry` = extra attempts after the first (`retry: 3` means up to 4 calls). `retryTime` is a delay in ms (default 500)
  or a function `({ attempt, response }) => ms` (`attempt` from 0). `exponentialBackoff({ min, max, jitter })` from
  `@hyper-fetch/core` builds one. A throwing function stops retrying; functions are lost in a persisted queue.
- Every failure is retried by default, including 4xx. Use `setRetryOnError` to retry only transient errors; return
  `false` to stop. A throwing callback stops retrying.
- Never retried: aborted/canceled requests, requests removed from the queue, failures while offline (they wait for the
  network instead).
- `send()` resolves once with the final response; `onResponse` fires once; `details.retries` holds the attempt number
  and `details.willRetry` is visible to event listeners on intermediate failures.
- Retries go through interceptors again, so a refreshed token is picked up.
- Mutations: retry only idempotent ones (PUT, DELETE, or POST with an idempotency key header).

## Persisting the cache

See cache-and-garbage-collection for details. Summary:

- `new Cache({ lazyStorage })` with an async store (IndexedDB via `idb-keyval`, AsyncStorage, MMKV wrapped in promises).
  Entries load on demand when read and only if fresh, current `version`, not expired.
- `new Cache({ storage })` replaces the in-memory map with a sync `CacheStorageType` (`get`, `set`, `keys`, `delete`,
  `clear`) storing entry objects.
- Persisted values must be JSON-serializable if your store serializes; `Blob`/`File` data does not survive.
- `await client.cache.clear()` on logout also clears the lazy store.
- Bump `version` when response shapes change.

## Persisting queues (offline-first writes)

```ts
import { MMKV } from "react-native-mmkv";
import { createClient, Dispatcher, type DispatcherStorageType, type QueueDataType } from "@hyper-fetch/core";

const mmkv = new MMKV({ id: "hf-submit-queue" });
const empty = (queryKey: string): QueueDataType => ({ queryKey, requests: [], stopped: false });

const queueStorage: DispatcherStorageType = {
  get: (key) => {
    const value = mmkv.getString(key);
    return value ? JSON.parse(value) : undefined; // requests come back as JSON, the dispatcher rebuilds them
  },
  set: (key, data) => mmkv.set(key, JSON.stringify(data)),
  keys: () => mmkv.getAllKeys(),
  entries: () =>
    mmkv
      .getAllKeys()
      .map((key): [string, QueueDataType] => {
        const value = mmkv.getString(key);
        return [key, value ? JSON.parse(value) : empty(key)];
      })
      [Symbol.iterator](),
  delete: (key) => mmkv.delete(key),
  clear: () => mmkv.clearAll(),
};

export const client = createClient({
  url: "https://api.example.com",
  submitDispatcher: () => new Dispatcher({ storage: queueStorage }),
});
```

- Queue items are stored as `request.toJSON()` when serialized and rebuilt into `Request` instances on read, but
  functions are lost: mappers, mocks, `retryOnError`, optimistic callbacks and `$hooks` do not survive a restart. Keep
  persisted requests free of required runtime callbacks, or re-attach behavior through interceptors.
- After a restart the queued items are sent by `dispatcher.flush()` (called automatically on the `online` event); call
  `client.submitDispatcher.flush()` at startup to resume immediately. Their original `send()` callers are gone, so
  observe results with `client.requestManager.events.onResponse` or a `Plugin`.
- Use a dedicated store per dispatcher. Persistent queues are not safe across several browser tabs (each tab would
  replay the same items); use them in single-instance runtimes (React Native, Electron main window).
- `client.fromJSON(json)` rebuilds a request manually, e.g. for your own outbox implementation.
