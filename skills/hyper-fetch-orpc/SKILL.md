---
name: hyper-fetch-orpc
description:
  oRPC adapter for HyperFetch (`@hyper-fetch/orpc`). Calls oRPC procedures with the RPC protocol of `RPCHandler`, typed
  from the router or a contract through the regular `createSdk` of `@hyper-fetch/core`, with HyperFetch caching,
  deduplication, queueing, retries, offline support and React hooks. Event iterator procedures become typed socket
  listeners over HTTP event streams or a WebSocket. Use when the user installs or configures `@hyper-fetch/orpc`,
  imports `OrpcAdapter`, `OrpcSchema`, `OrpcMethods`, `OrpcErrorType`, `OrpcQueryMethod`, `OrpcStreamAdapter`,
  `OrpcWebsocketAdapter`, `OrpcSocketSchema` or `OrpcSocketError`, writes `createSdk<typeof client, OrpcSchema<typeof
  router>>`, `OrpcSchema<ContractRouterClient<typeof contract>>` or `createSocketSdk<typeof socket,
  OrpcSocketSchema<typeof router>>`, calls `api.planet.find.$query` / `$mutation` or `sdk.planet.onUpdate.$listener`,
  uses oRPC with `useFetch` / `useSubmit` / `useListener`, sends queries with GET (`queryMethod`), uploads files, keeps
  `Date` / `BigInt` / `Map` / `Set` types, sets `customJsonSerializers`, narrows `ORPCError` codes from `.errors()`,
  resumes streams with `withEventMeta` and `lastEventId`, or asks about oRPC batching, event iterators, async generator
  procedures, or replacing `RPCLink` / `@orpc/tanstack-query` with HyperFetch.
---

# HyperFetch oRPC adapter

`OrpcAdapter()` is a `@hyper-fetch/core` adapter that speaks the oRPC RPC protocol (the format `RPCHandler` and
`RPCLink` use). Its methods are `QUERY` and `MUTATION`, its endpoint is the procedure path (`planet/find`), and the
payload is the procedure input, encoded with the official oRPC serializer from `@orpc/client`. Typing is a type helper,
not a new client: `OrpcSchema<typeof router>` goes into the regular `createSdk`, and every procedure becomes a normal
HyperFetch `Request` under both `$query` and `$mutation`.

Procedures that return an event iterator go through a `Socket` of `@hyper-fetch/sockets` instead: `OrpcStreamAdapter()`
(HTTP event streams) or `OrpcWebsocketAdapter()` (one WebSocket) plus the `OrpcSocketSchema<typeof router>` helper for
`createSocketSdk` turn each one into a typed `$listener` (see Event iterators).

Read `hyper-fetch-core` for requests, cache and the SDK, `hyper-fetch-react` for hooks and `hyper-fetch-sockets` for
sockets and listeners.

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
8. **No batching.** One call is one HTTP request.
9. **Event iterators live on a `Socket`, not on the client.** They are left out of `OrpcSchema` and come from
   `createSocketSdk` with `OrpcSocketSchema`. Pass `{ camelCaseToKebabCase: false }` there too, and the same
   `customJsonSerializers` to the socket adapter.

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

### Event iterators

`OrpcStreamAdapter()` calls the procedure like the `RPCLink` of `@orpc/client/fetch` (a `POST` answered with
`text/event-stream`), so the HTTP `RPCHandler` that serves your queries serves it too. `OrpcWebsocketAdapter()` speaks
the `RPCHandler` of `@orpc/server/ws` and puts every subscription on one connection. Install `@hyper-fetch/sockets`.

```ts
// server
export const router = {
  planet: {
    onUpdate: os.input(z.object({ id: z.number() })).handler(async function* ({ input, signal, lastEventId }) {
      for await (const planet of publisher.subscribe(`planet/${input.id}`, { signal })) {
        yield withEventMeta(planet, { id: String(planet.version) });
      }
    }),
  },
};
```

```ts
// client/live.ts
import { Socket, createSocketSdk } from "@hyper-fetch/sockets";
import { OrpcStreamAdapter } from "@hyper-fetch/orpc";
import type { OrpcSocketSchema } from "@hyper-fetch/orpc";

import type { router } from "../server/router";

// Or: new Socket({ url: "ws://localhost:3000", adapter: OrpcWebsocketAdapter() })
export const socket = new Socket({ url: "http://localhost:3000/rpc", adapter: OrpcStreamAdapter() });

export const live = createSocketSdk<typeof socket, OrpcSocketSchema<typeof router>>(socket, {
  camelCaseToKebabCase: false,
});

const stop = live.planet.onUpdate.$listener.setPayload({ id: 1 }).listen(({ data, extra }) => {
  data; // the yielded planet, rich types kept
  extra.id; // "42", the id set with withEventMeta
  extra.retry; // the retry delay in ms, when the server set one
});
```

