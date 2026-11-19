# Hono integration: type safety in depth

Read this when the SDK types look wrong, when you need to pin backend contracts in tests, or when deciding how to type
errors. Every statement here is checked against the package's type tests.

## The pipeline

```
new Hono().get(...).post(...).route(...)     backend: one chain, Hono records every route in its schema type
        │ typeof app
HonoAppToHyperFetch<typeof app>               flat "path → $method → endpoint" record → nested SDK schema
        │ import type { AppSchema }
createSdk<typeof client, AppSchema>(client)   injects the client type into every Request
        │
sdk.users.$userId.$get                        Request<Output, Json, Query, undefined, "/users/:userId", typeof client>
        │
send() / useFetch() / useSubmit()             data, error, payload, params, queryParams all typed
```

`HonoAppToHyperFetch` matches `HonoBase<any, Schema, any, any>`, so it works for `new Hono()`, apps returned by
`.route()` and apps with `basePath()`. Anything else (a plain object, a constructor type) resolves to `{}`.

## Mapping rules

| Hono                                  | Schema                                           |
| ------------------------------------- | ------------------------------------------------ |
| Path segment `users`                  | nested key `users`                               |
| `:userId`                             | key `$userId`, endpoint keeps `:userId`          |
| `google-login`                        | key `googleLogin`, endpoint keeps `google-login` |
| `.get`, `.post`, `.on("PATCH", ...)`  | lowercase `$get`, `$post`, `$patch`, ...         |
| Route on `/`                          | top-level `$get`                                 |
| `.route("/users", users)`, `basePath` | prefix in nesting and in the endpoint            |
| Two routers on the same path          | merged into one entry with both methods          |

## Request generics per route

| Request slot  | Taken from                                              | Example                                  |
| ------------- | ------------------------------------------------------- | ---------------------------------------- |
| `response`    | handler output (`c.json(value)`), union over statuses   | `User`, or `User \| { message: string }` |
| `payload`     | `json` validator (`input.json`), else `undefined`       | `{ name: string }`                       |
| `queryParams` | `query` validator input, else `undefined`               | `{ page: string \| string[] }`           |
| local `error` | always `undefined`                                      | -                                        |
| `endpoint`    | full path literal                                       | `"/users/:userId/posts"`                 |
| `params`      | core `ExtractUrlParams` of the endpoint                 | `{ userId: string \| number }`           |
| client        | `ClientInstance`, or the `Client` generic / `createSdk` | `typeof client`                          |

Outputs keep Hono's literal JSON types: `c.json({ ok: true })` is `{ ok: true }`, not `{ ok: boolean }`. Type the body
explicitly (`c.json<User>(...)`) when you want a named type on the frontend.

Query params are typed with the validator **input**, so values are `string | string[]` (what a URL can carry), even when
the validator outputs numbers.

## Error typing

Routes carry no local error, so `error` is the client's global error type. `createSdk` injects the client, so declare it
once:

```ts
import { createClient, createSdk } from "@hyper-fetch/core";
import type { ExtractGlobalErrorType } from "@hyper-fetch/core";
import type { AppSchema } from "@my-app/backend";

type ApiError = { message: string; code?: string };

export const client = createClient<{ error: ApiError }>({ url: "https://api.example.com" });
export const sdk = createSdk<typeof client, AppSchema>(client);

type UsersError = ExtractGlobalErrorType<typeof sdk.users.$get>; // ApiError
```

Match `ApiError` to what your Hono `app.onError` and `c.json(..., 4xx)` responses send. Network failures, aborts and
timeouts still produce `Error` instances at runtime, so `error.message` is the only field present in every case. Guard
other fields (`if (error && "code" in error)`).

### Error bodies in the output union

A handler that returns `c.json({ message }, 404)` adds `{ message }` to the response type, although at runtime it
arrives in `error`, never in `data`:

```ts
const { data } = await sdk.users.$userId.$get.setParams({ userId: "1" }).send();
if (data && "id" in data) {
  data.name; // narrowed to User
}
```

Throwing `new HTTPException(404, { message })` keeps the output type clean, because thrown responses are not part of the
Hono schema. Shape that body in `app.onError` so it matches the client's `ApiError`.

## What the compiler rejects

```ts
// @ts-expect-error no DELETE handler on /users
type MissingMethod = AppSchema["users"]["$delete"];
// @ts-expect-error no /posts router is mounted
type MissingRoute = AppSchema["posts"];

// @ts-expect-error the Hono path names the param `userId`
sdk.users.$userId.$get.setParams({ id: "1" });
// @ts-expect-error the json validator requires a string `name`
sdk.users.$post.setPayload({ name: 1 });
// @ts-expect-error the query validator reads `page`, not `limit`
sdk.users.$userId.posts.$get.setQueryParams({ limit: "2" });

sdk.$configure({
  // @ts-expect-error endpoint keys do not reach routes under a `:param` segment, use "users.$userId.$get"
  "/users/:userId": { staleTime: 1 },
});
```

## Pinning the contract in tests

```ts
import type { ExtractEndpointType, ExtractPayloadType, ExtractResponseType } from "@hyper-fetch/core";
import { expectTypeOf } from "vitest";

expectTypeOf<ExtractResponseType<AppSchema["users"]["$get"]>>().toEqualTypeOf<User[]>();
expectTypeOf<ExtractPayloadType<AppSchema["users"]["$post"]>>().toEqualTypeOf<{ name: string }>();
expectTypeOf<ExtractEndpointType<AppSchema["auth"]["googleLogin"]["$get"]>>().toEqualTypeOf<"/auth/google-login">();
```

## Patterns that lose inference

| Pattern                                                       | Result                                      | Fix                                                 |
| ------------------------------------------------------------- | ------------------------------------------- | --------------------------------------------------- |
| `const app = new Hono(); app.get(...)` (separate statements)  | Schema `{}`, no routes                      | Chain: `const app = new Hono().get(...)`            |
| `const app: Hono = new Hono().get(...)` or `app as Hono`      | Annotation widens to an empty schema        | Let TypeScript infer, export `typeof app`           |
| `HonoAppToHyperFetch<typeof Hono>` or a factory function type | `{}`                                        | `typeof app` of the instance                        |
| `validator("form", ...)`, `header`, `cookie` validators       | `payload` is `undefined`                    | A `json` validator, or a hand-typed `createRequest` |
| `c.json(JSON.parse(...))` or other `any` bodies               | `response` becomes `{}`                     | `c.json<User>(...)`                                 |
| Importing the runtime `app` into the frontend                 | Server code in the bundle                   | `import type { AppSchema }`                         |
| `hono` not installed where the frontend type-checks           | Schema degrades to `any` / errors           | Add `hono` as a dev dependency                      |
| camelCase Hono path (`/userProfile`)                          | Types fine, runtime URL `/user-profile`     | kebab-case paths                                    |
| `createSdk(client, { camelCaseToKebabCase: false })`          | Types fine, runtime URL `/auth/googleLogin` | Keep the default                                    |
