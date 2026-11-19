---
name: hyper-fetch-hono
description:
  Hono integration for HyperFetch (`@hyper-fetch/hono`). A types-only package whose `HonoAppToHyperFetch<typeof app>`
  turns a Hono app type into a schema for `createSdk` from `@hyper-fetch/core`, so the frontend calls the backend with
  responses, JSON payloads, query params and `:param` URL params typed from Hono routes and validators, without codegen.
  Use when the user installs `@hyper-fetch/hono`, imports `HonoAppToHyperFetch`, wants end-to-end type safety between a
  Hono backend and a HyperFetch or React frontend, writes `createSdk<typeof client, AppSchema>`, calls
  `sdk.users.$userId.$get`, maps `app.route()`, `basePath()`, kebab-case paths or `validator("json" | "query")` /
  `zValidator` to typed requests, replaces the Hono RPC client (`hc`) with HyperFetch, or hits a schema that resolves to
  `{}`, a missing route, a wrong URL from a camelCase path, or a response type that includes the error body.
---

# HyperFetch Hono integration

`@hyper-fetch/hono` exports a single type, `HonoAppToHyperFetch<App, Client?>`. It reads the route schema Hono builds
for its own RPC client and converts it into a nested `createSdk` schema. There is no adapter and no runtime code: the
frontend uses a normal `@hyper-fetch/core` client (the default HTTP adapter, or any HTTP adapter such as `AxiosAdapter`)
plus `createSdk`. Every route becomes a regular `Request` with cache, retries, deduplication and React hooks.

Read `hyper-fetch-core` for the client, requests and SDK, and `hyper-fetch-react` for hooks.

## Install and set up

```bash
npm install @hyper-fetch/core @hyper-fetch/hono
```

`hono` (v4+) is a peer dependency. The type must be resolvable wherever the schema is evaluated, so the frontend project
needs `hono` available too (in a monorepo it usually is, otherwise add it as a dev dependency).

```ts
// backend/src/app.ts
import { Hono } from "hono";
import { validator } from "hono/validator";
import type { HonoAppToHyperFetch } from "@hyper-fetch/hono";

type User = { id: string; name: string };

const users = new Hono()
  .get("/", (c) => c.json<User[]>([{ id: "1", name: "Ann" }]))
  .get("/:userId", (c) => c.json<User>({ id: c.req.param("userId"), name: "Ann" }))
  .post(
    "/",
    validator("json", (value) => value as { name: string }),
    (c) => c.json<User>({ id: "2", name: c.req.valid("json").name }, 201),
  )
  .get(
    "/:userId/posts",
    validator("query", (value) => ({ page: typeof value.page === "string" ? value.page : "1" })),
    (c) => c.json({ userId: c.req.param("userId"), page: c.req.valid("query").page }),
  );

const auth = new Hono().get("/google-login", (c) => c.json({ authUrl: "https://accounts.example.com" }));

export const app = new Hono().route("/users", users).route("/auth", auth);

export type AppSchema = HonoAppToHyperFetch<typeof app>;
```

```ts
// frontend/src/api.ts
import { createClient, createSdk } from "@hyper-fetch/core";
import type { AppSchema } from "@my-app/backend";

export const client = createClient({ url: "https://api.example.com" });

export const sdk = createSdk<typeof client, AppSchema>(client);
```

```ts
const { data: users } = await sdk.users.$get.send();
const { data: user } = await sdk.users.$userId.$get.setParams({ userId: "1" }).send();
const { data: created, status } = await sdk.users.$post.setPayload({ name: "Bob" }).send(); // 201
const { data: posts } = await sdk.users.$userId.posts.$get
  .setParams({ userId: "7" })
  .setQueryParams({ page: "3" })
  .send();
await sdk.auth.googleLogin.$get.send(); // GET /auth/google-login
```

## Golden rules

1. **Define routes in one chain** (`new Hono().get(...).post(...)`, then `.route(...)`) and pass `typeof` the value the
   chain returns. Routes added in separate statements (`app.get(...)` on its own line) are not in the type, the same
   rule as Hono's own RPC client.
2. **Use `import type`** for the schema on the frontend so no server code reaches the bundle.
3. **Keep the `createSdk` default `camelCaseToKebabCase: true`.** The schema turns `google-login` into `googleLogin`,
   and the SDK turns it back into `google-login` when it builds the URL. This is the opposite of the tRPC and oRPC
   adapters.
