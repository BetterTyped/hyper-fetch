# SDK

`createSdk(client, options?)` returns a typed proxy that builds requests from property paths, tRPC-style. Types come
from a schema type you write (or generate with the `hyper-fetch-cli` skill); runtime requests come from the path.

## Schema

```ts
import { createClient, createSdk, type RequestModel } from "@hyper-fetch/core";

type User = { id: number; name: string };
type Post = { id: number; title: string };

export type ApiSchema = {
  users: {
    $get: RequestModel<{ response: User[]; queryParams?: { page?: number } | null; endpoint: "/users" }>;
    $post: RequestModel<{ response: User; payload: { name: string }; endpoint: "/users" }>;
    $userId: {
      $get: RequestModel<{ response: User; endpoint: "/users/:userId" }>;
      $delete: RequestModel<{ response: null; endpoint: "/users/:userId" }>;
      posts: {
        $get: RequestModel<{ response: Post[]; endpoint: "/users/:userId/posts" }>;
      };
    };
  };
  userProfiles: {
    $get: RequestModel<{ response: User[]; endpoint: "/user-profiles" }>;
  };
};

export const client = createClient({ url: "https://api.example.com" });
export const sdk = createSdk<typeof client, ApiSchema>(client);
```

Runtime mapping of a path:

| Access                         | Request                                                                   |
| ------------------------------ | ------------------------------------------------------------------------- |
| `sdk.users.$get`               | `GET /users`                                                              |
| `sdk.users.$post`              | `POST /users`                                                             |
| `sdk.users.$userId.$get`       | `GET /users/:userId` (`$name` in the middle of a path is a `:name` param) |
| `sdk.users.$userId.posts.$get` | `GET /users/:userId/posts`                                                |
| `sdk.userProfiles.$get`        | `GET /user-profiles` (camelCase segments become kebab-case by default)    |

- `$` + method name as the last key is the method, upper-cased by `methodTransform` (default
  `(method) => method.toUpperCase()`), so `$get`, `$post`, `$put`, `$patch`, `$delete`, `$query`.
- Options: `createSdk(client, { camelCaseToKebabCase: false, methodTransform, defaults })`.
- Types follow the schema's `endpoint` literal; nothing checks that it equals the path, so keep them identical.
- Use `RequestModel` for leaves: omitted `payload`/`queryParams` stay `undefined`, `error` is `Error` (the client's
  global error is still added), `response` is `unknown`. `RequestInstance` here would make omitted slots `any`.
- Optional query params in a `RequestModel` need `| null`: write `queryParams?: Q | null`. `RequestModel` strips
  `undefined` from the slot, so `queryParams?: Q` alone still makes `send()` require `{ queryParams }` (unlike
  `createRequest`, where `queryParams?: Q` is enough).
- The client is injected into every leaf type by `createSdk`, so the global error and adapter types apply.

## Using it

```ts
const { data } = await sdk.users.$get.send({ queryParams: { page: 2 } });
const user = await sdk.users.$userId.$get.send({ params: { userId: 1 } });
const getUser1 = sdk.users.$userId.$get.setParams({ userId: 1 }); // normal Request, every setter works
```

Every property access creates a **new** `Request`. Consequences:

- `setMock`, `$hooks` and `setOptimistic` results must be kept in a variable; accessing the path again gives a fresh
  request without them. Mock in tests like this:

```ts
const getUsers = sdk.users.$get;
getUsers.setMock(() => ({ data: [{ id: 1, name: "Ann" }], status: 200 }));
await getUsers.send();
```

- Cache, dedup and invalidation still work across instances because keys are derived from method, endpoint and params:
  `client.cache.invalidate(sdk.users.$get)` targets the same entry as any other `sdk.users.$get`.
- Define module-level constants for requests you configure heavily, or use `$configure`.

## $configure

```ts
import { createConfiguration, Time } from "@hyper-fetch/core";

export const api = sdk.$configure({
  "*": { retry: 1 }, // every request
  "/users/*": { cacheTime: Time.MIN * 10 }, // endpoint group: /users/... (and /users itself)
  "/user-profiles": { auth: true }, // exact endpoint, all methods
  "users.$userId.$delete": { cancelable: true }, // one method, by SDK path
  "users.$get": (request) => request.setStaleTime(Time.SEC * 30).setDeduplicate(true), // any setter
});

// Split per domain, keys are checked against the schema
const usersConfig = createConfiguration<ApiSchema>()({
  "users.$post": (request) => request.setRetry(0),
});
export const configuredApi = api.$configure(usersConfig);
```

- Order: `"*"` first, then endpoint keys (exact and `/*` wildcards), then dot-path keys; later wins.
- `$configure` returns a new SDK and merges with earlier configuration; the original `sdk` is unchanged.
- Object values support `headers`, `auth`, `cache`, `cacheTime`, `staleTime`, `retry`, `retryTime`, `cancelable`,
  `queued`, `offline`, `deduplicate`, `deduplicateTime`, `structuralSharing`. `headers` replaces the request headers.
- Function values receive the request and must return a request: mappers, mocks, optimistic, `setRetryOnError`,
  `setQueryKey`... Function values are typed loosely (`RequestInstance`), so mapper types are not reflected in `sdk.*`
  types; put type-changing response mappers on module-level requests instead when you need the mapped type.
- Invalid keys fail to compile: `"user.$get"` when the schema has `users`.
- Endpoint keys are typed only for leaves whose path has no `$param` segment (`"/users"`, `"/user-profiles"` and their
  `/*` wildcards). `"/users/:userId"` matches at runtime but is rejected by the types; target nested endpoints with a
  wildcard (`"/users/*"`) or dot-paths (`"users.$userId.$get"`).

## Generated SDKs

`npx @hyper-fetch/cli generate` (see `hyper-fetch-cli`) turns an OpenAPI document into the schema types plus a
`createSdk(client, options?)` wrapper. Use the generated function with your own client (interceptors, defaults) and
configure it with `$configure`. Regenerate instead of hand-editing generated files.

## Other SDK sources

- `@hyper-fetch/hono` derives a schema from a Hono app type (`hyper-fetch-hono`).
- `@hyper-fetch/elysia` derives a schema from an Elysia app type (`hyper-fetch-elysia`).
- tRPC and oRPC adapters provide their own typed clients (`hyper-fetch-trpc`, `hyper-fetch-orpc`).
- Socket SDKs live in `@hyper-fetch/sockets` (`hyper-fetch-sockets`).
