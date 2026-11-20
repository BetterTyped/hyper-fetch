# Glossary

Canonical HyperFetch terms. Use them exactly in code, types, tests, docs and messages. When a new concept appears, add
one line here in the same change.

## Requests

- **Client**: the central configuration object. Owns the adapter, cache, dispatchers and managers, and creates requests.
- **Request**: an immutable description of one endpoint call. Setters return a clone, except the mock setters.
- **SDK**: a typed proxy created with `createSdk(client)` that builds requests from property paths.
- **Adapter**: the pluggable transport that performs a request, for example the HTTP, Axios, GraphQL, oRPC or Firebase
  adapter.
- **Procedure**: a typed remote function of an RPC router such as oRPC. Its path is the endpoint and its input is the
  payload.
- **Response**: the object `send()` resolves with: `data`, `error`, `status`, `success`, `extra`, `requestTimestamp` and
  `responseTimestamp`.
- **Typed endpoint**: an endpoint that carries its response and payload types in the `__apiType` decoration, like a
  `TypedDocumentNode`. `createRequest` reads them when its generics leave them out.
- **Persisted query**: a GraphQL request that sends the SHA-256 hash of its query instead of the text
  (`persistedQueries`), and the full query only when the server does not know the hash yet.
- **Error policy**: what a GraphQL response with both `data` and `errors` resolves to (`errorPolicy`): a failure
  (`"none"`) or a success with partial data and the errors in `extra.errors` (`"all"`).
- **Mapper**: a function that transforms a request before sending or a response after receiving.
- **Mock**: a handler attached with `request.setMock()` that replaces the adapter for that request instance.
- **SDK schema**: the nested type `createSdk` reads, with `$method` keys holding a `Request`. `HonoAppToHyperFetch` in
  `@hyper-fetch/hono` derives one from a Hono app type, and `ElysiaAppToHyperFetch` in `@hyper-fetch/elysia` from an
  Elysia app type.

## Execution

- **Dispatcher**: runs requests from queues and applies concurrency, cancelation, deduplication and retries. A client
  has a `fetchDispatcher` and a `submitDispatcher`.
- **Queue**: the ordered requests a dispatcher holds under one `queryKey`.
- **Deduplication**: sharing one in-flight call between identical requests (`deduplicate`).
- **Cancelable**: a request that aborts the previous call with the same `queryKey` when sent again (`cancelable`).
- **Queued**: a request that runs one at a time in order (`queued`).
- **Offline**: a request kept in the queue and resumed when the connection returns (`offline`).

## Keys

- **`cacheKey`**: identifies a cached response.
- **`queryKey`**: identifies the dispatcher queue a request joins.
- **`abortKey`**: identifies the group of requests aborted together.

## Cache

- **Cache**: stores responses by `cacheKey`, with optional persistent storage.
- **`staleTime`**: how long cached data counts as fresh.
- **`cacheTime`**: how long cached data is kept before it is removed.
- **Invalidation**: marking cached data stale with `cache.invalidate()` so consumers refetch it.

## Managers and extensions

- **RequestManager**: emits request lifecycle events and tracks abort controllers.
- **AppManager**: tracks focus and online state.
- **LoggerManager**: creates the loggers used across a client.
- **Plugin**: hooks into the request, cache, dispatcher and adapter lifecycle.

## Realtime

- **Socket**: the realtime counterpart of Client, in `@hyper-fetch/sockets`.
- **Listener**: a typed subscription to a topic.
- **Emitter**: a typed event sender for a topic.
- **SocketAdapter**: the realtime transport, for example WebSocket or SSE.

## Tooling

- **HyperFlow**: the desktop devtools app in `packages/hyper-flow`.
