---
name: hyper-fetch-elysia
description:
  Elysia integration for HyperFetch (`@hyper-fetch/elysia`). A types-only package whose `ElysiaAppToHyperFetch<typeof
  app>` turns an Elysia app type into a schema for `createSdk` from `@hyper-fetch/core`, so the frontend calls a Bun or
  Node Elysia backend with responses, per-status errors, `t.Object` body and query schemas and `:param` URL params typed
  from the routes, without codegen or Eden. Use when the user installs `@hyper-fetch/elysia`, imports
  `ElysiaAppToHyperFetch`, wants end-to-end type safety between an Elysia backend and a HyperFetch or React frontend,
  writes `createSdk<typeof client, AppSchema>`, calls `sdk.users.$userId.$get`, maps `prefix`, `.group()`, `.guard()`,
  `.model()`, macros, `status(404, ...)` or optional `:id?` params to typed requests, types the `422` validation error,
  uploads `t.File()` bodies as FormData, sends array query params, reads `sse()` streams, replaces Eden Treaty with
  HyperFetch, or hits a missing route, a `422`, a `""` or an `unknown` response.
---

# HyperFetch Elysia integration

`@hyper-fetch/elysia` exports a single type, `ElysiaAppToHyperFetch<App, Client?>`. It reads the route tree Elysia keeps
on its app type (the one Eden uses) and converts it into a nested `createSdk` schema. There is no adapter and no runtime
code: the frontend uses a normal `@hyper-fetch/core` client with the default HTTP adapter plus `createSdk`. Every route
becomes a regular `Request` with cache, retries, deduplication and React hooks. Unlike the Hono integration, each route
also gets a **local error type** built from its non-2xx statuses, and response types follow what arrives over HTTP
(dates are strings, empty bodies are `""`).

Read `hyper-fetch-core` for the client, requests and SDK, and `hyper-fetch-react` for hooks.

## Install and set up

```bash
npm install @hyper-fetch/core @hyper-fetch/elysia
```

`elysia` 1.3 or newer is a peer dependency. The schema is a type, so it works whether the backend runs on Bun, Node.js
or another runtime. The frontend must be able to resolve `elysia` types where it type-checks the schema (a dev
dependency is enough).

```ts
// backend/src/app.ts
import { Elysia, t } from "elysia";
import type { ElysiaAppToHyperFetch } from "@hyper-fetch/elysia";

type User = { id: string; name: string };

const users = new Elysia({ prefix: "/users" })
  .get("/", (): User[] => [{ id: "1", name: "Ann" }])
  .get("/:userId", ({ params, status }) => {
    if (params.userId === "missing") return status(404, { message: "User not found" });
    const user: User = { id: params.userId, name: "Ann" };
    return user;
  })
  .post(
    "/",
    ({ body, status }) => {
      const user: User = { id: "2", name: body.name };
      return status(201, user);
    },
    { body: t.Object({ name: t.String() }) },
  )
  .get("/:userId/posts", ({ params, query }) => ({ userId: params.userId, page: query.page }), {
    query: t.Object({ page: t.String() }),
  });

const auth = new Elysia({ prefix: "/auth" }).get("/google-login", () => ({ authUrl: "https://accounts.example.com" }));

export const app = new Elysia().use(users).use(auth);

export type AppSchema = ElysiaAppToHyperFetch<typeof app>;
```

```ts
// frontend/src/api.ts
import { createClient, createSdk } from "@hyper-fetch/core";
import type { AppSchema } from "@my-app/backend";

export const client = createClient({ url: "https://api.example.com" });

export const sdk = createSdk<typeof client, AppSchema>(client);
```

```ts
const { data: users } = await sdk.users.$get.send(); // User[] | null
const { data: user, error } = await sdk.users.$userId.$get.setParams({ userId: "1" }).send();
const { data: created, status } = await sdk.users.$post.setPayload({ name: "Bob" }).send(); // 201
const { data: posts } = await sdk.users.$userId.posts.$get
  .setParams({ userId: "7" })
  .setQueryParams({ page: "3" })
  .send();
await sdk.auth.googleLogin.$get.send(); // GET /auth/google-login
```

