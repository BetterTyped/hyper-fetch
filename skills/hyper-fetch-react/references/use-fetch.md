# useFetch in depth

`useFetch(request, options?)` subscribes a component to the cache entry of `request` and sends the request through the
client's `fetchDispatcher` when needed. Everything below is verified against `packages/react/src/hooks/use-fetch` and
its specs.

## Options

| Option               | Default      | What it does                                                                                                          |
| -------------------- | ------------ | --------------------------------------------------------------------------------------------------------------------- |
| `disabled`           | `false`      | Never sends (mount, changes, refetch, focus, refresh). Still shows cached data and cache updates. `loading` is false. |
| `dependencies`       | `[]`         | Extra values; a change (by `Object.is`) refetches. Bounced when `bounce` is on.                                       |
| `revalidate`         | `true`       | Refetch on mount and on key / dependency change even when cached data is fresh. Stale data is refetched regardless.   |
| `initialResponse`    | `null`       | Placeholder partial response (`{ data }`, `{ error }`, `{ status }`), used only while the cache is empty. Not cached. |
| `keepPreviousData`   | `"auto"`     | What to show after the cache key changes: `"auto"`, `"preserve"`, `"clean"` (below).                                  |
| `select`             | -            | `(data) => slice`. `data` and `setData` use the selected type. Callbacks and the cache keep the full response.        |
| `structuralSharing`  | `true`       | Keeps references of unchanged parts of the selected value.                                                            |
| `deepCompare`        | `true`       | Deep-compares incoming state values; equal values keep their reference and do not re-render. Accepts a custom fn.     |
| `dependencyTracking` | `true`       | Re-render only for fields the component read. `false` re-renders on every change.                                     |
| `suspense`           | `false`      | Throw a promise until the first response (data, error or empty 204) arrives.                                          |
| `throwOnError`       | `false`      | Throw the settled error to the closest Error Boundary. `(error) => boolean` decides per error.                        |
| `refresh`            | `false`      | Polling. See `refreshing-focus-online.md`.                                                                            |
| `refreshTime`        | `Time.HOUR`  | Polling interval in ms.                                                                                               |
| `refetchBlurred`     | `true`       | Keep polling while the window or app is blurred.                                                                      |
| `refetchOnFocus`     | `false`      | Fetch when the app gains focus.                                                                                       |
| `refetchOnBlur`      | `false`      | Fetch when the app loses focus.                                                                                       |
| `refetchOnReconnect` | `false`      | Fetch when the network comes back.                                                                                    |
| `bounce`             | `false`      | Debounce or throttle fetches caused by key and dependency changes. The first fetch on mount is never bounced.         |
| `bounceType`         | `"debounce"` | `"debounce"` or `"throttle"`.                                                                                         |
| `bounceTime`         | `400`        | Debounce delay or throttle interval, ms.                                                                              |
| `bounceTimeout`      | `400`        | Throttle only: when the trailing call fires.                                                                          |

Options passed as `undefined` (forwarded optional props) fall back to the defaults instead of overriding them.

Caching itself (`staleTime`, `cacheTime`, `cache`, `retry`, `deduplicate`, `cancelable`, `queued`, `offline`) is set on
the request, not the hook: `getUsers.setStaleTime(Time.MIN * 10)`. See the `hyper-fetch-core` skill.

## Returned values

State (tracked): `data`, `error`, `loading`, `status`, `success`, `extra`, `retries`, `responseTimestamp`,
`requestTimestamp`.

Actions (stable identity): `refetch()`, `abort()`, `setData`, `setError`, `setLoading`, `setStatus`, `setSuccess`,
`setExtra`, `setRetries`, `setResponseTimestamp`, `setRequestTimestamp`, `clearState()`, `bounce: { active, reset }`.

Callback registrars: `onSuccess`, `onError`, `onAbort`, `onOfflineError`, `onFinished`, `onRequestStart`,
`onResponseStart`, `onUploadProgress`, `onDownloadProgress`.

