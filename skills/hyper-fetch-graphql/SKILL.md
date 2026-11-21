---
name: hyper-fetch-graphql
description:
  GraphQL adapter for HyperFetch (`@hyper-fetch/graphql`). Sends GraphQL queries and mutations over HTTP with the typed
  request, cache, deduplication, retries, offline and React hooks of `@hyper-fetch/core`. Use when the user installs or
  configures `@hyper-fetch/graphql`, imports `GraphqlAdapter`, `GraphqlMethod`, `ExtractGqlRouteParams` or
  `GraphQlExtraType`, writes `gql` / `graphql-tag` documents or `DocumentNode`s as a request `endpoint`, uses the
  `document` option for a URL path per operation, passes GraphQL variables as `payload`, sends queries with GET, reads
  `extensions`, handles the GraphQL `errors` array vs network or HTTP errors, wonders why partial data is null, caches
  operations per variables, types operations with GraphQL Code Generator or `TypedDocumentNode`, or calls GraphQL with
  `useFetch` / `useSubmit`.
---

# HyperFetch GraphQL adapter

`GraphqlAdapter()` replaces the HTTP transport of a `@hyper-fetch/core` client with a GraphQL-over-HTTP one. A request's
`endpoint` is the GraphQL document (a `gql` `DocumentNode` or a string), its `payload` is the variables object, and the
URL is `client.url`. The adapter POSTs `{ query, variables }` as JSON by default, parses `{ data, errors, extensions }`,
and installs cache, query and abort key mappers on the client so every set of variables is its own cache entry.

Everything else (requests, cache, retries, interceptors) is core: read `hyper-fetch-core`. For hooks read
`hyper-fetch-react`. Subscriptions are not handled by this adapter.

## Install and set up

```bash
npm install @hyper-fetch/core @hyper-fetch/graphql graphql-tag
```

`graphql` is a dependency of the adapter. `graphql-tag` gives you the `gql` tag.

```ts
import { createClient } from "@hyper-fetch/core";
import { GraphqlAdapter } from "@hyper-fetch/graphql";

export const client = createClient({ url: "https://api.example.com/graphql" }).setAdapter(GraphqlAdapter());
```

`GraphqlAdapter` is a factory: call it once per client. `setAdapter` also replaces the client's cache, query and abort
key mappers with GraphQL-aware ones.

## Golden rules

1. **Write documents with `gql`** (or pass them through `document`). An inline string literal in `endpoint` that
   contains `$id: ID!` makes TypeScript read `:` as a URL param, so `send()` then demands `params` and `queryParams`.
   Use `gql`, a variable typed `as string`, or the `document` option.
2. **Type every request**: `response` is the shape of `data`, `payload` is the variables. The adapter does not infer
   them from the document.
3. **Variables go in `payload`** (`send({ payload })`, `setPayload`). `params` and `queryParams` are for the URL, not
   for GraphQL.
4. **Treat `error` as a list.** GraphQL errors, network failures and aborts all arrive as arrays. Timeouts are the one
   exception, see Errors.
5. **A response with `errors` is a failure, even with partial data.** `data` is `null` then. Make fields nullable on the
   server or split the operation if you need partial results.
6. **Customize key mappers after `setAdapter`**, never before: the adapter overwrites them when it is set.
7. **Keep mutations on POST.** `GraphqlMethod.GET` is for queries that should be cacheable by browsers or CDNs.

## Core patterns

### Query with variables

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

const { data, error } = await getUser.send({ payload: { id: "1" } });
// or: await getUser.setPayload({ id: "1" }).send();
data?.user?.name;
```

### Mutation

```ts
export const createUser = client.createRequest<{
  response: { createUser: User };
  payload: { name: string };
}>()({
  endpoint: gql`
    mutation CreateUser($name: String!) {
      createUser(name: $name) {
        id
        name
      }
    }
  `,
});

const { data, error } = await createUser.send({ payload: { name: "Ann" } });
```

Queries and mutations are the same kind of request. The document decides what the server runs.

### React

```tsx
import { useFetch, useSubmit } from "@hyper-fetch/react";

const { data, loading, error } = useFetch(getUser.setPayload({ id }));

