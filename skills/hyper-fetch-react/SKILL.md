---
name: hyper-fetch-react
description:
  React hooks for HyperFetch (@hyper-fetch/react) - type-safe data fetching, caching and mutations on top of
  @hyper-fetch/core requests. Use when writing or reviewing React, Next.js, React Native or Electron code that imports
  @hyper-fetch/react or uses useFetch, useSubmit, useInfiniteFetch, useCache, useQueue, useIsFetching, useIsSubmitting,
  useAppManager, useStream, Provider or Hydrate. Covers fetching on mount, refetching on params or dependencies,
  dependent and disabled requests, debounce and throttle (bounce), polling (refresh, refreshTime), refetchOnFocus,
  refetchOnReconnect, stale-while-revalidate, keepPreviousData, select, suspense, throwOnError, submitting forms, cache
  invalidation after a mutation, optimistic updates with rollback, upload progress, queues, pagination and infinite
  scroll, SSR hydration and prefetching in Next.js app and pages router, global loading indicators, type inference,
  typed custom hooks, avoiding re-renders, and testing components that use HyperFetch.
---

# HyperFetch React

`@hyper-fetch/react` binds `@hyper-fetch/core` requests to React. You define a `Client` and `Request`s once (see the
`hyper-fetch-core` skill), then hand a request to a hook. The hooks do not own data: state lives in the client's cache
and dispatchers, so every component using the same request (same `cacheKey`) shares one response, one in-flight call and
one cache entry. Hooks only subscribe, track which fields your component reads, and re-render for those.

- `useFetch` reads: fetches on mount and whenever the request (params, query params, payload) or `dependencies` change.
- `useSubmit` writes: does nothing until you call `submit()`, which resolves with the response.
- `useInfiniteFetch` pages through a list. `useCache`, `useQueue`, `useIsFetching`, `useAppManager`, `useStream` observe
  or control the core. `Hydrate` carries server data into the first render.

## Install and setup

```bash
npm install @hyper-fetch/core @hyper-fetch/react
```

React `>= 18` is required. `@hyper-fetch/sockets` is an optional peer, only for `useListener` / `useEmitter`.

```ts
// api/client.ts - module level, never inside a component
import { Client } from "@hyper-fetch/core";

export const client = new Client({ url: "https://api.example.com" });

// api/users.ts
export type User = { id: number; name: string };

export const getUsers = client.createRequest<{ response: User[]; queryParams: { search?: string; page?: number } }>()({
  endpoint: "/users",
});
export const getUser = client.createRequest<{ response: User }>()({ endpoint: "/users/:userId" });
export const createUser = client.createRequest<{ response: User; payload: { name: string } }>()({
  endpoint: "/users",
  method: "POST",
});
```

```tsx
// Optional - global defaults for the hooks. Hooks work without it.
import { Provider } from "@hyper-fetch/react";

<Provider config={{ useFetchConfig: { refetchOnFocus: true }, useSubmitConfig: { bounce: false } }}>
  <App />
</Provider>;
```

The provider is `Provider` (read it with `useProvider()`); there is no `ConfigProvider` export. Config keys:
`useFetchConfig`, `useInfiniteFetchConfig`, `useSubmitConfig`, `useCacheConfig`, `useQueueConfig`, `useListener`,
`useEmitter`. Hook options override provider config, which overrides the defaults. `select` (and `pagination`) cannot be
set globally.

## Golden rules

1. **Read with `useFetch`, write with `useSubmit`.** `useFetch` sends on mount and on every key change, so a POST in
   `useFetch` fires on render. `useSubmit` sends only on `submit()`.
2. **Create the `Client` and base requests at module level.** The cache, queues and suspense/infinite stores belong to
   the client instance; a client created in render starts empty every time.
3. **Derive requests inline, no `useMemo` needed.** `useFetch(getUser.setParams({ userId }))` is idiomatic. Hooks key on
   the serialized request, so an equal clone on the next render neither refetches nor drops data.
4. **Never pass fresh objects in `dependencies`.** They are compared with `Object.is`; `[{ id }]` or `[filters]` built
   in render refetch on every render. Pass primitives, or put the value on the request (query params, payload).