## Golden rules

1. **Define routes and plugins in one chain** (`new Elysia().use(users).get(...)`) and pass `typeof` the value the chain
   returns. Routes added in separate statements are not in the type, the same rule as Eden. Never annotate the app as
   `Elysia`.
2. **Use `import type`** for the schema on the frontend so no server code reaches the bundle.
3. **Return errors with `status(code, body)`, not `throw`.** Returned statuses become the route's typed local error.
   Thrown errors are untyped: they arrive as a `500` with the error message text, typed only as the client's global
   error.
4. **Check `error` (or `success`) before reading `data`.** A 2xx body types `data`; every other status (4xx, 5xx, also
   3xx) types `error`. Routes with a path param, `body`, `query` or `headers` schema also carry Elysia's `422`
   validation error (`{ type: "validation"; on: string; ... }`) in `error`.
5. **Keep the `createSdk` default `camelCaseToKebabCase: true`** and use lowercase or kebab-case paths. `google-login`
   becomes `googleLogin` and is sent back as `google-login`. A camelCase Elysia path like `/userProfile` is sent as
   `/user-profile` and misses the route.
6. **Send array query params as repeated keys.** The default `tags[]=a&tags[]=b` format fails Elysia's `t.Array` query
   schema with a `422`. Call `client.adapter.setQueryParamsMapperConfig({ arrayFormat: "none" })` once.
7. **Assign `status()` bodies to a typed variable** when you want a named type. `status(201, { id: "2", name })` is
   inferred as `{ readonly id: "2"; readonly name: string }`, which leaks literal and `readonly` types to the frontend.
8. **Keep paths shorter than nine segments.** Up to eight segments get full types and the SDK client; at nine the
   request keeps `ClientInstance` (no global error type); ten or more are left out of the schema.

## How routes map to the SDK

| Elysia route                              | SDK accessor                                  | Endpoint                      |
| ----------------------------------------- | --------------------------------------------- | ----------------------------- |
| `app.get("/", ...)` or `app.get("", ...)` | `sdk.$get`                                    | `/`                           |
| `new Elysia({ prefix: "/users" })` + `/`  | `sdk.users.$get`                              | `/users`                      |
| `.get("/:userId", ...)`                   | `sdk.users.$userId.$get`                      | `/users/:userId`              |
| `.get("/:userId/posts", ...)`             | `sdk.users.$userId.posts.$get`                | `/users/:userId/posts`        |
| `.get("/files/:fileId?", ...)`            | `sdk.files.$get` and `sdk.files.$fileId.$get` | `/files` and `/files/:fileId` |
| `.get("/google-login", ...)`              | `sdk.auth.googleLogin.$get`                   | `/auth/google-login`          |
| `.group("/v1", (app) => app.use(users))`  | `sdk.v1.users.$get`                           | `/v1/users`                   |
| `.head(...)`, `.options(...)`             | `$head`, `$options`                           | the path                      |
| `.route("PROPFIND", "/dav", ...)`         | `sdk.dav.$propfind`                           | `/dav`                        |

Left out of the schema (accessing them is a type error):

- **`.ws()` routes**: use `@hyper-fetch/sockets` (see `hyper-fetch-sockets`).
- **`.all()` routes**: no single HTTP method. This differs from the Hono integration.
- **Wildcard `*` segments**: HyperFetch cannot fill them.
- **`.mount()` handlers**: Elysia does not type them.
- **Paths with ten or more segments.**

Segments named like methods or keywords (`/get/delete`, `/null`, `/index`) are ordinary keys.

## How request types are read