const { submit, submitting } = useSubmit(createUser);
await submit({ payload: { name: "Ann" } });
```

Changing `id` gives a new cache key, so `useFetch` fetches the new user and serves known ids from the cache.

### URL path per operation (`document`)

Gateways, WAF rules, APM and access logs often group traffic by URL. Put the document in `document` and a path in
`endpoint`, which is appended to `client.url` like with the HTTP adapter:

```ts
const getUserById = client.createRequest<{ response: { user: User }; payload: { id: string } }>()({
  endpoint: "/tenant/:tenantId/GetUser",
  document: gql`
    query GetUser($id: ID!) {
      user(id: $id) {
        id
        name
      }
    }
  `,
});

await getUserById.setParams({ tenantId: 7 }).send({ payload: { id: "1" } });
// POST {client.url}/tenant/7/GetUser  body: { query, variables: { id: "1" } }
```

The path is part of the cache key, so the same operation sent to two paths is cached separately. `document` exists only
on clients that use `GraphqlAdapter`.

### Query params and GET

```ts
import { GraphqlMethod } from "@hyper-fetch/graphql";

const listUsers = client.createRequest<{ response: { users: User[] }; queryParams: { source: string } }>()({
  endpoint: gql`
    query ListUsers {
      users {
        id
        name
      }
    }
  `,
  method: GraphqlMethod.GET,
});

await listUsers.setQueryParams({ source: "app" }).send();
// GET {client.url}?query=...&variables=...&source=app
```

With POST, query params go into the URL and `{ query, variables }` into the body. With GET everything goes into the
query string, and `query` / `variables` win over a query param with the same key. Change the encoding with
`GraphqlAdapter().setQueryParamsMapperConfig({ ...stringifyDefaultOptions, arrayFormat: "comma" })` (spread the
defaults, the config replaces them).

## Type safety

The adapter types the transport, you type the operation. `setAdapter(GraphqlAdapter())` gives the client
`GraphqlAdapterType`, which fixes: `endpoint: string | DocumentNode`, the extra `document?: string | DocumentNode`
field, `method: GraphqlMethod` (the enum, not the string `"GET"`), `options: FetchGraphqlAdapterOptionsType` (fetch init
without `method`/`headers`/`body`/`signal`, plus `timeout`) and `extra: GraphQlExtraType` (`{ headers, extensions }`).
`response` (the `data` shape) and `payload` (the variables) are **not** inferred from the document. Declare them, or
derive them from codegen types:

```ts
import type { TypedDocumentNode } from "@graphql-typed-document-node/core";

/** Codegen types operations without variables as `{ [key: string]: never }` */
type OperationPayload<Variables> = string extends keyof Variables ? undefined : Variables;

export const createOperation = <Result, Variables>(document: TypedDocumentNode<Result, Variables>) =>
  client.createRequest<{ response: Result; payload: OperationPayload<Variables> }>()({ endpoint: document });

const getUserOp = createOperation(GetUserDocument); // data and variables typed from codegen
await getUserOp.send({ payload: { id: "1" } });
// @ts-expect-error variables come from the document type
await getUserOp.send({ payload: { id: 1 } });
```

```ts
const untyped = client.createRequest()({ endpoint: GetUserDocument }); // data is `undefined | null`, nothing inferred
// @ts-expect-error use the GraphqlMethod enum
client.createRequest()({ endpoint: GetUserDocument, method: "GET" });
```

Read [references/type-safety.md](references/type-safety.md) when you need typed operations without codegen
(`ExtractGqlRouteParams`), error typing, `@ts-expect-error` cases, or the patterns that lose inference.

## Errors

`send()` resolves. Check `success` or `error`, not exceptions.

| Server or transport result                     | `success` | `data` | `error`                         | `status` |
| ---------------------------------------------- | --------- | ------ | ------------------------------- | -------- |
| `{ data }` (or `errors: []`)                   | `true`    | `data` | `null`                          | HTTP     |
| `{ data: null, errors: [...] }` with 200       | `false`   | `null` | the `errors` array              | 200      |
| `{ data: {...}, errors: [...] }` (partial)     | `false`   | `null` | the `errors` array              | 200      |
| 4xx / 5xx with `{ errors }`                    | `false`   | `null` | the `errors` array              | HTTP     |
| 4xx / 5xx with HTML, empty or non-GraphQL body | `false`   | `null` | `[UnexpectedError]`             | HTTP     |
| Network failure                                | `false`   | `null` | `[TypeError]` (the fetch error) | `0`      |
| `request.abort()`                              | `false`   | `null` | `[abort Error]`                 | `0`      |
| `options.timeout` reached (default 5000 ms)    | `false`   | `null` | timeout `Error`, **not a list** | `0`      |

`extra` is `{ headers, extensions }`. `extensions` (cost, tracing) is `{}` when the server sends none.

Declare the error shape once on the client and normalize the timeout case:

```ts
type GraphQlError = { message: string; path?: (string | number)[]; extensions?: Record<string, unknown> };

