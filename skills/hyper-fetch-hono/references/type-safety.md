# Hono integration: type safety in depth

Read this when the SDK types look wrong, when you need to pin backend contracts in tests, or when deciding how to type
errors. Every statement here is checked against the package's type tests.

## The pipeline

```
new Hono().get(...).post(...).route(...)     backend: one chain, Hono records every route in its schema type
        │ typeof app
HonoSchema<typeof app>                        "path → $method → endpoint" record → nested SDK schema
        │ import type { AppSchema }
createSdk<typeof client, AppSchema>(client)   injects the client type into every Request (10 levels deep)
        │
sdk.users.$userId.$get                        Request<Output, Json, Query, undefined, "/users/:userId", typeof client>
        │
send() / useFetch() / useSubmit()             data, error, payload, params, queryParams all typed
```

`HonoSchema` matches `HonoBase<any, Schema, any, any>`, so it works for `new Hono()`, apps returned by
`.route()`, apps with `basePath()`, apps with a typed environment (`new Hono<Env>()`), and apps wrapped in Hono's
`PickResponseByStatusCode` or `ApplyGlobalResponse`. Anything else (a plain object, a constructor type) resolves to
`{}`.

## Mapping rules

| Hono                                      | Schema                                                                   |
| ----------------------------------------- | ------------------------------------------------------------------------ |
| Path segment `users`                      | nested key `users`                                                       |
| `:userId`                                 | key `$userId`, endpoint keeps `:userId`                                  |
| `:fileId?` (optional)                     | route without the param, plus `$fileId` with it; every prefix of a chain |
| `:postId{[0-9]+}` (regex)                 | key `$postId`, endpoint `:postId`, the pattern is dropped                |
| `google-login`                            | key `googleLogin`, endpoint keeps `google-login`                         |
| `userProfile` (camelCase)                 | key `userProfile`, endpoint type `/userProfile`, sent as `/user-profile` |
| `*`                                       | literal key `"*"`, endpoint keeps `*`                                    |
| `.get`, `.post`, `.on("PATCH", ...)`      | lowercase `$get`, `$post`, `$patch`, ..., custom methods too (`$purge`)  |
| `.all(...)`                               | every standard method, `$get` to `$query`; no `$all` key                 |
| `.on([methods], path)`, `.on(m, [paths])` | one key per method, one route per path                                   |
| Route on `/`                              | top-level `$get`                                                         |
| No leading slash, or a trailing slash     | endpoint `/plain`, `/slash` (what `createSdk` sends)                     |
| `.route("/users", users)`, `basePath`     | prefix in nesting and in the endpoint; empty-path mounts flatten         |
| Two routers on the same path              | merged into one entry with both methods                                  |

## Request generics per route

| Request slot  | Taken from                                                        | Example                                  |
| ------------- | ----------------------------------------------------------------- | ---------------------------------------- |
| `response`    | handler output, union over statuses, branches and early responses | `User`, or `User \| { message: string }` |
| `payload`     | `json` validator output (`input.json`), else `undefined`          | `{ title: string; draft?: boolean }`     |
| `queryParams` | `query` validator input, else `undefined`                         | `{ page: string \| string[] }`           |
| local `error` | always `undefined`                                                | -                                        |
| `endpoint`    | the path as `createSdk` sends it                                  | `"/users/:userId/posts"`                 |
| `params`      | core `ExtractUrlParams` of the endpoint                           | `{ userId: string \| number }`           |
| client        | `ClientInstance`, or the `Client` generic / `createSdk`           | `typeof client`                          |

Outputs keep Hono's literal JSON types: `c.json({ ok: true })` is `{ ok: true }`, not `{ ok: boolean }`, and
`c.json(37)` is `37`. `Date` fields become `string`, interfaces with optional fields are kept. Type the body explicitly
(`c.json<User>(...)` or a typed variable) when you want a named type on the frontend.

Query params are typed with the validator **input**, so values are `string | string[]` (what a URL can carry), even when
the validator outputs numbers or booleans. An untyped `validator("query", (v) => v)` gives
`{ [key: string]: string | string[] }`.

Validators that type nothing on the request:

