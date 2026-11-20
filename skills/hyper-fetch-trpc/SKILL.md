---
name: hyper-fetch-trpc
description:
  tRPC adapter for HyperFetch (`@hyper-fetch/trpc`). Calls tRPC v11 procedures over HTTP with types inferred from the
  `AppRouter` type, through the regular `createSdk` of `@hyper-fetch/core`, and gives them HyperFetch caching,
  deduplication, queueing, retries, offline support and React hooks. Use when the user installs or configures
  `@hyper-fetch/trpc`, imports `TrpcAdapter`, `TrpcSchema`, `TrpcMethods`, `TrpcErrorType` or `TrpcTransformerType`,
  writes `createSdk<typeof client, TrpcSchema<AppRouter>>`, calls `api.user.byId.$query` or `api.user.create.$mutation`,
  uses tRPC with `useFetch` / `useSubmit`, sets a `superjson` transformer, maps `TRPCError` codes and `errorFormatter`
  fields, adds auth headers to tRPC calls, or asks about tRPC batching, links, subscriptions, or replacing
  `@trpc/client` / `@trpc/react-query` with HyperFetch.
---

# HyperFetch tRPC adapter

`TrpcAdapter()` is a `@hyper-fetch/core` adapter whose methods are `QUERY` and `MUTATION` and whose endpoint is the
procedure path. Nothing tRPC-specific replaces the core API: you type the router with the `TrpcSchema<AppRouter>` helper
and pass it to the regular `createSdk`. Every procedure becomes a normal HyperFetch `Request` under `$query` (query
procedures) or `$mutation` (mutation procedures), so `send()`, the cache, `useFetch` and `useSubmit` work as everywhere
else.

Read `hyper-fetch-core` for requests, cache and the SDK, and `hyper-fetch-react` for hooks.

## Install and set up

```bash
npm install @hyper-fetch/core @hyper-fetch/trpc
```

`@trpc/server` (v11) is an optional peer dependency used only by the `TrpcSchema` type. The project that imports the
`AppRouter` type usually has it already. No `@trpc/client` is needed.

```ts
// server: export only the type
export const appRouter = t.router({ user: userRouter });
export type AppRouter = typeof appRouter;
```

```ts
// client/api.ts
import { createClient, createSdk } from "@hyper-fetch/core";
import { TrpcAdapter } from "@hyper-fetch/trpc";
import type { TrpcSchema } from "@hyper-fetch/trpc";

import type { AppRouter } from "../server/router";

export const client = createClient({ url: "http://localhost:3000/trpc" }).setAdapter(TrpcAdapter());

export const api = createSdk<typeof client, TrpcSchema<AppRouter>>(client, { camelCaseToKebabCase: false });
```

`url` is where the tRPC handler is mounted (including `/trpc` or your base path). Query strings on `url` are kept.

## Golden rules

1. **Always pass `{ camelCaseToKebabCase: false }` to `createSdk`.** The SDK default turns `byId` into `by-id`, which is
   not your procedure name.
2. **Import the router as a type** (`import type { AppRouter }`) so no server code reaches the client bundle.
3. **The input is the `payload`.** `setPayload(input)` or `send({ payload })`, `submit({ payload })`. Never `params`.
4. **Use the leaf that matches the procedure**: query procedures only have `$query`, mutation procedures only have
   `$mutation`. Calling a query procedure with `MUTATION` gets `405 METHOD_NOT_SUPPORTED`.
5. **Pass the server's transformer to the adapter**: `TrpcAdapter({ transformer: superjson })` when the server uses
   `initTRPC.create({ transformer: superjson })`. Mismatched transformers break inputs and outputs.
6. **Narrow `error` before reading tRPC fields.** It is the router error shape or a plain `Error` (network, abort,
   timeout). Use `"data" in error`.
7. **No batching, no subscriptions, no links.** Each call is one HTTP request. Subscription procedures are left out of
   `TrpcSchema`.

## Core patterns

### Calling procedures

```ts
const { data: user, error, status } = await api.user.byId.$query.setPayload({ id: 1 }).send();

// Optional input may be omitted, procedures without input take no payload
await api.user.list.$query.send();
await api.health.$query.send();

const { data: created } = await api.user.create.$mutation.send({ payload: { name: "John" } });
```

Types come from the router: `data` is the transformed procedure output, the payload is the input, and the payload is
required only when the input is required.

