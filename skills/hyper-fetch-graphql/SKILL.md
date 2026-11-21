---
name: hyper-fetch-graphql
description:
  GraphQL for HyperFetch (`@hyper-fetch/graphql`). `GraphqlAdapter` sends queries and mutations over HTTP with the typed
  request, cache, deduplication, retries, offline and React hooks of `@hyper-fetch/core`; `GraphqlWsAdapter` listens to
  subscriptions over WebSocket (`graphql-transport-ws`, the `graphql-ws` protocol) through `@hyper-fetch/sockets`. Use
  when the user installs or configures `@hyper-fetch/graphql`, imports `GraphqlAdapter`, `GraphqlWsAdapter`,
  `GraphqlMethod`, `GraphqlDocumentTypes`, `GraphqlErrorType`, `GraphqlSubscriptionError`, `matchGqlOperation` or
  `shouldReconnectGraphqlWs`, writes `gql` / `graphql-tag` documents or typed documents from GraphQL Code Generator or
  gql.tada, passes variables as `payload`, sets `errorPolicy` or `persistedQueries`, handles the GraphQL `errors` array
  or partial data, invalidates queries after a mutation, uses the `document` option, writes GraphQL subscriptions,
  `connectionParams` or keep-alive, or calls GraphQL with `useFetch` / `useSubmit` / `useListener`.
---

# HyperFetch GraphQL

`GraphqlAdapter()` replaces the HTTP transport of a `@hyper-fetch/core` client with GraphQL over HTTP. A request's
`endpoint` is the document (a `gql` `DocumentNode`, a typed document or a string), its `payload` is the variables, and
the URL is `client.url`. It POSTs `{ query, operationName, variables }` as JSON by default and installs cache, query and
abort key mappers, so every operation and set of variables is its own cache entry.