5. **`send()` and `submit()` never reject.** They resolve with `{ data, error, status, success, extra, ... }`. Branch on
   `response.success` / `error`, do not wrap in try/catch for HTTP errors.
6. **Callbacks receive one object.** `onSuccess(({ response }) => ...)`,
   `onSubmitError(({ response, details }) => ...)`; the error is `response.error`. Register them in the render body; the
   latest render's callback is used.
7. **After a mutation, invalidate the read request, not the mutation.** `client.cache.invalidate(getUsers)` refetches
   every mounted `useFetch(getUsers...)`. `useSubmit().refetch()` only invalidates the mutation's own `cacheKey`.
8. **Use `disabled` for dependent or conditional requests**, never conditional hook calls.
9. **Destructure only what you render.** Fields are tracked per access; spreading or serializing the whole result
   subscribes to every field.
10. **Describe optimistic changes on the request** with `setOptimistic` + `optimistic()` from `@hyper-fetch/core`, and
    write the undo in `.rollback()`. Core applies, rolls back and refreshes; components need nothing special.

## Core patterns

### Fetch, with params and query params

```tsx
import { useFetch } from "@hyper-fetch/react";

function UserCard({ userId }: { userId: number }) {
  const { data, loading, error, refetch } = useFetch(getUser.setParams({ userId }));

  if (error) return <button onClick={refetch}>Retry</button>;
  if (loading && !data) return <Spinner />;
  return <h2>{data?.name}</h2>;
}
```

`data` is `null` until a response or cached value exists. Changing `userId` switches to the other cache key on the same
render; data of the previous user is never shown for the new one (`keepPreviousData: "auto"` clears on URL param
changes, keeps data on query param changes).

### Search with debounce

```tsx
function UserSearch({ search }: { search: string }) {
  // First request is sent right away; later key changes are debounced by 300ms
  const { data, loading } = useFetch(getUsers.setQueryParams({ search }), { bounce: true, bounceTime: 300 });
  return <UsersTable users={data ?? []} dimmed={loading} />;
}
```

Use `bounceType: "throttle"` (plus `bounceTimeout` for the trailing call) to throttle instead.

### Dependent request

```tsx
const { data: user } = useFetch(getCurrentUser);
const { data: posts } = useFetch(getUserPosts.setParams({ userId: user?.id ?? 0 }), { disabled: !user });
```

While disabled nothing is sent and `loading` is `false`. It fetches as soon as `disabled` flips to `false`.

### Callbacks

```tsx
const { data, onSuccess, onError } = useFetch(getUsers);

onSuccess(({ response }) => toast(`Loaded ${response.data.length} users`));
onError(({ response, details }) => {
  if (!details.willRetry) toast(response.error.message);
});
```

`useFetch` callbacks: `onSuccess`, `onError`, `onAbort`, `onOfflineError`, `onFinished`, `onRequestStart`,
`onResponseStart`, `onUploadProgress`, `onDownloadProgress`. They fire for any request on that cache key, including one
sent by another component, and fire for every failed attempt of a retried request (`details.willRetry`).

### Submit a form and refresh the list

```tsx
import { useSubmit } from "@hyper-fetch/react";

function AddUser() {
  const { submit, submitting, error, onSubmitSuccess } = useSubmit(createUser);

  onSubmitSuccess(() => {
    client.cache.invalidate(getUsers); // every mounted useFetch(getUsers...) refetches
  });

  const onSubmit = async (name: string) => {
    const response = await submit({ payload: { name } });
    if (response.success) closeModal();
  };

  return <UserForm onSubmit={onSubmit} disabled={submitting} error={error?.message} />;
}
```

`submit({ payload, params, queryParams, ...sendOptions })` clones the request for that call only. `useSubmit` returns
`submitting` (not `loading`) and `onSubmitSuccess`, `onSubmitError`, `onSubmitFinished`, `onSubmitAbort`,
`onSubmitOfflineError`, `onSubmitRequestStart`, `onSubmitResponseStart`, `onSubmitUploadProgress`,
`onSubmitDownloadProgress`. They fire only for submits of that hook instance.

### Optimistic update