On the wire, queries are `GET {url}/user.byId?input={"id":1}` (URL-encoded, no `Content-Type`, so no CORS preflight for
simple requests) and mutations are `POST {url}/user.create` with a JSON body.

### React hooks

```tsx
import { useFetch, useSubmit } from "@hyper-fetch/react";

import { api, client } from "./api";

export const UserCard = ({ id }: { id: number }) => {
  // a new id is a new cache key: fetched once, then served from the cache
  const { data, loading, error } = useFetch(api.user.byId.$query.setPayload({ id }));

  if (loading) return <p>Loading...</p>;
  if (error) return <p>{error.message}</p>;
  return <p>{data?.name}</p>;
};

export const CreateUser = () => {
  const { submit, submitting } = useSubmit(api.user.create.$mutation);

  const onCreate = async () => {
    const { data } = await submit({ payload: { name: "John" } });
    if (data) {
      // mark every cached input of `user.list` stale, mounted hooks refetch
      client.cache.invalidate(/^QUERY_user\.list-/);
    }
  };

  return (
    <button disabled={submitting} onClick={onCreate}>
      Create
    </button>
  );
};
```

`useFetch` for query procedures, `useSubmit` for mutation procedures. Use `client.cache.update(request, updater)` for an
in-place cache edit or `client.cache.invalidate(...)` to refetch, as described in `hyper-fetch-react`.

### Errors

`send()` and `submit()` resolve. A failed procedure gives the error exactly as the server sent it, plus the HTTP status:

```ts
const { error, status, extra } = await api.user.byId.$query.setPayload({ id: 999 }).send();

if (error && "data" in error) {
  status; // 404
  error.message; // "User not found"
  error.code; // -32004 (JSON-RPC code)
  error.data.code; // "NOT_FOUND"
  error.data.httpStatus; // 404
}
extra?.headers; // response headers
```

| Case                                                | `status`      | `error`                                     |
| --------------------------------------------------- | ------------- | ------------------------------------------- |
| `TRPCError` thrown in a procedure or middleware     | its HTTP code | error shape (`message`, `code`, `data`)     |
| Input parser throws                                 | 400           | shape with `data.code: "BAD_REQUEST"`       |
| Unknown procedure path                              | 404           | shape with `data.code: "NOT_FOUND"`         |
| Wrong method (query sent as mutation or vice versa) | 405           | `data.code: "METHOD_NOT_SUPPORTED"`         |
| Plain `throw new Error()` on the server             | 500           | `data.code: "INTERNAL_SERVER_ERROR"`        |
| Body not from tRPC (proxy HTML page)                | proxy status  | `UnexpectedError`                           |
| Network failure, `abort()`, timeout                 | `0`           | `Error` (`AbortError`, `TimeoutError`, ...) |

With `TrpcSchema` the error type follows the router, including fields added by an `errorFormatter`. For hand-made
requests use `TrpcErrorType<Data>` (default data: `code`, `httpStatus`, `path?`, `stack?`).

Stop retries on client errors with core's `setRetryOnError`:

```ts
const byId = api.user.byId.$query
  .setRetry(3)
  .setRetryOnError(({ error }) => !(error && "data" in error && error.data.httpStatus < 500));
```

### Auth headers

```ts
client.onAuth((request) => request.setHeaders({ ...request.headers, Authorization: `Bearer ${getToken()}` }));

// or for one call
await api.me.$query.setHeaders({ Authorization: "Bearer token" }).send();
```

### Transformers

```ts
import superjson from "superjson";

export const client = createClient({ url: "http://localhost:3000/trpc" }).setAdapter(
  TrpcAdapter({ transformer: superjson }),
);
// data?.createdAt is a Date again
```

Any `{ serialize, deserialize }` object works. With separate transformers per direction pass
`{ serialize: input.serialize, deserialize: output.deserialize }`. The transformer also serializes the cache keys, so a
`Date` input and its ISO string are different entries.

### SDK defaults

```ts
const configured = api.$configure({
  "*": { retry: 1 },
  "user.byId.$query": { staleTime: 30_000 },
});
```

`$configure` keys are validated against the schema and it returns a new SDK.

### Requests without the SDK

```ts
const getUser = client.createRequest<{ response: User; payload: { id: number } }>()({
  endpoint: "user.byId",
  method: "QUERY",
});
```

`QUERY` is the default method. `user.byId` and `/user/byId` point to the same procedure and share the cache. Use this
for procedures named like a request property (`send`, `method`), which the SDK can't reach.

## Type safety

