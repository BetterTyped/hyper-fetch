---
name: hyper-fetch-orpc
description:
  oRPC adapter for HyperFetch (`@hyper-fetch/orpc`). Calls oRPC procedures with the RPC protocol of `RPCHandler`, typed
  from the router or a contract through the regular `createSdk` of `@hyper-fetch/core`, with HyperFetch caching,
  deduplication, queueing, retries, offline support and React hooks. Use when the user installs or configures
  `@hyper-fetch/orpc`, imports `OrpcAdapter`, `OrpcSchema`, `OrpcMethods`, `OrpcErrorType` or `OrpcQueryMethod`, writes
  `createSdk<typeof client, OrpcSchema<typeof router>>` or `OrpcSchema<ContractRouterClient<typeof contract>>`, calls
  `api.planet.find.$query` / `$mutation`, uses oRPC with `useFetch` / `useSubmit`, sends queries with GET
  (`queryMethod`), uploads files, keeps `Date` / `BigInt` / `Map` / `Set` types, sets `customJsonSerializers`, narrows
  `ORPCError` codes from `.errors()`, or asks about oRPC batching, event iterators, or replacing `RPCLink` /
  `@orpc/tanstack-query` with HyperFetch.
---

# HyperFetch oRPC adapter

`OrpcAdapter()` is a `@hyper-fetch/core` adapter that speaks the oRPC RPC protocol (the format `RPCHandler` and
`RPCLink` use). Its methods are `QUERY` and `MUTATION`, its endpoint is the procedure path (`planet/find`), and the
payload is the procedure input, encoded with the official oRPC serializer from `@orpc/client`. Typing is a type helper,
not a new client: `OrpcSchema<typeof router>` goes into the regular `createSdk`, and every procedure becomes a normal
HyperFetch `Request` under both `$query` and `$mutation`.

Read `hyper-fetch-core` for requests, cache and the SDK, and `hyper-fetch-react` for hooks.

## Install and set up

```bash
npm install @hyper-fetch/core @hyper-fetch/orpc @orpc/client
```

`@orpc/client` (v1) is a required peer: the adapter uses its serializer at runtime. `@orpc/server` is optional and only
needed for `OrpcSchema<typeof router>`.

```ts
// server/router.ts
import { os } from "@orpc/server";
import { z } from "zod";

type Planet = { id: number; name: string };
const planets: Planet[] = [{ id: 1, name: "Earth" }];

export const router = {
  planet: {
    list: os.route({ method: "GET" }).handler(() => planets),
    search: os
      .input(z.object({ q: z.string() }))
      .handler(({ input }) => planets.filter((p) => p.name.includes(input.q))),
    find: os
      .input(z.object({ id: z.number() }))
      .errors({ NOT_FOUND: { message: "Planet not found", data: z.object({ id: z.number() }) } })
      .handler(({ input, errors }) => {
        const planet = planets.find(({ id }) => id === input.id);
        if (!planet) throw errors.NOT_FOUND({ data: { id: input.id } });
        return planet;
      }),
    create: os.input(z.object({ name: z.string() })).handler(({ input }): Planet => ({ id: 2, name: input.name })),
  },
};
// served by: new RPCHandler(router).handle(req, res, { prefix: "/rpc" })
```

```ts
// client/api.ts
import { createClient, createSdk } from "@hyper-fetch/core";
import { OrpcAdapter } from "@hyper-fetch/orpc";
import type { OrpcSchema } from "@hyper-fetch/orpc";

import type { router } from "../server/router";

export const client = createClient({ url: "http://localhost:3000/rpc" }).setAdapter(OrpcAdapter());

export const api = createSdk<typeof client, OrpcSchema<typeof router>>(client, { camelCaseToKebabCase: false });
```

`url` is the `RPCHandler` prefix. The path and query string of `url` are kept.

### Contract-first

```ts
import type { ContractRouterClient } from "@orpc/contract";

import type { contract } from "../contract";

export const api = createSdk<typeof client, OrpcSchema<ContractRouterClient<typeof contract>>>(client, {
  camelCaseToKebabCase: false,
});
```

This works without `@orpc/server`. `OrpcSchema<RouterClient<typeof router>>` is accepted too.

## Golden rules

1. **Always pass `{ camelCaseToKebabCase: false }` to `createSdk`.** Otherwise `findById` is sent as `find-by-id`.
2. **Import the router as a type** so no server code reaches the bundle.
3. **The input is the `payload`**: `setPayload(input)`, `send({ payload })`, `submit({ payload })`.
4. **Pick the leaf by intent.** oRPC procedures have no kind, so every procedure has `$query` (deduplicated by default,
   for `useFetch`) and `$mutation` (never deduplicated, for `useSubmit`). They have different cache keys.
5. **Keep the default `POST` unless the procedure allows GET.** `RPCHandler` accepts GET only for procedures with
   `.route({ method: "GET" })` (or with `strictGetMethodPluginEnabled: false`). Others fail with `405`.