4. **Use lowercase or kebab-case path segments.** A camelCase Hono path like `/userProfile` stays `userProfile` in the
   schema, but the SDK sends `/user-profile` at runtime, so the call misses the route.
5. **Type the error on the client.** Routes get no local error type, so `error` is the client's global error. Declare it
   with `createClient<{ error: ApiError }>(...)`.
6. **Validate with `json` and `query` validators.** They are the only ones that type the request: `json` types
   `setPayload()`, `query` types `setQueryParams()`. `form`, `header` and `cookie` validators add no typing. URL params
   are always typed from the path.

## How routes map to the SDK

| Hono route                      | SDK accessor                   | Endpoint               |
| ------------------------------- | ------------------------------ | ---------------------- |
| `app.get("/", ...)`             | `sdk.$get`                     | `/`                    |
| `.route("/users", users)` + `/` | `sdk.users.$get`               | `/users`               |
| `.get("/:userId", ...)`         | `sdk.users.$userId.$get`       | `/users/:userId`       |
| `.get("/:userId/posts", ...)`   | `sdk.users.$userId.posts.$get` | `/users/:userId/posts` |
| `.get("/google-login", ...)`    | `sdk.auth.googleLogin.$get`    | `/auth/google-login`   |
| `new Hono().basePath("/api")`   | `sdk.api.users.$get`           | `/api/users`           |
| `.on("PATCH", "/users", ...)`   | `sdk.users.$patch`             | `/users`               |

Each request is typed as follows:

- **Response**: the handler output (the value given to `c.json()`), a union when the handler returns several bodies.
- **Payload**: the `json` validator type, `undefined` without one.
- **Query params**: the `query` validator input type (values are `string | string[]`), `undefined` without one.
- **Params**: from the `:param` segments of the full path, values `string | number`.

Accessing a route or method the app does not define is a type error, which is how backend changes surface on the
frontend.

## Core patterns

### Typed global error

```ts
import { createClient, createSdk } from "@hyper-fetch/core";
import type { AppSchema } from "@my-app/backend";

type ApiError = { message: string };

export const client = createClient<{ error: ApiError }>({ url: "https://api.example.com" });
export const sdk = createSdk<typeof client, AppSchema>(client);

const { data, error, status, success } = await sdk.users.$userId.$get.setParams({ userId: "missing" }).send();
if (!success) {
  error?.message; // ApiError
}
```

`send()` resolves. A non-2xx response has `success: false`, `data: null` and the parsed body in `error`.

### Responses with several statuses

```ts
// backend
const users = new Hono().get("/:userId", (c) => {
  const user = findUser(c.req.param("userId"));
  if (!user) return c.json({ message: "User not found" }, 404);
  return c.json(user);
});
```

The response type becomes `User | { message: string }`, although at runtime the 404 body lands in `error`, never in
`data`. Narrow `data` (`if (data && "id" in data)`) or keep error bodies out of the output type by throwing
`HTTPException` from the handler, since thrown responses are not part of the Hono schema.

### React hooks

```tsx
import { useFetch, useSubmit } from "@hyper-fetch/react";

import { sdk } from "./api";

export const UserName = ({ userId }: { userId: string }) => {
  const { data, loading } = useFetch(sdk.users.$userId.$get.setParams({ userId }));

  if (loading) return <p>Loading...</p>;
  return <p>{data && "name" in data ? data.name : null}</p>;
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
  "users.$userId.$get": { staleTime: 60_000 },
  "users.$post": { retry: 0 },
});

client.onAuth((request) => request.setHeaders({ ...request.headers, Authorization: `Bearer ${getToken()}` }));
```

`$configure` keys are validated against the schema: `"*"`, endpoints (`"/users"`), wildcards (`"/users/*"`) and accessor
paths (`"users.$post"`, `"users.$userId.$get"`). Endpoint keys do not reach routes below a `:param` segment
(`"/users/:userId"` is rejected), so use the accessor path for those. See `hyper-fetch-core` for the SDK.

### Zod and other validators

Any validator that registers a `json` or `query` target works, including `zValidator("json", schema)` from
`@hono/zod-validator`, because the type comes from Hono's route schema, not from the validator library.