Types flow from the server router to every call without codegen: `typeof appRouter` → `TrpcSchema<AppRouter>` →
`createSdk<typeof client, TrpcSchema<AppRouter>>` → `api.user.byId.$query` (a core `Request`) → `send()`, `useFetch`,
`useSubmit`. Per procedure:

| Request slot | Inferred as                                                                                 |
| ------------ | ------------------------------------------------------------------------------------------- |
| `response`   | `inferTransformedProcedureOutput` (JSON-serialized unless the router has a transformer)     |
| `payload`    | the procedure input, `undefined` without input, optional when the input accepts `undefined` |
| local error  | the router's `errorShape`, including `errorFormatter` fields                                |
| endpoint     | `"/user/byId"` (names exactly as written)                                                   |
| leaf         | `$query` for queries, `$mutation` for mutations, subscriptions omitted                      |

```ts
// @ts-expect-error the input is required
api.user.byId.$query.send();
// @ts-expect-error wrong input type
api.user.byId.$query.setPayload({ id: "1" });
// @ts-expect-error a query procedure has no $mutation leaf
api.user.byId.$mutation;
// @ts-expect-error GET is not a method of this adapter, use "QUERY" or "MUTATION"
client.createRequest()({ endpoint: "health", method: "GET" });
```

Inference is lost by annotating the router (`const appRouter: AnyTRPCRouter = ...`), casting it, using the SDK without
`TrpcSchema`, or a `@trpc/server` other than v11. A server `Date` is typed `string` unless the router has a transformer,
and the adapter must get the same transformer or runtime values will not match the types. Read
[references/type-safety.md](references/type-safety.md) for the full inference rules, error typing, hand-typed requests
and every inference-loss case.

## Cache, dedupe and cancel

- Cache and query keys contain the method, the procedure and the serialized input: `{ id: 1 }` and `{ id: 2 }` are
  cached, deduplicated and queued separately. Format: `QUERY_user.byId-{"id":1}-`.
- Queries are deduplicated by default (same as `GET` with the HTTP adapter). Mutations are not.
- The abort key ignores the input, so `request.abort()` stops every running call of the procedure.
- `cancelable` only cancels a running call with the same query key. For search-as-you-type share the key:

```ts
const search = api.user.search.$query.setCancelable(true).setDeduplicate(false).setQueryKey("user-search");
```

## Options

Request `options` are `fetch` `RequestInit` fields (except `method`, `headers`, `body`, `signal`) plus `timeout`
(default 5000 ms, `0` disables it):

```ts
const me = api.user.me.$query.setOptions({ credentials: "include", timeout: 10000 });
```

Query params are appended to the URL. `input` and `batch` are reserved and dropped.

## Pitfalls

| Symptom                                                 | Cause                                    | Fix                                                  |
| ------------------------------------------------------- | ---------------------------------------- | ---------------------------------------------------- |
| 404 for `user.by-id`                                    | SDK kebab-cases names by default         | `createSdk(client, { camelCaseToKebabCase: false })` |
| `Property 'data' does not exist on type 'Error \| ...'` | `error` also includes the global `Error` | Narrow with `"data" in error`                        |
| Dates arrive as strings                                 | Transformer missing on the adapter       | `TrpcAdapter({ transformer: superjson })`            |
| Procedure gets no input for `null`                      | A `null` payload removes the payload     | Wrap it: `{ value: null }`                           |
| Subscription procedure missing from `api`               | Subscriptions are not supported          | Use `@trpc/client` or `hyper-fetch-sockets`          |
| `api.send` or `api.method` is not a procedure           | Name clashes with request properties     | `client.createRequest` with the path                 |
| Many parallel calls, no `httpBatchLink`                 | Batching is not supported                | Rely on deduplication, or merge procedures           |

## Testing

`request.setMock(() => ({ data, status: 200 }))` skips the network for any adapter. For wire-level tests run a real
handler (`createHTTPServer` from `@trpc/server/adapters/standalone` on port `0`) or mock `{url}/user.byId` with msw,
answering `{ result: { data } }` or `{ error }`. See `hyper-fetch-testing`.

## Links

- Docs: https://hyperfetch.bettertyped.com/docs/integrations/adapter-trpc/overview
- SDK: https://hyperfetch.bettertyped.com/docs/core/sdk
- Related skills: `hyper-fetch-core`, `hyper-fetch-react`, `hyper-fetch-orpc`, `hyper-fetch-testing`.