6. **Share serializers.** `customJsonSerializers` must be the same list on `RPCHandler` and in `OrpcAdapter`.
7. **Narrow `error` before reading oRPC fields**: it is the `ORPCError` JSON or a plain `Error` (network, abort,
   timeout). Use `"defined" in error`.
8. **No batching, no event iterators.** One call is one HTTP request. Procedures returning an event iterator are left
   out of `OrpcSchema`.

## Core patterns

### Calling procedures

```ts
const { data: planet, error, status } = await api.planet.find.$query.setPayload({ id: 1 }).send();

const { data: created } = await api.planet.create.$mutation.send({ payload: { name: "Earth" } });
```

`data` is the procedure output and the payload is the input before schema transformation. A payload is required only
when the input is required. On the wire both are `POST {url}/planet/find` with the serialized input as a JSON body.

### React hooks

```tsx
import { useFetch, useSubmit } from "@hyper-fetch/react";

import { api, client } from "./api";

export const PlanetName = ({ id }: { id: number }) => {
  const { data, loading } = useFetch(api.planet.find.$query.setPayload({ id }));

  if (loading) return <p>Loading...</p>;
  return <p>{data?.name}</p>;
};

export const CreatePlanet = () => {
  const { submit, submitting } = useSubmit(api.planet.create.$mutation);

  const onCreate = async () => {
    const { data } = await submit({ payload: { name: "Earth" } });
    // mark every cached input of planet/list stale, mounted useFetch hooks refetch
    if (data) client.cache.invalidate(/^QUERY_\/planet\/list-/);
  };

  return (
    <button disabled={submitting} onClick={onCreate}>
      Create
    </button>
  );
};
```

### Errors

`send()` and `submit()` resolve. Procedure errors keep the `ORPCError.toJSON()` shape and the HTTP status:

```ts
const { error, status } = await api.planet.find.$query.setPayload({ id: 999 }).send();

if (error && "defined" in error) {
  if (error.defined && error.code === "NOT_FOUND") {
    error.data.id; // typed from `.errors({ NOT_FOUND: { data: ... } })`
  } else {
    error.message; // undefined errors: `defined: false`, `data: unknown`
  }
}
```

| Case                                           | `status`    | `error`                                                         |
| ---------------------------------------------- | ----------- | --------------------------------------------------------------- |
| Error from the `.errors()` map                 | its status  | `{ defined: true, code, status, message, data }`                |
| `throw new ORPCError("CODE", { status })`      | that status | `{ defined: false, ... }`                                       |
| Input or output validation fails               | 400 / 500   | `defined: false`, codes `BAD_REQUEST` / `INTERNAL_SERVER_ERROR` |
| Plain `throw new Error()` in a handler         | 500         | `code: "INTERNAL_SERVER_ERROR"`                                 |
| GET sent to a POST-only procedure              | 405         | `code: "METHOD_NOT_SUPPORTED"`                                  |
| Body not from oRPC (proxy HTML page, 404 page) | that status | `UnexpectedError`                                               |
| Network failure, `abort()`, timeout            | `0`         | `Error` (`AbortError`, `TimeoutError`, ...)                     |

For requests created by hand type the error with `OrpcErrorType<Code, Data>`. Stop retrying on known errors:

```ts
const find = api.planet.find.$query
  .setRetry(3)
  .setRetryOnError(({ error }) => !(error && "defined" in error && error.code === "NOT_FOUND"));
```

### GET queries

```ts
export const client = createClient({ url: "http://localhost:3000/rpc" }).setAdapter(
  OrpcAdapter({ queryMethod: "GET" }),
);

// switch one request back to POST
const { data } = await api.planet.list.$query.setOptions({ queryMethod: "POST" }).send();
```

Queries go out as `GET {url}/planet/find?data={"json":{"id":1}}`, which browsers, proxies and CDNs can cache. Mutations
always use POST. Inputs with files, or URLs longer than 2083 characters, fall back to POST like the official `RPCLink`.

### Rich types and files

The oRPC serializer round-trips `Date`, `BigInt`, `Map`, `Set`, `URL`, `RegExp`, `NaN` and `undefined` inside arrays.
Object properties set to `undefined` are dropped, as in JSON. An input with a `File` or `Blob` is sent as
`multipart/form-data`, and outputs with files are read back the same way:

```ts
// with a procedure `planet.uploadImage` taking z.object({ planetId: z.number(), image: z.instanceof(File) })
await api.planet.uploadImage.$mutation.setPayload({ planetId: 1, image: file }).send();

// custom types: the same list as `new RPCHandler(router, { customJsonSerializers })`
const richClient = createClient({ url }).setAdapter(OrpcAdapter({ customJsonSerializers: [moneySerializer] }));
```

### Auth headers and SDK defaults

```ts
client.onAuth((request) => request.setHeaders({ ...request.headers, Authorization: `Bearer ${getToken()}` }));

const configured = api.$configure({ "*": { retry: 1 }, "planet.find.$query": { staleTime: 30_000 } });
```

### Requests without the SDK