```ts
import { optimistic } from "@hyper-fetch/core";

export const toggleTodo = client
  .createRequest<{ response: Todo; payload: { completed: boolean } }>()({ endpoint: "/todos/:todoId", method: "PATCH" })
  .setOptimistic(({ params, payload }) => [
    optimistic(getTodos)
      .patch(params.todoId, payload)
      .rollback(({ data, previous }) => {
        const before = previous.find((todo) => todo.id === Number(params.todoId));
        return data.map((todo) => (todo.id === Number(params.todoId) && before ? before : todo));
      }),
  ]);

// Component: nothing optimistic-specific
const { submit } = useSubmit(toggleTodo);
submit({ params: { todoId: todo.id }, payload: { completed: !todo.completed } });
```

### Infinite list

```tsx
import { useInfiniteFetch } from "@hyper-fetch/react";

const { items, loading, hasNextPage, isFetchingNextPage, fetchNextPage } = useInfiniteFetch(
  getFeed.setQueryParams({ topic }),
  { pagination: { cursor: "cursor", next: "nextCursor", items: "data" } },
);
```

### SSR (Next.js app router)

```tsx
// api/users.ts - one shared request, so server and client use the same cacheKey
export const getFirstPage = getUsers.setQueryParams({ page: 1 });

// app/users/page.tsx (server component)
export default async function Page() {
  const response = await getFirstPage.send();
  return <UsersList hydration={[getFirstPage.dehydrate({ response })]} />;
}

// app/users/users-list.tsx
("use client");
import { Hydrate, useFetch } from "@hyper-fetch/react";
import type { HydrateProps } from "@hyper-fetch/react";

export const UsersList = ({ hydration }: { hydration: HydrateProps["data"] }) => (
  <Hydrate client={client} data={hydration}>
    <Users />
  </Hydrate>
);

const Users = () => {
  const { data } = useFetch(getFirstPage, { revalidate: false }); // first render already has data
  return <UsersTable users={data ?? []} />;
};
```

The hydrated item is matched by `cacheKey` (method, endpoint, params, query params): the hook must use a request equal
to the one dehydrated on the server.

### Global loading indicator

```tsx
import { useIsFetching, useIsSubmitting } from "@hyper-fetch/react";

const fetching = useIsFetching(client); // running fetch-dispatcher requests
const saving = useIsSubmitting(client, { queryKey: /\/files/ });
```

## Decision guide

| Need                                               | Use                                                                         |
| -------------------------------------------------- | --------------------------------------------------------------------------- |
| Show server data, auto-load                        | `useFetch(request)`                                                         |
| Create / update / delete, or fetch on click        | `useSubmit(request)` + `submit()`                                           |
| Load more / infinite scroll                        | `useInfiniteFetch(request, { pagination })`                                 |
| Classic page buttons                               | `useFetch(request.setQueryParams({ page }))` (old page stays while loading) |
| Read the cache without sending                     | `useCache(request)`                                                         |
| Wait for one request before another                | `disabled: !dependency`                                                     |
| Refetch on a value that is not part of the request | `dependencies: [primitive]`                                                 |
| Show cached data but skip the mount refetch        | `revalidate: false` (fetches only when stale, `staleTime` default 5 min)    |
| Polling                                            | `refresh: true, refreshTime: Time.SEC * 10`                                 |
| Refresh when the user returns or network recovers  | `refetchOnFocus`, `refetchOnReconnect`                                      |
| Only latest of rapid calls hits the server         | `bounce: true` (hook) or `request.setCancelable(true)` (abort previous)     |
| Identical concurrent calls share one network call  | `request.setDeduplicate(true)`                                              |
| Run mutations one at a time, show a queue          | `request.setQueued(true)` + `useQueue`                                      |
| Part of a big response, fewer re-renders           | `select: (data) => data.part`                                               |
| Suspense / error boundaries                        | `suspense: true`, `throwOnError: true`                                      |
| Server-rendered data on first paint                | `request.dehydrate({ response })` + `<Hydrate>`                             |
| Warm the cache on hover                            | `request.send({ cachePolicy: "cache-first" })`                              |
| Spinner for the whole app                          | `useIsFetching(client)` / `useIsSubmitting(client)`                         |
| Online / focus state in UI                         | `useAppManager(client)`                                                     |
| LLM / text / binary stream                         | `useStream(request)`                                                        |