| Request slot | Taken from                                                                      |
| ------------ | ------------------------------------------------------------------------------- |
| Response     | union of the bodies returned with a 2xx status; `undefined` if there is none    |
| Local error  | union of the bodies of every other status, plus the `422` validation error      |
| Payload      | the `body` schema; `FormData` when it has a `t.File()`/`t.Files()` field        |
| Query params | the `query` schema (after Elysia's transforms: `t.Numeric()` is `number`)       |
| Params       | from the `:param` segments, values `string \| number`; `params` schemas ignored |
| Headers      | not typed; pass them with `setHeaders()`                                        |

`send()` resolves with `error` typed as the client's global error **or** the route's local error, so declaring
`createClient<{ error: ApiError }>` adds `ApiError` to every route's union.

## Core patterns

### Handling per-status errors

```ts
const { data, error, status } = await sdk.users.$userId.$get.setParams({ userId: "missing" }).send();

if (data) {
  data.name; // User
} else if (error && "type" in error && error.type === "validation") {
  error.on; // 422 from Elysia's schema check
} else if (error) {
  error.message; // "User not found" (404)
}
```

Types and runtime agree here: a 404 body is in `error` with `data: null`, `success: false`.

### React hooks

```tsx
import { useFetch, useSubmit } from "@hyper-fetch/react";

import { sdk } from "./api";

export const UserName = ({ userId }: { userId: string }) => {
  const { data, error, loading } = useFetch(sdk.users.$userId.$get.setParams({ userId }));

  if (loading) return <p>Loading...</p>;
  if (error) return <p>{"type" in error ? "Invalid user id" : error.message}</p>;
  return <p>{data?.name}</p>;
};

export const AddUser = () => {
  const { submit, submitting } = useSubmit(sdk.users.$post);

  return (
    <button disabled={submitting} onClick={() => submit({ payload: { name: "Bob" } })}>
      Add
    </button>
  );
};
```

### Per-route defaults and auth

```ts
export const configuredSdk = sdk.$configure({
  "*": { retry: 2 },
  "/users/*": { cacheTime: 300_000 },
  "users.$userId.$get": { staleTime: 60_000 },
  "users.$post": { retry: 0 },
});

client.onAuth((request) => request.setHeaders({ ...request.headers, Authorization: `Bearer ${getToken()}` }));
```

`$configure` keys are validated against the schema: `"*"`, endpoints (`"/users"`), wildcards (`"/users/*"`) and accessor
paths (`"users.$userId.$get"`). Exact endpoint keys do not reach routes below a `:param` segment (`"/users/:userId"` is
a type error), so use the accessor path or a wildcard, which also matches `/users/:userId` at runtime.

### File uploads

A body with `t.File()` or `t.Files()` is typed as `FormData`. Build it yourself, HyperFetch sends it as multipart:

```ts
// backend: .post("/upload", ({ body }) => ({ size: body.file.size }), { body: t.Object({ title: t.String(), file: t.File() }) })
const form = new FormData();
form.append("title", "report");
form.append("file", file);

await sdk.upload.$post.setPayload(form).send();
```

The field names are not checked against the schema, a mismatch is a runtime `422`.

### Query arrays, dates and numbers

```ts
const client = createClient({ url: "https://api.example.com" });
client.adapter.setQueryParamsMapperConfig({ arrayFormat: "none" });
const sdk = createSdk<typeof client, AppSchema>(client);

// query: t.Object({ tags: t.Array(t.String()) })  →  GET /search?tags=a&tags=b
await sdk.search.$get.setQueryParams({ tags: ["a", "b"] }).send();
```

`t.Numeric()` and `t.Date()` query fields are typed `number` and `Date`; HyperFetch serializes them and Elysia parses
them back.

### Streams

Generators, `sse()`, `ReadableStream` and `Response` bodies are typed `unknown`. Read the stream with the HTTP adapter's
`streaming` option and parse it yourself:

```ts
const { data } = await sdk.events.$get.setOptions({ streaming: true }).send();
if (data instanceof ReadableStream) {
  const text = await new Response(data).text();
}
```

### Requests outside `createSdk`

`ElysiaAppToHyperFetch<typeof app, typeof client>` fills the `Client` generic directly when you use the schema types
without `createSdk`. With `createSdk` this is not needed, it injects its own client.

## Type safety

Types flow in one direction: Elysia chain → `typeof app` → `ElysiaAppToHyperFetch<typeof app>` →
`createSdk<typeof client, AppSchema>(client)` → each `Request` → `send()`, `useFetch`, `useSubmit`. A backend change
breaks the frontend build at the call site.

Responses are typed as they arrive over HTTP, not as the handler returns them:

| Handler returns                                                | `data` typed as | Why                                    |
| -------------------------------------------------------------- | --------------- | -------------------------------------- |
| `Date`, also nested in objects and arrays                      | `string`        | JSON sends ISO strings                 |
| `null` or `undefined`                                          | `""`            | Elysia sends an empty body             |
| nothing (`void` handler) or `any`                              | `unknown`       | Elysia types both the same way         |
| generator, `sse()`, stream, `Response`, `form()`, `redirect()` | `unknown`       | the body is not JSON                   |
| only non-2xx statuses                                          | `undefined`     | nothing can land in `data`             |
| a thrown error                                                 | -               | global error type, `500` with the text |

What the compiler rejects:

```ts
// @ts-expect-error no DELETE handler on /users
sdk.users.$delete;
// @ts-expect-error the Elysia path names the param `userId`
sdk.users.$userId.$get.setParams({ id: "1" });
// @ts-expect-error the body schema requires a string `name`
sdk.users.$post.setPayload({ name: 1 });
// @ts-expect-error the query schema reads `page`, not `limit`
sdk.users.$userId.posts.$get.setQueryParams({ limit: "2" });
```

Read [references/type-safety.md](references/type-safety.md) for the full response, error, payload and query mapping,
contract pinning with `Extract*` helpers, more `@ts-expect-error` cases and every pattern that loses inference.

## Pitfalls

| Symptom                                     | Cause                                                                     | Fix                                                   |
| ------------------------------------------- | ------------------------------------------------------------------------- | ----------------------------------------------------- |
| Schema is `{}`                              | `typeof` something that is not an app, or `typeof Elysia`                 | Pass `typeof app` of the chained instance             |
| A route is missing from the SDK             | Added outside the chain, `.all()`, `.ws()`, `*`, `.mount()`, 10+ segments | Chain it, give it a method and a concrete path        |
| `/userProfile` route never matches          | SDK kebab-cases camelCase accessors at runtime                            | Use kebab-case paths                                  |
| `422` for an array query param              | Default `tags[]=` format                                                  | `setQueryParamsMapperConfig({ arrayFormat: "none" })` |
| `422` for a route with a `headers` schema   | Headers are not typed, so nothing forces them                             | `setHeaders({ ... })` on the request                  |
| `data` is `""`                              | Handler returned `null`/`undefined`                                       | Return a JSON value, or treat `""` as empty           |
| `data` is `unknown`                         | Handler returns nothing, `any`, or a stream                               | Return a typed value, or parse the stream             |
| `data` type is `readonly` literals          | Object literal passed to `status()`                                       | Assign it to a typed variable first                   |
| `error` is a string at runtime              | Handler threw, Elysia sent `500` with the message                         | Return `status(500, body)` instead                    |
| `"/users/:userId"` rejected by `$configure` | Endpoint keys stop at `:param` segments                                   | `"users.$userId.$get"` or `"/users/*"`                |
| Deep route loses the global error type      | Nine segments, beyond the SDK's client injection depth                    | Shorten the path                                      |

## Testing

The requests use the HTTP adapter, so `request.setMock(...)` and network mocks with MSW work unchanged (see
`hyper-fetch-testing`). For end-to-end tests serve the real app (`app.listen(0)` on Bun, or
`serve({ fetch: app.fetch, port: 0 })` from `@hono/node-server` on Node) and point `createClient({ url })` at it. Pin
type contracts with `expectTypeOf<ExtractResponseType<AppSchema["users"]["$get"]>>()` from Vitest.

## Links

- Docs: https://hyperfetch.bettertyped.com/docs/integrations/elysia/overview
- SDK: https://hyperfetch.bettertyped.com/docs/core/sdk
- Related skills: `hyper-fetch-core`, `hyper-fetch-react`, `hyper-fetch-testing`, `hyper-fetch-hono`,
  `hyper-fetch-sockets`.
