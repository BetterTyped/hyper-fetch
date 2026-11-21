---
name: hyper-fetch-core
description:
  Type-safe data fetching with @hyper-fetch/core, the framework-agnostic base of HyperFetch. Use when code imports
  @hyper-fetch/core or uses createClient, client.createRequest<{ response, payload, queryParams, error }>()({ endpoint,
  method }), send(), exec(), setParams, setQueryParams, setPayload, createSdk, RequestModel, $configure, onAuth,
  onRequest, onError, setRequestDefaults, setResponseMapper, setOptimistic, optimistic(), cache.invalidate, cachePolicy,
  staleTime, cacheTime, deduplicate, cancelable, abort, queued, offline, retry, retryOnError, lazyStorage, Plugin or a
  custom Adapter. Covers type safety and generics (params, payload, error typing, ExtractResponseType, RequestInstance),
  client setup, auth and token refresh, response validation, caching and invalidation, SWR revalidation, deduplication,
  cancellation, queues, offline mode, retries, persistence and performance. Start here for any HyperFetch task, then
  load hyper-fetch-react or an adapter skill.
---

# HyperFetch core

`@hyper-fetch/core` is the transport-agnostic engine. A **Client** holds the base `url`, the **Adapter** (fetch-based
HTTP by default), the **Cache**, two **Dispatchers** (`fetchDispatcher` for GET/QUERY, `submitDispatcher` for everything
else) and the managers (`appManager` for focus/online, `requestManager` for lifecycle events and aborting,
`loggerManager`). A **Request** is an immutable, serializable description of one endpoint call, created from the client.
`send()` routes it through a dispatcher (deduplication, cancelation, queueing, offline, retries), the adapter and the
cache, and always **resolves** with a **Response** object. Framework bindings (`@hyper-fetch/react`) and adapters
(`@hyper-fetch/axios`, `@hyper-fetch/graphql`, ...) build on these same objects, so everything here applies to them.

Sibling skills: `hyper-fetch-react` (hooks: useFetch, useSubmit, useCache, Hydrate), `hyper-fetch-sockets` (realtime),
`hyper-fetch-cli` (SDK generated from OpenAPI), `hyper-fetch-axios`, `hyper-fetch-graphql`, `hyper-fetch-firebase`,
`hyper-fetch-firebase-admin`, `hyper-fetch-trpc`, `hyper-fetch-orpc`, `hyper-fetch-hono`, `hyper-fetch-elysia`,
`hyper-fetch-devtools`, `hyper-fetch-eslint`, `hyper-fetch-oxlint`.

## Install and set up

```bash
npm install @hyper-fetch/core
```

```ts
// api/client.ts - one client per backend, created once and exported
import { createClient } from "@hyper-fetch/core";

type ApiError = { message: string; code: string };

// Include Error: timeouts, aborts and network failures arrive as Error instances
export const client = createClient<{ error: ApiError | Error }>({ url: "https://api.example.com" });
```

```ts
// api/users.ts
import { client } from "./client";

type User = { id: number; name: string; email: string };

export const getUsers = client.createRequest<{
  response: User[];
  queryParams?: { page?: number; search?: string };
}>()({ endpoint: "/users", method: "GET" });

export const getUser = client.createRequest<{ response: User }>()({
  endpoint: "/users/:userId",
  method: "GET",
});

export const createUser = client.createRequest<{
  response: User;
  payload: { name: string; email: string };
  error: { fields: Record<string, string[]> }; // local error, unioned with ApiError
}>()({ endpoint: "/users", method: "POST" });
```

```ts
const { data, error, status, success, extra } = await getUser.send({ params: { userId: 1 } });

if (success && data) {
  console.log(data.name, extra?.headers);
} else {
  console.error(status, error); // typed ApiError | Error | null, see Type safety
}
```

## Golden rules

1. **Call `createRequest` twice**: `client.createRequest<Types>()({ ... })`. The first call takes the generics, the
   second the options; the split is what lets TypeScript infer `:params` from the endpoint string.
2. **Never `try/catch` around `send()` or `exec()`.** They resolve for 4xx/5xx, network errors, timeouts, aborts and
   removal from the queue. Branch on `success` / `error`. Throwing interceptors, mappers and mocks also end up in
   `error`.