## useFetch defaults (verified in source)

`revalidate: true`, `disabled: false`, `dependencies: []`, `dependencyTracking: true`, `keepPreviousData: "auto"`,
`initialResponse: null`, `refresh: false`, `refreshTime: Time.HOUR`, `refetchBlurred: true`, `refetchOnFocus: false`,
`refetchOnBlur: false`, `refetchOnReconnect: false`, `bounce: false`, `bounceType: "debounce"`, `bounceTime: 400`,
`bounceTimeout: 400`, `deepCompare: true`, `structuralSharing: true`, `suspense: false`, `throwOnError: false`.
Request-level defaults that matter here: `staleTime` and `cacheTime` 5 minutes, `deduplicate: false`, `retry: 0`.

Stale-while-revalidate is the default: cached data renders on the first render and, because `revalidate` is `true`, a
background refetch replaces it. Stale (or invalidated) data is always refetched on mount, even with `revalidate: false`.

## Type safety

Never pass type arguments to the hooks; type the request once and everything is inferred from it.

```tsx
// new Client<ApiError>({ url }) sets the global error type (default: Error)
const getUser = client.createRequest<{ response: User; error: { field: string } }>()({ endpoint: "/users/:userId" });
const renameUser = client.createRequest<{ response: User; payload: { name: string } }>()({
  endpoint: "/users/:userId",
  method: "PATCH",
});

const { data, error, onSuccess } = useFetch(getUser.setParams({ userId }));
// data: User | null, error: { field: string } | Error | null
onSuccess(({ response }) => response.data.name); // response.data is User here, never null

const { submit } = useSubmit(renameUser);
// @ts-expect-error - params and payload are required by the request
submit();
submit({ params: { userId: 1 }, payload: { name: "Ann" } });

// @ts-expect-error - the endpoint param is userId
getUser.setParams({ id: 1 });
```

- `data` is `Response | null`, `error` is `GlobalError | LocalError | null`; callbacks get narrowed success / error
  responses; `mutationContext` is typed from `setOptimistic`'s `context`; `select` changes `data` and `setData`.
- `submit()` / `send()` enforce `params`, `payload` and `queryParams` the request still misses (declared `queryParams`
  are required even if every field is optional). `useFetch` does not check that params are set: always pass
  `getUser.setParams(...)`.
- The awaited `submit()` result is not a discriminated union: narrow on `response.data`, not `response.success`.
- Generic wrappers take `<R extends RequestInstance>(request: R)` and use `ExtractResponseType<R>`,
  `ExtractErrorType<R>`, `UseFetchOptionsType<R>`. A parameter typed plain `RequestInstance` turns `data` into `any`.
- Optimistic helpers, pagination keys (use `satisfies Pagination<typeof request>`) and `initialResponse: { data }` are
  all checked. Do not silence them with casts; see [references/type-safety.md](references/type-safety.md).

## Performance

- Only fields your component reads trigger re-renders (`data`, `error`, `loading`, `status`, `success`, `extra`,
  `retries`, `responseTimestamp`, `requestTimestamp`; `submitting` for `useSubmit`). Equal incoming values (deep
  compare) never re-render.
- Returned actions (`refetch`, `submit`, `abort`, `setData`, callback registrars) have stable identities; use them in
  dependency arrays freely.
- Structural sharing keeps `data` references when a refetch returns equal data, so `useEffect([data])` and `React.memo`
  only react to real changes.
- N components with the same request send one request on mount and share the response.
- Use `select` so each component re-renders only for its slice of a shared response.
- Details, measurements and anti-patterns: [references/performance.md](references/performance.md).

## Pitfalls

