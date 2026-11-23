# Events and managers

Every listener method returns an unsubscribe function. Call it when the consumer goes away; emitters allow 1000
listeners before Node warns, which usually signals a leak.

## RequestManager (`client.requestManager`)

Lifecycle events of requests sent with `send()` (and adapter-level events of `exec()`), plus abort controllers.

| Event                                     | Variants                                                    | Data                                                        |
| ----------------------------------------- | ----------------------------------------------------------- | ----------------------------------------------------------- |
| `onLoading`                               | `ByQueue(queryKey)`, `ByCache(cacheKey)`, `ById(requestId)` | `{ request, requestId, loading, isRetry, isOffline }`       |
| `onRequestStart`                          | `ByQueue`, `ById`                                           | `{ request, requestId }`                                    |
| `onResponseStart`                         | `ByQueue`, `ById`                                           | `{ request, requestId }`                                    |
| `onUploadProgress` / `onDownloadProgress` | `ByQueue`, `ById`                                           | progress + `{ request, requestId }`                         |
| `onResponse`                              | `ByCache`, `ById`                                           | `{ request, requestId, response, details }` (every attempt) |
| `onRetry`                                 | `ByQueue`, `ById`                                           | `onResponse` data + `{ retry, delay }` (scheduled retries)  |
| `onAbort`                                 | `ByKey(abortKey)`, `ById`                                   | `{ request, requestId }`                                    |
| `onRemove`                                | `ByQueue`, `ById`                                           | `{ request, requestId, resolved }`                          |
| `onDeduplicated`                          | `ByQueue`, `ByCache`, `ById`                                | `{ request, requestId, deduplicatedRequest }`               |

`onRetry` fires after the `onResponse` of a failed attempt that schedules a retry: `retry` counts the retries from 1
(up to `request.retry`) and `delay` is the wait in milliseconds before the next attempt. It does not fire for aborted,
offline or last attempts.

```ts
// Global error reporting without touching every call site
const unmount = client.requestManager.events.onResponse(({ request, response, details }) => {
  if (!response.success && !details.isCanceled && !details.willRetry) {
    reportError(request.requestOptions.endpoint, response.status, response.error);
  }
});

// Global "is anything loading" indicator
let inFlight = 0;
client.requestManager.events.onLoading(({ loading }) => {
  inFlight += loading ? 1 : -1;
  setBusy(inFlight > 0);
});
```

`ByQueue`/`ByCache`/`ByKey` variants are keyed by the request's own (unscoped) `queryKey`, `cacheKey`, `abortKey`.
Aborting: `abortByKey(abortKey)`, `abortByRequestId(abortKey, requestId)`, `abortAll()`; pass scoped keys
(`scopeKey(key, scope)`) for scoped requests.

## Cache events (`client.cache.events`)

`onData(cb)` / `onDataByKey(cacheKey, cb)` - an entry was set or a response emitted (also for `cache: false` and failed
responses, which carry the previous data), `onInvalidate` / `onInvalidateByKey`, `onDelete` / `onDeleteByKey`. By-key
listeners use the request `cacheKey`; for scoped requests the callback receives the scoped storage key, which tells
scopes apart.

## Dispatcher events (`client.fetchDispatcher.events`, `client.submitDispatcher.events`)

`onQueueChange(ByKey)`, `onQueueStatusChange(ByKey)`, `onDrained(ByKey)`, `onRunningRequestsChange(ByKey)`.

## AppManager (`client.appManager`)

State: `isOnline`, `isFocused`, `isBrowser`. Events: `onFocus`, `onBlur`, `onOnline`, `onOffline`. Setters:
`setOnline(bool)`, `setFocused(bool)`. Core uses `online` to flush queues and resume garbage collection; framework
bindings use `focus`/`online` for refetching. Configure detection for non-browser runtimes with
`new AppManager({ initiallyOnline, initiallyFocused, onlineEvent, focusEvent })` (see offline-retries-persistence).

```ts
// Refetch stale data when the tab regains focus, in plain TS
client.appManager.events.onFocus(() => {
  client.cache.invalidate(/^GET_\/notifications/);
});
```

## Logger

Silent by default. `client.setDebug(true)` turns logs on, `client.setLogLevel("debug" | "info" | "warning" | "error")`
sets the minimum severity (default `"warning"`), `client.loggerManager.setModules(["Cache", "Dispatcher"])` filters by
module (`Client`, `Adapter`, `Cache`, `Dispatcher`, ...). Replace the output:

```ts
import { LoggerManager } from "@hyper-fetch/core";

client.setDebug(process.env.NODE_ENV !== "production").setLogger(
  () =>
    new LoggerManager({
      level: "info",
      logger: ({ level, module, title, extra }) => console.log(`[${module}] ${level}: ${title}`, extra),
    }),
);
```

## Building your own binding

Framework bindings combine these pieces; a minimal store for one request:

```ts
import { scopeKey, type RequestInstance, type RequestSendOptionsType } from "@hyper-fetch/core";

type WatchState = { data: unknown; error: unknown; loading: boolean };

export const watchRequest = <R extends RequestInstance>(request: R, onChange: (state: WatchState) => void) => {
  const { client, cacheKey, queryKey, scope } = request;
  const state: WatchState = { data: request.read()?.data ?? null, error: null, loading: false };
  const emit = () => onChange({ ...state });

  const refetch = () => {
    void request.send({} as RequestSendOptionsType<R>); // generic code: see type-safety
  };

  const unmounts = [
    client.cache.events.onDataByKey(cacheKey, (entry) => {
      if (scopeKey(cacheKey, scope) !== scopeKey(entry.cacheKey, entry.scope)) return;
      state.data = entry.data;
      state.error = entry.error;
      emit();
    }),
    client.requestManager.events.onLoadingByQueue(queryKey, ({ loading }) => {
      state.loading = loading;
      emit();
    }),
    client.cache.events.onInvalidateByKey(cacheKey, refetch),
  ];

  emit();
  refetch();
  return () => unmounts.forEach((unmount) => unmount());
};
```

Prefer `@hyper-fetch/react` when using React; it adds dependency tracking, stale checks, focus/reconnect refetching, SSR
hydration and `useQueue` / `useCache` / `useAppManager`.