```ts
const findPlanet = client.createRequest<{ response: Planet; payload: { id: number } }>()({
  endpoint: "planet/find",
  method: "QUERY",
});
```

`QUERY` is the default method. `planet/find` and `/planet/find` share the cache. Use this for procedures named like a
request property (`send`, `method`), which the SDK can't reach.

## Type safety

Types flow from the router or contract to every call without codegen: `typeof router` (or
`ContractRouterClient<typeof contract>`, or `RouterClient<typeof router>`) → `OrpcSchema<...>` →
`createSdk<typeof client, OrpcSchema<...>>` → `api.planet.find.$query` (a core `Request`) → `send()`, `useFetch`,
`useSubmit`. Per procedure, on both `$query` and `$mutation`:

| Request slot | Inferred as                                                                                                      |
| ------------ | ---------------------------------------------------------------------------------------------------------------- |
| `response`   | the output, with `Date`, `bigint`, `Set`, `Map`, `File` kept (the serializer restores them)                      |
| `payload`    | the schema **input** (before `.transform()`), `undefined` without input, optional if the input is optional       |
| local error  | `OrpcErrorType<Code, Data> & { defined: true }` per `.errors()` entry, plus `OrpcErrorType & { defined: false }` |
| endpoint     | `"/planet/find"` (names exactly as written); event iterators omitted                                             |

```ts
// @ts-expect-error the input is required
api.planet.find.$query.send();
// @ts-expect-error wrong input type
api.planet.find.$query.setPayload({ id: "1" });
// @ts-expect-error POST is the wire method, the adapter methods are "QUERY" and "MUTATION"
client.createRequest()({ endpoint: "planet/find", method: "POST" });
// @ts-expect-error only "POST" and "GET"
OrpcAdapter({ queryMethod: "PUT" });
```

Inference is lost by annotating or casting the router (`AnyRouter`, `as any`), by passing a contract itself instead of
`ContractRouterClient<typeof contract>`, or by reading `error.data` without narrowing on `defined` and `code`. Read
[references/type-safety.md](references/type-safety.md) for the full inference rules, contract-first typing, error
narrowing, hand-typed requests and every inference-loss case.

## Cache, dedupe and cancel

- Cache and query keys hold the method, the URL path and the serialized input (`QUERY_/planet/find-<input>-<query>`).
  Different inputs never share an entry. A `Date` and its ISO string are different keys. Files are compared by name,
  type and size.
- `$query` calls with the same input are deduplicated by default. `$mutation` calls are not.
- The abort key ignores the input, so `request.abort()` stops every running call of the procedure.
- `cancelable` cancels only a running call with the same query key. For search-as-you-type share the key:

```ts
const search = api.planet.search.$query.setCancelable(true).setDeduplicate(false).setQueryKey("planet-search");
```

## Options

Request `options` are `fetch` `RequestInit` fields (except `method`, `headers`, `body`, `signal`) plus `timeout`
(default 5000 ms, `0` disables it) and `queryMethod`:

```ts
const listPlanets = api.planet.list.$query.setOptions({ credentials: "include", timeout: 10000 });
```

`setOptions` replaces the whole options object. Query params are appended to the URL, and the `data` key is reserved.

## Pitfalls

| Symptom                                                 | Cause                                        | Fix                                                     |
| ------------------------------------------------------- | -------------------------------------------- | ------------------------------------------------------- |
| 404 for `/planet/find-by-id`                            | SDK kebab-cases names by default             | `createSdk(client, { camelCaseToKebabCase: false })`    |
| `Property 'code' does not exist on type 'Error \| ...'` | `error` also includes the global `Error`     | Narrow with `"defined" in error`                        |
| 405 `METHOD_NOT_SUPPORTED` with `queryMethod: "GET"`    | Procedure has no `.route({ method: "GET" })` | Add the route, or `setOptions({ queryMethod: "POST" })` |
| Custom class arrives as a plain object                  | Serializer missing on one side               | Same `customJsonSerializers` on server and adapter      |
| Event iterator procedure missing from `api`             | Not supported                                | Use `RPCLink` or `hyper-fetch-sockets` for streams      |
| `$query` and `$mutation` results don't share cache      | Method is part of the key                    | Read with `$query`, then invalidate or update it        |
| Runtime error importing the adapter                     | `@orpc/client` not installed                 | `npm install @orpc/client`                              |

## Testing

`request.setMock(() => ({ data, status: 200 }))` skips the network for any adapter. For wire-level tests run a real
`RPCHandler` on port `0`, or mock `POST {url}/planet/find` with msw answering `{ json: output }` (and an error status
with `{ json: errorJson }`). See the [testing guide](https://hyperfetch.bettertyped.com/docs/guides/testing).

## Links

- Docs: https://hyperfetch.bettertyped.com/docs/integrations/adapter-orpc/overview
- SDK: https://hyperfetch.bettertyped.com/docs/core/sdk
- Related skills: `hyper-fetch-core`, `hyper-fetch-react`, `hyper-fetch-trpc`.