3. **Requests are immutable.** Every setter (`setParams`, `setQueryParams`, `setPayload`, `setHeaders`, `setCacheTime`,
   ...) returns a new request; the original is untouched. Assign the result. Exception: `setMock`, `clearMock` and
   `setMockingEnabled` mutate the instance.
4. **Define requests once at module level** and derive variants with setters or pass dynamic values to
   `send({ params, queryParams, payload })`. Do not call `createRequest` inside loops, handlers or render functions.
5. **Keys are derived, not configured.** `cacheKey` and `queryKey` default to
   `method + endpoint with params + serialized queryParams`; `abortKey` to `method + endpoint template + cancelable`.
   Two equal requests share cache and dedup automatically. Override keys only for deliberate grouping.
6. **Plain `send()` is network-only.** It writes to the cache but never reads from it. Use
   `send({ cachePolicy: "cache-first" | "revalidate" })`, `request.read()`, or a framework hook for cache reads.
7. **Configure defaults before creating requests.** `client.adapter.setRequestDefaults()` is read when a request is
   created, and it **replaces** the HTTP adapter's built-in default (`deduplicate: true` for GET and QUERY). Re-add it.
8. **`auth` defaults to `true`**, so `onAuth` interceptors run for every request. Mark public endpoints `auth: false`.
9. **Type the API error once on the client** (`createClient<{ error: ApiError | Error }>`), add endpoint-specific shapes
   with the `error` generic. System failures still arrive as `Error` instances (`TimeoutError`, `AbortError`,
   `DeletedError`, network `TypeError`) with `status` `0` or `null`; narrow before reading fields.
10. **Response mappers do not change the cache.** The raw adapter response is cached; the mapper runs per request on
    every delivery. Return a full response object from `setResponseMapper`, not bare data.
11. **Server rendering**: in Node the client runs in `"server"` mode and caches nothing unless the request has
    `setScope(id)`. This prevents cross-user leaks; do not force `mode: "client"` on a shared server client.
12. **Logout**: call `client.clear()` (or `await client.cache.clear()`), which also wipes `lazyStorage`, so the next
    user never sees persisted data.

## Type safety

Type safety is the point of HyperFetch: the `Request` type carries response, payload, query params, endpoint params,
local and global errors, adapter methods/options/extra, and whether params/payload/query params are already set. Read
[type-safety](references/type-safety.md) before writing helpers, SDK schemas or mappers.

- **Global error on the client**: `createClient<{ error: ApiError | Error }>`; include `Error` because system failures
  are `Error` instances. Never `new Client<{ error: ... }>` (the class takes positional generics and silently accepts
  the wrong shape).
- **Declare `response` on every request**. Omitted, `data` is `undefined | null` (`unknown` in an SDK `RequestModel`).
- **`queryParams?: Q`** makes them optional at `send`, `queryParams: Q` required; without the key none are accepted. In
  SDK `RequestModel` leaves write `queryParams?: Q | null` for optional ones.
- **Keep endpoint literals**: inline or `const`. A widened `string` endpoint disables `:param` checking entirely; never
  build endpoints with template strings, use `setParams`.
- **Required values are enforced at compile time**: `send()` without required `params` / `payload` / `queryParams` fails
  with `Expected 1 arguments, but got 0`. Setters flip per-request flags (`HasParams`, `HasPayload`, `HasQuery`) on the
  returned clone, so a discarded setter result keeps the requirement.
- **Methods and adapter options are checked** against the adapter
  (`"GET" | "POST" | "PUT" | "PATCH" | "DELETE" | "QUERY"` and `RequestInit` + `timeout` + `streaming` + `responseType`
  for HTTP).