- `form`: payload `undefined`, the SDK sends no body. Use `client.createRequest<{ payload: FormData }>()`.
- `header`, `cookie`: use `setHeaders()`.
- `param`: params still come from the path as `string | number`. The validator output (for example a number) only shows
  up in the response when the handler returns it.

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
timeouts still produce `Error` instances at runtime, and `c.notFound()` sends the text `"404 Not Found"`, so guard
fields other than `message` (`if (error && "code" in error)`).

### Error bodies in the output union

A handler that returns `c.json({ message }, 404)` adds `{ message }` to the response type, although at runtime it
arrives in `error`, never in `data`. The same goes for a middleware that returns `c.json({ error }, 401)` before
`next()`, and for a validator that returns `c.json(..., 400)` instead of a value:

```ts
const { data } = await sdk.users.$userId.$get.setParams({ userId: "1" }).send();
if (data && "id" in data) {
  data.name; // narrowed to User
}
```

Ways to keep the output clean:

- Throw `new HTTPException(404, { message })`. Thrown responses are not part of the Hono schema. Shape that body in
  `app.onError` so it matches the client's `ApiError`.
- Build the schema from Hono's `PickResponseByStatusCode`. It keeps only the statuses you list, and only works when
  every success return passes that status literally (`c.json(user, 200)`). A route whose status is not written out, or
  that uses an explicit generic like `c.json<User>(...)`, resolves to `never`:

```ts
import type { PickResponseByStatusCode } from "hono/client";
import type { HonoSchema } from "@hyper-fetch/hono";

const user: User = { id: "1", name: "Ann" };

const app = new Hono().get("/users/:userId", (c) => {
  if (c.req.param("userId") === "missing") return c.json({ message: "User not found" }, 404);
  return c.json(user, 200);
});

export type AppSchema = HonoSchema<PickResponseByStatusCode<typeof app, 200 | 201>>;
// ExtractResponseType<AppSchema["users"]["$userId"]["$get"]> is User
```

`ApplyGlobalResponse<typeof app, { 500: { json: { error: string } } }>` does the opposite and adds a body to every
route's output.

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

On the paths of an app with optional, regex and `.all()` routes:

```ts
// @ts-expect-error an optional param is split into two routes, there is no `$fileId?` key
sdk.files["$fileId?"];
// @ts-expect-error `.all()` becomes every standard method, there is no `$all` key
sdk.echo.$all;
// @ts-expect-error the payload of a `form` route is undefined
sdk.upload.$post.setPayload(new FormData());
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

| Pattern                                                      | Result                                                                | Fix                                                 |
| ------------------------------------------------------------ | --------------------------------------------------------------------- | --------------------------------------------------- |
| `const app = new Hono(); app.get(...)` (separate statements) | Schema `{}`, no routes                                                | Chain: `const app = new Hono().get(...)`            |
| `const app: Hono = new Hono().get(...)` or `app as Hono`     | Annotation widens to an empty schema                                  | Let TypeScript infer, export `typeof app`           |
| `HonoSchema<typeof Hono>` or a factory function type         | `{}`                                                                  | `typeof app` of the instance                        |
| `validator("form", ...)`, `header`, `cookie` validators      | `payload` is `undefined`                                              | A `json` validator, or a hand-typed `createRequest` |
| `c.json(JSON.parse(...))` or other `any` bodies              | `response` becomes `{}`                                               | `c.json<User>(...)`                                 |
| `c.newResponse(...)`, `c.notFound()`                         | `response` is `{}`                                                    | Return `c.json(...)` for typed bodies               |
| Route nested deeper than 10 levels                           | Request keeps `ClientInstance`, no global error, no `$configure` keys | Flatten the path                                    |
| Importing the runtime `app` into the frontend                | Server code in the bundle                                             | `import type { AppSchema }`                         |
| `hono` not installed where the frontend type-checks          | Schema degrades to `any` / errors                                     | Add `hono` as a dev dependency                      |
| camelCase Hono path (`/userProfile`)                         | Types fine, runtime URL `/user-profile`                               | kebab-case paths                                    |
| `createSdk(client, { camelCaseToKebabCase: false })`         | Types fine, runtime URL `/auth/googleLogin`                           | Keep the default                                    |
| `/users/` registered with a trailing slash                   | Types fine, runtime 404 in strict mode                                | `/users`, or `appendTrailingSlash()`                |