`GraphqlWsAdapter()` is a `@hyper-fetch/sockets` adapter for subscriptions. A listener's `document` option is the
subscription, its payload the variables. See [Subscriptions](#subscriptions) and
[references/subscriptions.md](references/subscriptions.md).

Everything else (requests, cache, retries, interceptors) is core: read `hyper-fetch-core`. For hooks read
`hyper-fetch-react`, for sockets `hyper-fetch-sockets`.

## Install and set up

```bash
npm install @hyper-fetch/core @hyper-fetch/sockets @hyper-fetch/graphql graphql graphql-tag
```

`graphql` is a peer dependency. `graphql-tag` gives you the `gql` tag. `@hyper-fetch/sockets` is a peer dependency too,
needed for subscriptions.

```ts
import { createClient } from "@hyper-fetch/core";
import { GraphqlAdapter } from "@hyper-fetch/graphql";

export const client = createClient({ url: "https://api.example.com/graphql" }).setAdapter(GraphqlAdapter());
```

`GraphqlAdapter` is a factory: call it once per client. `setAdapter` also replaces the client's cache, query and abort
key mappers with GraphQL-aware ones.

## Golden rules

1. **Use typed documents** (GraphQL Code Generator `TypedDocumentNode`, gql.tada). As the `endpoint` they type the
   `response` and the `payload` without generics. Plain `gql` documents need the generics.
2. **Variables go in `payload`** (`send({ payload })`, `setPayload`). `params` and `queryParams` are for the URL.
3. **Treat `error` as a list.** GraphQL errors, network failures, aborts and timeouts all arrive as arrays.
4. **Partial data fails by default.** A response with `errors` fails unless `options: { errorPolicy: "all" }`, which
   keeps the partial `data` and puts the errors in `extra.errors`.
5. **Invalidate with `matchGqlOperation`** after a mutation, so active queries of an operation refetch.
6. **Customize key mappers after `setAdapter`**, never before: the adapter overwrites them when it is set.
7. **Keep mutations on POST.** `GraphqlMethod.GET` is for queries that should be cacheable by browsers or CDNs.
8. **Write string documents with `gql` or the `document` option.** An inline string literal in `endpoint` that
   contains `$id: ID!` makes TypeScript read `:` as a URL param.

## Core patterns

### Typed documents

```ts
import { GetUserDocument, UpdateUserDocument } from "./gql/graphql"; // generated

const getUser = client.createRequest()({ endpoint: GetUserDocument });

const { data, error } = await getUser.send({ payload: { id: "1" } });
data?.user?.name; // typed from GetUserQuery

// @ts-expect-error the variables come from the document
await getUser.send({ payload: { id: 1 } });
```

- A document without variables needs no payload.
- Declared generics win: `createRequest<{ response: Custom }>()({ endpoint: GetUserDocument })`.
- With the `document` option or extra types, use `GraphqlDocumentTypes`:
  `createRequest<GraphqlDocumentTypes<typeof GetUserDocument> & { queryParams: Q }>()`.

### Plain documents

```ts
import gql from "graphql-tag";

type User = { id: string; name: string };

export const getUser = client.createRequest<{ response: { user: User | null }; payload: { id: string } }>()({
  endpoint: gql`
    query GetUser($id: ID!) {
      user(id: $id) {
        id
        name
      }
    }
  `,
});
```

Queries and mutations are the same kind of request. The document decides what the server runs.

### React

```tsx
import { useFetch, useSubmit } from "@hyper-fetch/react";

const { data, loading, error } = useFetch(getUser.setPayload({ id }));

const { submit, submitting } = useSubmit(updateUser);
await submit({ payload: { id, name: "Ann" } });
```

Changing `id` gives a new cache key, so `useFetch` fetches the new user and serves known ids from the cache.

### Refetch after a mutation

```ts
import { matchGqlOperation } from "@hyper-fetch/graphql";

await updateUser.send({ payload: { id: "1", name: "Ann" } });
client.cache.invalidate(matchGqlOperation(GetUserDocument));
```

`matchGqlOperation(document | request)` matches every cache key of the operation, with any variables. Documents with the
same operation name but other selections are other operations.

### URL path per operation (`document`)

Put the document in `document` and a path in `endpoint`, which is appended to `client.url` like with the HTTP adapter:

```ts
const getUserById = client.createRequest<GraphqlDocumentTypes<typeof GetUserDocument>>()({
  endpoint: "/tenant/:tenantId/GetUser",
  document: GetUserDocument,
});

await getUserById.setParams({ tenantId: 7 }).send({ payload: { id: "1" } });
// POST {client.url}/tenant/7/GetUser
```

The path is part of the cache key. `document` exists only on clients that use `GraphqlAdapter`.

### Query params and GET

```ts
import { GraphqlMethod } from "@hyper-fetch/graphql";

const listUsers = client.createRequest<{ response: { users: User[] }; queryParams: { source: string } }>()({
  endpoint: ListUsersDocument,
  method: GraphqlMethod.GET,
});

await listUsers.setQueryParams({ source: "app" }).send();
// GET {client.url}?query=...&operationName=ListUsers&source=app
```

With POST, query params go into the URL and the operation into the body. With GET everything goes into the query
string, and `query`, `operationName`, `variables` and `extensions` win over a query param with the same key. A GET
request sends no `Content-Type`, so it needs no CORS preflight.

### Persisted queries

```ts
const getUser = client.createRequest()({ endpoint: GetUserDocument, options: { persistedQueries: true } });
```

Automatic persisted queries: the SHA-256 hash is sent instead of the query, and the full query only when the server
answers `PersistedQueryNotFound`. Without Web Crypto (`crypto.subtle`) the full query is sent.

## Errors

`send()` resolves. Check `success` or `error`, not exceptions.

| Server or transport result                     | `success` | `data`  | `error`              |
| ---------------------------------------------- | --------- | ------- | -------------------- |
| `{ data }` (or `errors: []`)                   | `true`    | `data`  | `null`               |
| `{ data: null, errors: [...] }`                | `false`   | `null`  | the `errors` array   |
| `{ data: {...}, errors: [...] }`, default      | `false`   | `null`  | the `errors` array   |
| `{ data: {...}, errors: [...] }`, `"all"`      | `true`    | partial | `null`, errors in `extra.errors` |
| 4xx / 5xx with `{ errors }`                    | `false`   | `null`  | the `errors` array   |
| 4xx / 5xx with HTML, empty or non-GraphQL body | `false`   | `null`  | `[UnexpectedError]`  |
| Network failure, abort or timeout              | `false`   | `null`  | `[Error]`            |

Type it once on the client with `GraphqlErrorType` (`(GraphQLFormattedError | Error)[]`):

```ts
import type { GraphqlErrorType } from "@hyper-fetch/graphql";

export const client = createClient<{ error: GraphqlErrorType }>({ url }).setAdapter(GraphqlAdapter());
```

`extra` is `{ headers, extensions, errors? }`. `extensions` is `{}` when the server sends none.

## Caching and request identity

- Cache and query keys are `METHOD_OperationName@fingerprint-params-queryParams-variables`. The fingerprint is a hash
  of the document text, so two documents with one operation name but other selections never share an entry.
- Different variables mean a different cache entry and no deduplication between them.
- The name comes from the operation name, then the first field, then `graphql-request`. Name your operations.
- The abort key ignores variables, so `request.abort()` stops every running call of that operation.
- An explicit `setCacheKey("my-key")` wins and makes every variable set share one entry.
- Deduplication is off by default. Turn it on per request with `deduplicate: true`.
- Outside browsers the client defaults to `"server"` mode, which caches only scoped requests (see `hyper-fetch-core`).

## Options

Adapter options are `fetch` `RequestInit` fields except `method`, `headers`, `body` and `signal`, plus:

| Option             | Default  | Meaning                                                |
| ------------------ | -------- | ------------------------------------------------------ |
| `timeout`          | `5000`   | ms until the request fails with a timeout error        |
| `errorPolicy`      | `"none"` | `"all"` keeps partial data, errors in `extra.errors`   |
| `persistedQueries` | `false`  | automatic persisted queries (SHA-256 hash first)       |

Set headers with request `headers` / `setHeaders` or `client.onAuth`, as with any adapter.

## Subscriptions

```ts
import { Socket } from "@hyper-fetch/sockets";
import { GraphqlWsAdapter } from "@hyper-fetch/graphql";

export const socket = new Socket({
  url: "wss://api.example.com/graphql",
  adapter: GraphqlWsAdapter(),
  adapterOptions: { connectionParams: async () => ({ token: await getToken() }) },
});

export const onMessage = socket.createListener()({ topic: "OnMessage", options: { document: OnMessageDocument } });

const stop = onMessage.setPayload({ room: "general" }).listen(({ data, extra }) => {
  data.onMessage.text; // typed from the document
  extra.errors; // errors of this event, the subscription keeps running
});
```

- Speaks `graphql-transport-ws` (Apollo Server, Yoga, Mercurius, Hot Chocolate, Hasura). The legacy
  `subscriptions-transport-ws` protocol is not supported.
- A typed `document` types the data and the variables. Without `document`, the `topic` is sent as the document.
- Listeners with the same document and variables share one server subscription.
- The connection is open once the server acknowledged `connection_init`; `connectionTimeout` covers it. A function
  `connectionParams` runs on every attempt.
- A lost connection reconnects with backoff and sends every subscription again. Close codes a retry can't fix (4400,
  4401, 4004, 4005, 4406, 4409, 4429, 4500) and 1000 stay closed; use `shouldReconnectGraphqlWs` inside your own
  `shouldReconnect` to keep these rules.