- `setX` setters change only this hook's local state (function updaters supported). Other components and the cache are
  untouched. Shared changes go through `client.cache.set(request, response)` / `client.cache.update(request, updater)`.
- `clearState()` resets the local state to empty. Combine with `refetch()` for "reset and reload".
- `refetch()` always sends a fresh request (it is never deduplicated into an older in-flight one) and restarts the
  `refresh` countdown. It does nothing while `disabled`.
- `abort()` cancels running requests sharing the request's `abortKey`, including ones started by other components.

## When does it send?

| Situation                                           | `revalidate: true` (default)      | `revalidate: false`                 |
| --------------------------------------------------- | --------------------------------- | ----------------------------------- |
| Mount, no cache                                     | Fetch                             | Fetch                               |
| Mount, fresh cache                                  | Show cache, fetch in background   | Show cache, no request              |
| Mount, stale or invalidated cache                   | Show cache, fetch                 | Show cache, fetch                   |
| Mount while the same cache key is already in flight | Join it, no new request           | Join it                             |
| Request changes (params, query params, payload)     | Fetch the new key (bounced if on) | Fetch only if new key missing/stale |
| `dependencies` change                               | Fetch (bounced if on)             | Fetch only if missing/stale         |
| Re-render with an equal request clone               | Nothing                           | Nothing                             |
| `disabled` true -> false                            | Fetch                             | Fetch if missing/stale              |
| `client.cache.invalidate(request)` while mounted    | Fetch                             | Fetch                               |
| `client.cache.delete(cacheKey)` while mounted       | Keep data visible, fetch          | Keep data visible, fetch            |
| Invalidated while no hook was mounted               | Fetch on next mount               | Fetch on next mount                 |
| Unmount during a request                            | Request finishes, response cached | Same                                |

The hook compares the serialized request (`request.toJSON()`), so building `getUser.setParams({ userId })` in render is
correct and cheap. StrictMode double mounting and a revealed `<Activity>` do not send extra requests.

`loading` starts `true` on the first render when a fetch will happen or one is already running for that queue, so there
is no `{ data: null, loading: false }` flash. It is `false` when disabled, when the queue is stopped, or when cached
data is shown with `revalidate: false`.

## Cache sharing between components

- Every `useFetch` on the same request (same `cacheKey`, same `scope`) reads the same cache entry. Mounting N of them
  sends one request; all render the response. A component mounted later renders the cached data immediately.
- Responses of `request.send()` called outside React (prefetch, effects, other hooks) update every mounted hook.
- `client.cache.set` / `client.cache.update` update every hook of that key without a request.
- With `deduplicate: true` on the request, identical sends within `deduplicateTime` share one network call too (useful
  when requests are sent outside of mount, e.g. focus events across many hooks).
- `request.setScope(id)` isolates the cache entry; hooks of another scope with the same key never see it.
- The default cache key is method + endpoint (with params) + query params. With the HTTP adapter the payload is not part
  of it: a payload change refetches but writes to the same entry. For payload-driven reads give each variant its own key
  with `setCacheKey`.

## Dependent requests

```tsx
function Projects({ orgSlug }: { orgSlug: string | null }) {
  const { data: org } = useFetch(getOrg.setParams({ orgSlug: orgSlug ?? "" }), { disabled: !orgSlug });
  const { data: projects } = useFetch(getProjects.setParams({ orgId: org?.id ?? 0 }), { disabled: !org });
  return <ProjectList projects={projects ?? []} />;
}
```

The placeholder param keeps the request typed; nothing is sent while disabled. Alternatively render the dependent part
in a child component only when the parent data exists.

## keepPreviousData

Applies when the cache key changes and the new key has no cached data yet.

| Mode               | URL params change (other resource) | Only query params change (page, filter) |
| ------------------ | ---------------------------------- | --------------------------------------- |
| `"auto"` (default) | Clear to empty + loading           | Keep previous data while loading        |
| `"preserve"`       | Keep previous data                 | Keep previous data                      |
| `"clean"`          | Clear                              | Clear                                   |

