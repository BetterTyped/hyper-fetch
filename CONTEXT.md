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
- **SDK schema**: the nested type `createSdk` reads, with `$method` keys holding a `Request`. `HonoSchema` in
  `@hyper-fetch/hono` derives one from a Hono app type, and `ElysiaSchema` in `@hyper-fetch/elysia` from an
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
- **Subscription payload**: data a Listener sends to start a server-side subscription, set with `setPayload`, for
  example a tRPC subscription input or the variables of a GraphQL subscription. Listeners of one topic with different payloads are separate subscriptions.
- **Subscription**: one server-side stream started for a topic and a payload, such as a tRPC subscription procedure, a
  GraphQL subscription or an oRPC event iterator. Listeners with an equal payload share it; the last one to stop ends it on the server. Adapters
  with `confirmsSubscriptions` report when the server started it and when it ended it, finished or failed.
- **Event id**: the id of a subscription event (`tracked()` in tRPC, `withEventMeta` in oRPC, `id:` in SSE), sent back
  when a subscription restarts so the server can resume after it.
- **Typed document**: a GraphQL document decorated with its result and variables types through `__apiType`, as
  graphql-codegen (`TypedDocumentNode`) and gql.tada make them. As a request `endpoint` or a listener `document` option it
  types the response and the payload without generics.
- **graphql-transport-ws**: the GraphQL over WebSocket protocol of the `graphql-ws` library, spoken by
  `GraphqlWsAdapter`. A connection is ready once the server acknowledged `connection_init`.
- **Emitter**: a typed event sender for a topic.
- **SocketAdapter**: the realtime transport, for example WebSocket or SSE.
- **Reconnection engine**: `createReconnectingConnection`, the connection lifecycle every socket adapter shares - attempts,
  the connection timeout, backoff with jitter, the retry policy and the network and focus signals. Adapters only open
  transports and report them `ready`, `lost` or `interrupted`.
- **Outage**: the reconnection attempts between losing a connection and having one that stayed up for `minUptime`.
  `reconnect` limits the attempts of one outage, `reconnectDelay` receives the attempt number and time within it.

## Database (proposed, `@hyper-fetch/db`, see ADR 0002)

- **Collection**: a typed set of complete rows defined by a schema and a key, the source of truth for data read through
  the db. Components query it directly, as in `db.post.where(...)`.
- **Loader**: a request a collection loads complete rows through, with the filters it can send and how its response maps
  to rows.
- **Sync**: a listener whose `insert`, `update` or `delete` events change collection rows within the filters it covers.
  A changes sync (`syncChanges`) reads several changes from one event, such as a Firestore snapshot.
- **Ingest**: writing the rows of another request's response into a collection, without making it a loader.
- **Link**: two collections declared to hold the same records in different shapes, such as `post` and `postSummary`. A
  write or optimistic change to one changes the fields the other has.
- **Normalize**: writing the rows nested in a collection's rows into another collection, such as a post's author into
  `user`.
- **Join**: adding to each query result the row of another collection whose key a field holds, as a left join.
- **Notation**: how a loader or sync sends operators to its backend, such as `likes_gt=10` or a Firestore `where`.
- **Server-only operator**: an operator such as `op("search", ...)` that the loader must send and the client never
  evaluates.
- **Infinite query**: a window over an ordered query, widened page by page with `fetchNextPage`, from `query.infinite()`
  or `useLiveInfiniteQuery`.
- **Transaction**: writes grouped into one optimistic layer with `db.transaction`. A named transaction sends them
  through one `mutationFn` declared in `createDb`.
- **Dehydrated state**: the server rows and loaded subsets `db.dehydrate()` returns for server rendering, passed back as
  `createDb(collections, { state })`.
- **Plan**: how the db serves a query: answered from held rows, or through a loader, with the syncs that keep it live.
  `query.explain()` returns it.
- **Operator**: a helper such as `eq` or `gt` that builds a filter expression. Loaders map it to their backend's
  notation, and the db evaluates it on the rows it holds.
- **Live query**: a query over a collection whose result stays current as the collection changes.
- **Loaded subset**: the rows one loader returned for one filter, order and range. It owns those rows until released.
- **Outbox**: the persisted, ordered transactions written offline and replayed when the connection returns.

## Tooling

- **HyperFlow**: the desktop devtools app in `packages/hyper-flow`.
- **DevtoolsPlugin**: the plugin in `@hyper-fetch/plugin-devtools` that streams a client's events to HyperFlow and
  applies the changes HyperFlow sends back.
- **Mirror client**: the client HyperFlow keeps for each connected application. It replays that application's events and
  presents them with the application's adapter, but never sends requests.
- **Observer**: a subscription of the user's application to a `cacheKey`'s data or a `queryKey`'s loading state or
  queue, one for each mounted `useFetch`, `useSubmit`, `useCache` or `useQueue`. The mirror client has none, so
  DevtoolsPlugin reports their counts to HyperFlow.