| Wrong                                                        | Right                                                                                              |
| ------------------------------------------------------------ | -------------------------------------------------------------------------------------------------- |
| `useFetch(createUser)` for a POST                            | `useSubmit(createUser)`                                                                            |
| `dependencies: [filters]` with an object built in render     | `getUsers.setQueryParams(filters)` or `dependencies: [filters.status]`                             |
| `onError(({ error }) => ...)`                                | `onError(({ response }) => response.error)`                                                        |
| `try { await submit() } catch {}` for HTTP errors            | `const res = await submit(); if (!res.success) ...`                                                |
| `useSubmit(update).refetch()` to refresh a list              | `client.cache.invalidate(getList)` or `invalidate` in `setOptimistic`                              |
| `client.cache.invalidate()` with no argument                 | It invalidates everything; pass the request, a key, a RegExp or an array                           |
| Expecting `dependencies` to refetch with `revalidate: false` | With `revalidate: false`, changes refetch only missing or stale data                               |
| `refetch()` while `disabled: true`                           | Disabled hooks never send; enable first                                                            |
| `setData(...)` expecting other components to update          | `setData` is local to the hook; use `client.cache.update(request, ...)` or `cache.set`             |
| `initialResponse: users`                                     | `initialResponse: { data: users }` (a partial response, never written to the cache)                |
| Expecting one `onError` per submit with `retry: 3`           | Callbacks fire per failed attempt; check `details.willRetry`; the `submit()` promise resolves once |
| `const state = useFetch(r); <Child {...state} />`            | Pass only the fields the child needs                                                               |
| `useQueue(getFile)` for a GET sent through `useSubmit`       | `useQueue(getFile, { dispatcherType: "submit" })`                                                  |
| Relying on prefetched or hydrated data to skip the network   | Default `revalidate: true` still refetches in the background; set `revalidate: false`              |

## Sockets

`useListener` and `useEmitter` are exported from `@hyper-fetch/react` but belong to realtime work with
`@hyper-fetch/sockets`. Use the `hyper-fetch-sockets` skill for them.

## Testing

Test components with React Testing Library and mock the transport, not the hooks: per-request `request.setMock()`, or
MSW handlers when the real adapter should run. Clear shared state between tests with `client.clear()`, because the
client and its cache are module singletons. Await rendered output (`findBy*`, `waitFor`) instead of fixed sleeps. See
the `hyper-fetch-testing` skill.

## References

- [references/use-fetch.md](references/use-fetch.md) - read when using any `useFetch` option, lifecycle rule, callback,
  suspense, error boundary, `select` or `keepPreviousData`.
- [references/use-submit-and-mutations.md](references/use-submit-and-mutations.md) - read for forms, `submit()` results,
  bounce, cancelable / queued / deduplicated mutations and cache invalidation after writes.
- [references/optimistic-updates.md](references/optimistic-updates.md) - read for `setOptimistic`, `optimistic()`
  helpers, rollback, commit, `mutationContext` and concurrent mutations.
- [references/pagination-infinite.md](references/pagination-infinite.md) - read for page buttons, `useInfiniteFetch`,
  cursors, offsets and infinite scroll.
- [references/ssr-hydration-prefetching.md](references/ssr-hydration-prefetching.md) - read for Next.js (app or pages
  router), `Hydrate`, `dehydrate`, server mode, scopes and prefetching on hover or route change.
- [references/refreshing-focus-online.md](references/refreshing-focus-online.md) - read for polling, focus / blur,
  reconnect, offline requests and React Native or Electron `AppManager` setup.
- [references/type-safety.md](references/type-safety.md) - read when typing requests, custom hooks, generic components,
  submit arguments, optimistic callbacks, pagination or hydration props, or when fighting a type error.
- [references/performance.md](references/performance.md) - read when optimizing re-renders or request counts.
- [references/other-hooks.md](references/other-hooks.md) - read for `useCache`, `useQueue`, `useIsFetching`,
  `useIsSubmitting`, `useAppManager`, `useStream`, `Provider` / `useProvider`.

Docs: https://hyperfetch.bettertyped.com/docs/react/overview,
https://hyperfetch.bettertyped.com/docs/react/hooks/use-fetch,
https://hyperfetch.bettertyped.com/docs/react/hooks/use-submit,
https://hyperfetch.bettertyped.com/docs/react/hooks/use-infinite-fetch,
https://hyperfetch.bettertyped.com/docs/react/hydrate,
https://hyperfetch.bettertyped.com/docs/guides/react/basics/optimistic-approach