When the new key is already cached, its data is shown on the same render. Late responses of the previous key are ignored
(and still cached under their own key). Data set with `setData` is dropped on a key change.

## Callbacks

```tsx
const { onSuccess, onError, onFinished, onRequestStart } = useFetch(getUsers);

onRequestStart(({ requestId }) => log("start", requestId));
onSuccess(({ response, request, details }) => track("users", response.data.length, details.retries));
onError(({ response, details }) => {
  if (!details.willRetry && !details.isCanceled) report(response.error);
});
onFinished(({ response }) => setLastSync(response.responseTimestamp));
```

- Parameter: `{ response, request, requestId, details, mutationContext }`. `response` is the mapped response (after
  `setResponseMapper`), the same one the hook state shows. `details` has `retries`, `isCanceled`, `isOffline`,
  `willRetry` and timestamps.
- Order per response: one of `onSuccess` / `onError` / `onAbort` / `onOfflineError` (offline errors of requests with
  `offline: true`), then `onFinished`.
- Each failed attempt of a retried request calls `onError` with `details.willRetry: true` until the last one.
- Register by calling the registrar in render. Calling it again replaces the previous callback, so the latest closure is
  always used. Do not register inside `useEffect` with an empty dependency list; you would keep a stale closure.
- Callbacks run for responses of the current key only, also for requests sent by other components on that key. After
  unmount, nothing is called.
- Progress callbacks receive `{ progress, timeLeft, sizeLeft, total, loaded, startTimestamp, request, requestId }`.
  `progress` is 0-100; `timeLeft` is computed in milliseconds and can be `null`.

## Suspense and error boundaries

```tsx
function Users() {
  const { data } = useFetch(getUsers, { suspense: true, throwOnError: true });
  return <UsersTable users={data ?? []} />;
}

<ErrorBoundary fallbackRender={({ resetErrorBoundary }) => <Retry onClick={resetErrorBoundary} />}>
  <Suspense fallback={<Spinner />}>
    <Users />
  </Suspense>
</ErrorBoundary>;
```

- Suspends until the first response. Cached or hydrated data never suspends; a refetch after the first response does not
  re-suspend; a new cache key does.
- Without `throwOnError`, an error response is rendered (it does not reach the boundary).
- `throwOnError` throws only settled errors: attempts that will retry, canceled and offline-queued requests do not
  throw. Errors are not cached, so resetting the boundary remounts and refetches.
- A `select` function that throws goes to the closest Error Boundary.
- Disabled hooks never suspend. On the server, a suspending hook without data renders the fallback (no request is sent
  during server rendering).

## select and structural sharing

```tsx
const usePrice = (symbol: string) => useFetch(getQuotes, { select: (quotes) => quotes[symbol]?.price });
```

- Runs only when there is data (`data` stays `null` otherwise).
- Inline selectors are fine. When the selector changes (new closure over a prop), it re-runs on the current data
  immediately.
- Many hooks selecting different slices share one request and one cache entry; each re-renders only when its slice
  changes.
- Request-level `setStructuralSharing(false)` disables sharing of cached responses; hook-level
  `structuralSharing: false` disables it for the selected value.

## Typed custom hooks

```tsx
import type { ExtractResponseType } from "@hyper-fetch/core";
import { useFetch } from "@hyper-fetch/react";

export type UserResponse = ExtractResponseType<typeof getUser>;

export const useUser = (userId: number | null) =>
  useFetch(getUser.setParams({ userId: userId ?? 0 }), { disabled: userId === null });
```

Keep wrappers thin: return the hook result as is so dependency tracking and stable actions keep working. Requests from
`createSdk` (for example `sdk.users.$userId.$get.setParams({ userId })`) are ordinary requests and work with every hook.

Docs: https://hyperfetch.bettertyped.com/docs/react/hooks/use-fetch,
https://hyperfetch.bettertyped.com/docs/guides/react/basics/fetching,
https://hyperfetch.bettertyped.com/docs/guides/react/basics/dependent-requests