- The input is the listener payload (`setPayload()` or `listen(cb, { payload })`). The topic is the procedure path,
  `planet/onUpdate`. Regular procedures are not in the schema, and `emit()` on these sockets throws.
- Listeners with the same topic and payload share one server subscription, and the last one to leave cancels it.
  Payloads are compared in the oRPC wire format, so `{ at: new Date(0) }` and `{ at: new Date(1) }` differ.
- When a subscription starts again (a reconnect, a failed stream, coming back online) the adapter sends the last event
  id as `last-event-id`, and oRPC passes it to the handler as `lastEventId`. Read it to send what was missed.
- Stream adapter: every subscription is its own request. A failed stream restarts after the last event's `retry`, or the
  socket's `reconnectTime`, and a response slower than `connectionTimeout` is aborted and retried. After the socket's
  `reconnect` attempts the subscription ends with an error.
- Contract-first: `OrpcSocketSchema<ContractRouterClient<typeof contract>>`.

Lifecycle and errors:

```ts
import { OrpcSocketError } from "@hyper-fetch/orpc";

live.planet.onUpdate.$listener.setPayload({ id: 1 }).listen(onPlanet, {
  onStart: ({ topic }) => {}, // the server answered with the iterator, again after every restart
  onEnd: ({ topic, error }) => {}, // the iterator finished (error null) or failed
});

socket.onError(({ error }) => {
  if (error instanceof OrpcSocketError && error.defined && error.code === "UNAUTHORIZED") {
    error.topic; // "planet/onUpdate"
    error.payload; // { id: 1 }
    error.data; // the data of the defined error (unknown here, cast it to your .errors() shape)
  }
});
```

`OrpcSocketError` has `topic`, `payload`, `shape` (the `ORPCError` JSON, or `null` for network, timeout and protocol
failures), `defined`, `code`, `status`, `data` and the original `cause`. A recovered failure (a dropped connection that
reconnects) is reported but does not end the subscription. An ended one is never restarted by a reconnect: call
`listen()` again. In React, `useListener(live.planet.onUpdate.$listener.setPayload({ id }))` returns `data`, `extra` and
`status` (`"starting"`, `"listening"`, `"ended"`, `"failed"` with `error`).

Options go in the socket's `adapterOptions` (or per attempt in `socket.onConnect`, e.g. a fresh token): `autoConnect`
and `headers` for both, `fetch` and `fetchOptions` for the stream adapter, `WebSocket` and `protocols` for the WebSocket
adapter. `customJsonSerializers` goes to the adapter factory: `OrpcStreamAdapter({ customJsonSerializers })`. Inputs
with files are not supported over WebSocket, and client streaming (an event iterator as input) is not supported.

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
| endpoint     | `"/planet/find"` (names exactly as written); event iterators omitted (see `OrpcSocketSchema`)                    |

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
| Event iterator procedure missing from `api`             | `OrpcSchema` omits event iterators           | `createSocketSdk` with `OrpcSocketSchema`               |
| Stream ends, a reconnect does not bring it back         | Ended subscriptions are never restarted      | Call `listen()` again                                   |
| Events missed while the stream was down                 | Handler ignores `lastEventId`                | Yield `withEventMeta(value, { id })` and resume from it |
| `$query` and `$mutation` results don't share cache      | Method is part of the key                    | Read with `$query`, then invalidate or update it        |
| Runtime error importing the adapter                     | `@orpc/client` not installed                 | `npm install @orpc/client`                              |

## Testing

`request.setMock(() => ({ data, status: 200 }))` skips the network for any adapter. For wire-level tests run a real
`RPCHandler` on port `0`, or mock `POST {url}/planet/find` with msw answering `{ json: output }` (and an error status
with `{ json: errorJson }`). See `hyper-fetch-testing`.

## Links

- Docs: https://hyperfetch.bettertyped.com/docs/integrations/adapter-orpc/overview
- Event iterators: https://hyperfetch.bettertyped.com/docs/integrations/adapter-orpc/event-iterators
- SDK: https://hyperfetch.bettertyped.com/docs/core/sdk
- Related skills: `hyper-fetch-core`, `hyper-fetch-react`, `hyper-fetch-sockets`, `hyper-fetch-trpc`,
  `hyper-fetch-testing`.