export const gqlClient = createClient<{ error: GraphQlError[] | Error }>({
  url: "https://api.example.com/graphql",
}).setAdapter(GraphqlAdapter());

const toErrorList = (error: GraphQlError[] | Error | null): { message: string }[] =>
  error === null ? [] : Array.isArray(error) ? error : [error];
```

## Caching and request identity

- Cache and query keys are `METHOD_OperationName-params-queryParams-variables`, for example `POST_GetUsers--` for a
  document without variables. Different variables mean a different cache entry and no deduplication between them.
- The operation name comes from the operation name, then the first field, then `graphql-request`. Name your operations
  so devtools and keys stay readable.
- The abort key ignores variables, so `request.abort()` stops every running call of that operation.
- An explicit `setCacheKey("my-key")` wins and makes every variable set share one entry.
- Deduplication is off by default (unlike `GET` with the HTTP adapter). Turn it on per request with `deduplicate: true`.
- Outside browsers the client defaults to `"server"` mode, which caches only scoped requests (SSR safety, see
  `hyper-fetch-core`). Node tests that read the cache need `createClient({ url, mode: "client" })`.

## Options

Adapter options are `fetch` `RequestInit` fields except `method`, `headers`, `body` and `signal`, plus `timeout`:

```ts
const me = client.createRequest<{ response: { me: User } }>()({
  endpoint: gql`
    query Me {
      me {
        id
        name
      }
    }
  `,
  options: { credentials: "include", timeout: 10000 },
});
```

Set headers with request `headers` / `setHeaders` or `client.onAuth`, as with any adapter.

## Pitfalls

| Symptom                                                  | Cause                                        | Fix                                           |
| -------------------------------------------------------- | -------------------------------------------- | --------------------------------------------- |
| `send()` demands `params` with a key like `" ID!) {..."` | String literal document in `endpoint`        | `gql`, `as string`, or the `document` option  |
| Partial `data` is `null`                                 | Any `errors` entry makes the response fail   | Read `error`, adjust the schema or operation  |
| `error.map` crashes on timeout                           | Timeout error is a single `Error`            | Normalize with `Array.isArray`                |
| Custom `setCacheKeyMapper` has no effect                 | Called before `setAdapter(GraphqlAdapter())` | Call it after `setAdapter`                    |
| `document` is rejected by TypeScript                     | Client uses another adapter                  | `setAdapter(GraphqlAdapter())` on that client |
| Server returns 405 or rejects a mutation                 | Mutation sent with `GraphqlMethod.GET`       | Keep mutations on POST                        |
| Cache is empty in Node tests                             | Client defaults to `"server"` mode           | `createClient({ url, mode: "client" })`       |

## Testing

`request.setMock(...)` skips the network. To exercise the real adapter, mock the operation with MSW:
`graphql.query("GetUser", () => HttpResponse.json({ data: { user } }))` from `msw`, served by `setupServer` from
`msw/node`. Name your operations so handlers can match them. See `hyper-fetch-testing`.

## Links

- Docs: https://hyperfetch.bettertyped.com/docs/integrations/adapter-graphql/overview
- Queries: https://hyperfetch.bettertyped.com/docs/integrations/adapter-graphql/queries
- Mutations: https://hyperfetch.bettertyped.com/docs/integrations/adapter-graphql/mutations
- Related skills: `hyper-fetch-core`, `hyper-fetch-react`, `hyper-fetch-testing`.