- **`setResponseMapper` changes types** (`data` and the local error follow the mapper's return); `setPayloadMapper` and
  `setRequestMapper` do not.
- **`success` is not a discriminant**: `data: T | null` stays nullable after `if (success)`; check `data`.
- **Helpers accept `<R extends RequestInstance<{ response: X }>>(request: R)`**, derive types with
  `ExtractResponseType`, `ExtractPayloadType`, `ExtractParamsType`, `ExtractQueryParamsType`, `ExtractErrorType`,
  `RequestResponseType`, `RequestSendOptionsType`. Use `RequestModel` (strict defaults) for SDK schema leaves.
- **No `as` casts, `any` generics or `as never` on send options.** A type error almost always means a missing generic or
  a discarded setter result.

```ts
const getUser = client.createRequest<{ response: User }>()({ endpoint: "/users/:userId" });

// @ts-expect-error params are required
getUser.send();
// @ts-expect-error unknown param
getUser.setParams({ id: 1 });
await getUser.setParams({ userId: 1 }).send(); // ok
```

## Core patterns

### Sending with dynamic values and lifecycle callbacks

```ts
const response = await updateUser.send({
  params: { userId: 1 },
  payload: { name: "Ann" },
  retry: 2, // any request option except endpoint/method can be overridden per call
  onBeforeSent: ({ requestId }) => track(requestId),
  onRequestStart: () => setSaving(true),
  onUploadProgress: ({ progress, timeLeft }) => setProgress(progress),
  onDownloadProgress: ({ progress }) => setDownload(progress),
  onResponse: ({ response, details }) => console.log(response.success, details.retries, details.isCanceled),
  onRemove: () => console.log("removed from the queue before it finished"),
});
```

`send()` resolves once, after the last retry or after an offline request finally goes out. `exec()` sends straight
through the adapter (interceptors and mappers run) but skips the dispatcher and the cache: no dedup, retries, queues,
offline handling or cache write. Use `exec()` for server-side one-shots, `send()` everywhere else.

### Auth, headers and token refresh

```ts
client
  .onAuth((request) => {
    const token = tokenStore.get();
    return token ? request.setHeaders({ ...request.headers, Authorization: `Bearer ${token}` }) : request;
  })
  .onError(async (response, request) => {
    if (response.status !== 401 || request.used) return response;
    const { data } = await refreshToken.send({ payload: { refreshToken: tokenStore.getRefresh() } });
    if (!data) return response;
    tokenStore.set(data.token);
    return request.setUsed(true).send(); // `used` stops the loop and skips deduplication
  });

const getHealth = client.createRequest<{ response: { ok: boolean } }>()({ endpoint: "/health", auth: false });
```

Interceptors must return the (new) request or response. Order: `onRequest` -> `onAuth` (only when `auth`) ->
`setRequestMapper` -> payload mapping -> adapter -> `onResponse` -> `onSuccess` or `onError`. Details, removal and
error-shape rules: [interceptors-auth-errors-mapping](references/interceptors-auth-errors-mapping.md).

### Global request and adapter defaults

```ts
client.adapter
  .setRequestDefaults((options) => {
    const method = options.method ?? "GET"; // undefined when the request relies on the default method
    if (method === "GET" || method === "QUERY") return { deduplicate: true, retry: 2 };
    return { retry: 0 };
  })
  .setAdapterDefaults(() => ({ timeout: 15_000, credentials: "include" })); // fetch RequestInit + timeout
```

Explicit request options always win over these defaults. The HTTP adapter times out after **5000 ms** by default; raise
it with `setAdapterDefaults` or per request with `options: { timeout }`.

### Cache reads, invalidation and SWR

```ts
const cached = getUsers.read(); // response-shaped entry or undefined, no network
const fast = await getUsers.send({ cachePolicy: "cache-first" }); // cached entry if present (fresh or stale), else network
const swr = await getUsers.send({ cachePolicy: "revalidate" }); // cached entry now, network refresh in background

// After a mutation: mark entries stale and notify subscribers (hooks refetch)
const { success } = await createUser.send({ payload });
if (success) client.cache.invalidate([getUsers, /GET_\/users/]);
```

`staleTime` (default 5 min) is when data stops being fresh; `cacheTime` (default 5 min) is when the entry is garbage
collected, counted from `responseTimestamp`. Only successful responses are stored; a failed refetch keeps the last good
`data`. Full model, freshness checks and persistence:
[cache-and-garbage-collection](references/cache-and-garbage-collection.md).

### Deduplication, cancelation, queues

```ts
// Typeahead: keep only the latest. Fix the queryKey, because it includes the query params by default.
const searchUsers = getUsers.setCancelable(true).setQueryKey("users-search");

// Sequential writes that survive going offline
const saveNote = client.createRequest<{ response: Note; payload: NoteInput }>()({
  endpoint: "/notes",
  method: "POST",
  queued: true, // one at a time, in order
  offline: true, // default: wait for the network instead of failing
  retry: 3,
  retryTime: 2000,
});

getUser.setParams({ userId: 1 }).abort(); // aborts every in-flight request with the same abortKey
```

Mode precedence per queue (`queryKey`): `queued` > `cancelable` > `deduplicate` > concurrent. Deduplication only joins a
request that is still in flight (optionally within `deduplicateTime`); it is not a cache. There is no priority option:
order work with `queued`, separate `queryKey`s and `dispatcher.pause/start/stop`. See
[dispatchers-queues-dedup-cancel](references/dispatchers-queues-dedup-cancel.md) and
[offline-retries-persistence](references/offline-retries-persistence.md).

### Response mapping and validation

```ts
const getProfile = client
  .createRequest<{ response: ApiUser }>()({ endpoint: "/me" })
  .setResponseMapper((response) => {
    if (!response.success) return response;
    const user = UserSchema.parse(response.data); // a throw becomes { success: false, error: <thrown> }
    return { ...response, data: { id: user.id, name: user.full_name } };
  });
// (await getProfile.send()).data is typed as { id: number; name: string } | null
```

### SDK

```ts
import { createSdk, type RequestModel } from "@hyper-fetch/core";

type Schema = {
  todos: {
    $get: RequestModel<{ response: Todo[]; queryParams?: { done?: boolean } | null; endpoint: "/todos" }>;
    $post: RequestModel<{ response: Todo; payload: TodoInput; endpoint: "/todos" }>;
    $todoId: {
      $patch: RequestModel<{ response: Todo; payload: Partial<TodoInput>; endpoint: "/todos/:todoId" }>;
    };
  };
};

export const sdk = createSdk<typeof client, Schema>(client).$configure({
  "*": { retry: 1 },
  "todos.$todoId.$patch": (request) => request.setCancelable(true),
});

await sdk.todos.$todoId.$patch.send({ params: { todoId: 1 }, payload: { done: true } });
```

`$name` keys are methods (`$get` -> GET) or path params (`$todoId` -> `/:todoId`); camelCase segments become kebab-case.
Every property access builds a **new** request, so keep a reference when you `setMock` or attach `$hooks`. Generate the
schema from OpenAPI with the `hyper-fetch-cli` skill. Details: [sdk](references/sdk.md).

### Optimistic updates (framework-agnostic)

```ts
import { optimistic } from "@hyper-fetch/core";

const toggleTodo = client
  .createRequest<{ response: Todo; payload: { done: boolean } }>()({ endpoint: "/todos/:todoId", method: "PATCH" })
  .setOptimistic(({ params, payload }) => [optimistic(getTodos).patch(params.todoId, payload)]);
```

Core applies the change to cached entries before sending, rolls back or refetches on failure, abort or removal, and
refreshes the target once the last pending mutation on it settles. See
[optimistic-updates](references/optimistic-updates.md); for optimistic UI and SSR hydration in components, load
`hyper-fetch-react`, which covers both in depth.

## Decision guide

| Need                                                         | Use                                                          |
| ------------------------------------------------------------ | ------------------------------------------------------------ |
| Send and get typed result                                    | `request.send(options)`                                      |
| One-off call without queue/cache side effects (SSR, scripts) | `request.exec(options)`                                      |
| Show cached data without a request                           | `request.read()` or `send({ cachePolicy: "cache-first" })`   |
| Stale-while-revalidate in plain TS                           | `send({ cachePolicy: "revalidate" })`                        |
| Data in a React component                                    | `useFetch` / `useSubmit` (load `hyper-fetch-react`)          |
| Refresh data after a mutation                                | `client.cache.invalidate(request \| key \| RegExp \| array)` |
| Instant UI before the server answers                         | `setOptimistic` + `optimistic()`                             |
| Several components fire the same GET                         | nothing, GET/QUERY dedupe by default                         |
| Only the latest of rapid calls matters                       | `cancelable: true` (+ shared `setQueryKey`)                  |
| Strict ordering, one at a time                               | `queued: true`                                               |
| Survive offline                                              | `offline: true` (default) + optionally dispatcher `storage`  |
| Retry transient failures only                                | `retry`, `retryTime`, `setRetryOnError`                      |
| Add token                                                    | `onAuth` (with `auth` left `true`)                           |
| Same headers/timeout everywhere                              | `setRequestDefaults` / `setAdapterDefaults`                  |
| Reshape or validate the response                             | `setResponseMapper`                                          |
| Validate or rewrite the outgoing request                     | `setRequestMapper`, `setPayloadMapper`                       |
| Per-endpoint defaults with an SDK                            | `sdk.$configure` / `createConfiguration`                     |
| Observe everything (analytics, logging)                      | `new Plugin({ name })` or `client.requestManager.events`     |
| Different backend protocol                                   | `client.setAdapter(...)` (axios, graphql, firebase skills)   |

## Defaults (verified in source)

| Option                    | Default                                                    | Note                                          |
| ------------------------- | ---------------------------------------------------------- | --------------------------------------------- |
| `method`                  | adapter `defaultMethod` (`"GET"`)                          |                                               |
| `auth`                    | `true`                                                     | runs `onAuth`                                 |
| `cache`                   | `true`                                                     | ignored in `"server"` mode without `setScope` |
| `cacheTime` / `staleTime` | `300000` ms each                                           | `Time.MIN * 5`                                |
| `retry` / `retryTime`     | `0` / `500` ms                                             | delay or `exponentialBackoff()` function      |
| `deduplicate`             | `true` for GET and QUERY on the HTTP adapter, else `false` |                                               |
| `deduplicateTime`         | `null`                                                     | joins for the whole flight                    |
| `cancelable` / `queued`   | `false` / `false`                                          |                                               |
| `offline`                 | `true`                                                     | waits for the network                         |
| `structuralSharing`       | `true`                                                     | keeps unchanged references                    |
| HTTP adapter `timeout`    | `5000` ms                                                  | adapter option                                |
| client `mode`             | `"auto"`                                                   | browser `client`, otherwise `server`          |
| cache `version`           | `"0.0.1"`                                                  |                                               |
| logs                      | off                                                        | `client.setDebug(true)`, level `"warning"`    |

## Performance and optimization

- Keep keys stable: query param objects are serialized with `JSON.stringify`, so `{ a, b }` and `{ b, a }` are different
  cache entries and different queues. Build query objects in a fixed order and drop `undefined` noise.
- Tune `staleTime` per resource, not globally. Long `staleTime` stops hook refetches; `cacheTime` only bounds memory.
  Use `Time.MIN`, `Time.HOUR` constants. `cacheTime: Infinity` keeps entries forever, so use it only for small datasets.
- Rely on GET deduplication instead of hoisting fetches. Disable it (`deduplicate: false`) only when each call must hit
  the server.
- Use `cancelable` for search and filters to avoid wasted responses; `queued` serializes, so do not set it on reads.
- Leave `structuralSharing` on; it returns the previous `data` reference for deeply equal responses, which avoids
  rerenders. Turn it off for huge payloads you never compare, to save the deep diff.
- Invalidate narrowly (a request or anchored RegExp) instead of `invalidate()` with no argument, which marks every entry
  stale and triggers every subscribed refetch.
- Put response mappers on the request, not in components; several mapped variants share one cache entry and one network
  call.
- Long-lived listeners (`requestManager.events.*`, `cache.events.*`, `$hooks.*`) return unsubscribe functions; call
  them. `$hooks` are copied into every clone made afterwards, so register them once on the base request.
- Persist with `lazyStorage` (async, loaded on demand) instead of a JSON-backed sync `storage` for big caches; bump the
  cache `version` when response shapes change so old persisted data is dropped.

## Pitfalls

| Wrong                                                                     | Right                                                                                                                        |
| ------------------------------------------------------------------------- | ---------------------------------------------------------------------------------------------------------------------------- |
| `client.createRequest<{ response: User }>({ endpoint })`                  | `client.createRequest<{ response: User }>()({ endpoint })`                                                                   |
| `new Client<{ error: ApiError }>(...)`                                    | `createClient<{ error: ApiError \| Error }>(...)` (the class takes positional generics and accepts the wrong shape silently) |
| `request.setParams({ id })` then sending `request`                        | `const withId = request.setParams({ id }); withId.send()`                                                                    |
| `try { await req.send() } catch {}`                                       | `const { data, error } = await req.send()`                                                                                   |
| `setResponseMapper((res) => res.data.users)`                              | `setResponseMapper((res) => ({ ...res, data: res.data?.users ?? null }))`                                                    |
| `request.data` inside a mapper                                            | `request.payload`                                                                                                            |
| `setOptions({ retry: 5 })`                                                | `setRetry(5)`; `setOptions` sets adapter options such as `timeout`                                                           |
| `new Cache({ storage: localStorage })`                                    | an object implementing `CacheStorageType`, or `lazyStorage`                                                                  |
| `client.cache.set("key", { data })`                                       | `client.cache.update(request, (prev) => ({ data }))` or `client.hydrate`                                                     |
| `cancelable` search with changing query params cancels nothing            | add `.setQueryKey("search")` so calls share a queue                                                                          |
| Expecting `send()` to return cached data                                  | `send({ cachePolicy: "cache-first" })`                                                                                       |
| Awaiting `send()` while offline with `offline: true`                      | the promise waits for the network; use `offline: false` to fail fast                                                         |
| `setRequestDefaults(...)` silently dropping GET dedup                     | return `{ deduplicate: true }` for GET/QUERY in your callback                                                                |
| `new Plugin({ onRequestCreate })`                                         | `new Plugin({ name: "x" }).onRequestCreate(cb)`                                                                              |
| Mocking `sdk.users.$get.setMock(...)` then sending `sdk.users.$get` again | keep `const req = sdk.users.$get` and use `req`                                                                              |
| Token refresh resending a `queued` request with `send()`                  | the queue is held by the original, resend with `exec()`                                                                      |

## Testing

Mock at the request level with
`request.setMock(({ request }) => ({ data, status: 200 }), { requestTime: 0, responseTime: 0 })` (the mocker waits 20
ms + 20 ms by default) or at the network level with MSW (`http` handlers and `setupServer` from `msw/node`). Toggle
globally with `client.setEnableGlobalMocking(false)`. Create a fresh client per test (or call `client.clear()`) so
cache, queues and interceptors do not leak between tests. The
[testing guide](https://hyperfetch.bettertyped.com/docs/guides/testing) has the full workflow.

## References

- [type-safety](references/type-safety.md) - read first for any typing question: client and request generics, param and
  payload enforcement, query params, mapper type changes, error narrowing, extractor types, generic helpers, SDK and
  adapter typing, type pitfalls.
- [requests-and-typing](references/requests-and-typing.md) - read when defining requests, generics, params, query
  params, payloads, send options, callbacks, `$hooks`, response shape, `exec` vs `send`, `RequestInstance` helpers.
- [interceptors-auth-errors-mapping](references/interceptors-auth-errors-mapping.md) - read for auth, token refresh,
  interceptor order, global/local errors, built-in error classes, request/response/payload mappers, validation.
- [cache-and-garbage-collection](references/cache-and-garbage-collection.md) - read for keys, staleness, GC,
  invalidation, manual cache writes, SWR in core, scopes and server mode, SSR hydration, versioning.
- [dispatchers-queues-dedup-cancel](references/dispatchers-queues-dedup-cancel.md) - read for deduplication,
  cancelation, aborting, queues, queue control, concurrency, response ordering.
- [offline-retries-persistence](references/offline-retries-persistence.md) - read for offline mode, AppManager in React
  Native/Electron/Node, retries, cache and queue persistence.
- [sdk](references/sdk.md) - read for `createSdk`, schemas, `$configure`, `createConfiguration`, CLI-generated SDKs.
- [optimistic-updates](references/optimistic-updates.md) - read for `setOptimistic`, `optimistic()` helpers, rollback,
  commit and settlement rules.
- [plugins-and-custom-adapters](references/plugins-and-custom-adapters.md) - read for `Plugin` hooks, writing an
  adapter, adapter mappers and query string options.
- [events-and-managers](references/events-and-managers.md) - read for request, cache, dispatcher and app events, the
  logger, and building your own bindings.

Docs: https://hyperfetch.bettertyped.com/docs/core/overview (also `/docs/core/request`, `/docs/core/cache`,
`/docs/core/dispatcher`, `/docs/core/sdk`, `/docs/guides/core/basics/setup`). Where a docs page and this skill disagree,
this skill was checked against the source.