- The server's `error` message ends the listener with a `GraphqlSubscriptionError` (`errors`, `topic`, `payload`).
- `useListener` gives `data`, `status` (`"starting"`, `"listening"`, `"ended"`, `"failed"`), `error` and `listen()`.
- Queries and mutations stay on the `GraphqlAdapter`; `emit()` throws.

Read [references/subscriptions.md](references/subscriptions.md) for `lazy`, `keepAlive`, the lifecycle and every close
code.

## Testing

Mock a request with `request.setMock(...)`, which skips the network and returns the response you give. It changes the
request instance, `clearMock()` removes it.

```ts
getUser.setMock(() => ({ data: { user: { id: "1", name: "Ann" } }, status: 200 }));
```

## Pitfalls

| Symptom                                                  | Cause                                        | Fix                                             |
| -------------------------------------------------------- | -------------------------------------------- | ----------------------------------------------- |
| `send()` demands `params` with a key like `" ID!) {..."` | String literal document in `endpoint`        | `gql`, `as string`, or the `document` option    |
| Partial `data` is `null`                                 | `errorPolicy` defaults to `"none"`           | `options: { errorPolicy: "all" }`               |
| `data` is `undefined \| null` in the types               | Plain `gql` document, no generics            | Typed document or a `response` generic          |
| Custom `setCacheKeyMapper` has no effect                 | Called before `setAdapter(GraphqlAdapter())` | Call it after `setAdapter`                      |
| `document` is rejected by TypeScript                     | Client uses another adapter                  | `setAdapter(GraphqlAdapter())` on that client   |
| Server returns 405 or rejects a mutation                 | Mutation sent with `GraphqlMethod.GET`       | Keep mutations on POST                          |
| Subscription never starts, socket stays connecting       | Server does not speak `graphql-transport-ws` | Use a `graphql-ws` server, or fix the endpoint  |
| Subscriptions stop after an expired token                | Server closed with 4401, which is fatal      | Fresh `connectionParams` + `shouldReconnect`    |

## Links

- Docs: https://hyperfetch.bettertyped.com/docs/integrations/adapter-graphql/overview
- Subscriptions: https://hyperfetch.bettertyped.com/docs/integrations/adapter-graphql/subscriptions
- Related skills: `hyper-fetch-core`, `hyper-fetch-react`, `hyper-fetch-sockets`.