### Requests outside `createSdk`

`HonoAppToHyperFetch<typeof app, typeof client>` fills the `Client` generic directly when you use the schema types
without `createSdk`. With `createSdk` this is not needed, it injects its own client.

## Type safety

Types flow in one direction: Hono route chain → `typeof app` → `HonoAppToHyperFetch<typeof app>` →
`createSdk<typeof client, AppSchema>(client)` → each `Request` → `send()`, `useFetch`, `useSubmit`. Nothing is generated
or duplicated, so a backend change breaks the frontend build at the call site.

`HonoAppToHyperFetch<App, Client = ClientInstance>`:

- `App`: the type of a Hono app (`typeof app`), including `.route()` and `basePath()`. Anything else resolves to `{}`.
- `Client`: only for using the schema outside `createSdk`. `createSdk` injects its own client, so the client's global
  error and adapter types reach every route.

Per route: `Request<Output, JsonInput, QueryInput, undefined, FullPath, Client>`. Pin contracts with core helpers:

```ts
import type { ExtractEndpointType, ExtractPayloadType, ExtractResponseType } from "@hyper-fetch/core";

type GetUser = AppSchema["users"]["$userId"]["$get"];
type UserOut = ExtractResponseType<GetUser>; // User (union with error bodies if the handler returns them)
type CreateIn = ExtractPayloadType<AppSchema["users"]["$post"]>; // { name: string }
type Path = ExtractEndpointType<GetUser>; // "/users/:userId"
```

What the compiler rejects:

```ts
// @ts-expect-error no DELETE handler on /users
sdk.users.$delete;
// @ts-expect-error the Hono path names the param `userId`
sdk.users.$userId.$get.setParams({ id: "1" });
// @ts-expect-error the json validator requires a string `name`
sdk.users.$post.setPayload({ name: 1 });
// @ts-expect-error the query validator reads `page`, not `limit`
sdk.users.$userId.posts.$get.setQueryParams({ limit: "2" });
```

Inference is lost silently when the app is not one chain, when it is annotated or cast (`const app: Hono = ...`,
`app as Hono` give an empty schema), or when the input comes from a `form` validator. Read
[references/type-safety.md](references/type-safety.md) for the full mapping, error typing, validator details and every
inference-loss case.

## Pitfalls

| Symptom                                   | Cause                                                 | Fix                                                |
| ----------------------------------------- | ----------------------------------------------------- | -------------------------------------------------- |
| Schema is `{}`                            | `typeof` something that is not a Hono app, or a class | Pass `typeof app` of the chained instance          |
| A route is missing from the SDK           | Route added outside the chain                         | Chain every `.get/.post/.route` call               |
| `/auth/googleLogin` 404s                  | `camelCaseToKebabCase: false` passed to `createSdk`   | Keep the default `true`                            |
| `/userProfile` route never matches        | SDK kebab-cases camelCase segments at runtime         | Use kebab-case paths in Hono                       |
| `data` type includes the error body       | Handler returns `c.json(body, 4xx)`                   | Narrow `data`, or throw `HTTPException`            |
| `error` is typed `Error`                  | No global error declared                              | `createClient<{ error: ApiError }>`                |
| Payload is `undefined` for a form route   | Only `json` validators type the payload               | Use a `json` validator, or `createRequest` by hand |
| Schema is `any` or broken on the frontend | `hono` types not resolvable from the frontend         | Install `hono` there (dev dependency is enough)    |

## Testing

The requests use the HTTP adapter, so `createHttpMockingServer` from `@hyper-fetch/testing` and `request.setMock(...)`
work unchanged (see `hyper-fetch-testing`). For end-to-end tests serve the real app with `@hono/node-server`
(`serve({ fetch: app.fetch, port: 0 })`) and point `createClient({ url })` at it. Type-level contracts can be pinned
with `expectTypeOf<ExtractResponseType<AppSchema["users"]["$get"]>>()` from Vitest.

## Links

- Docs: https://hyperfetch.bettertyped.com/docs/integrations/hono/overview
- SDK: https://hyperfetch.bettertyped.com/docs/core/sdk
- Related skills: `hyper-fetch-core`, `hyper-fetch-react`, `hyper-fetch-axios`, `hyper-fetch-testing`.
