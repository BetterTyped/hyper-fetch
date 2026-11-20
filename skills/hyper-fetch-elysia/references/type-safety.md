# Elysia integration: type safety in depth

Read this when the SDK types look wrong, when you need to pin backend contracts in tests, or when deciding how a route
should return errors. Every statement here is checked against the package's type tests.

## The pipeline

```
new Elysia().use(plugin).get(...).post(...)  backend: one chain, Elysia records every route on its "~Routes" type
        │ typeof app
ElysiaAppToHyperFetch<typeof app>             route tree → nested SDK schema (up to 9 segments)
        │ import type { AppSchema }
createSdk<typeof client, AppSchema>(client)   injects the client type into every Request (up to 8 segments)
        │
sdk.users.$userId.$get                        Request<Response, Payload, Query, LocalError, "/users/:userId", typeof client>
        │
send() / useFetch() / useSubmit()             data, error, payload, params, queryParams all typed
```

`ElysiaAppToHyperFetch` matches any type with a `"~Routes"` property, so it works for `new Elysia()`, apps built from
plugins (`.use()`), `prefix`, `.group()`, `.guard()`, `.model()` and macros. Anything else, including the `Elysia` class
itself (`typeof Elysia`), resolves to `{}`.

## Response

The union of the bodies returned with a 2xx status, converted to what arrives over HTTP.

| Handler                                                                    | Response type                         |
| -------------------------------------------------------------------------- | ------------------------------------- |
| `(): User[] => [...]`                                                      | `User[]`                              |
| `() => 1 as const`                                                         | `1`                                   |
| `() => true`                                                               | `boolean`                             |
| `() => ({ ok: true as const })`                                            | `{ ok: true }`                        |
| `({ status }) => status(201, user)` with `user: User`                      | `User`                                |
| `({ status }) => status(200, { n: 1 })` (object literal)                   | `{ readonly n: 1 }`                   |
| `() => ({ date: new Date(), history: [new Date()] })`                      | `{ date: string; history: string[] }` |
| `() => null`                                                               | `""`                                  |
| `() => {}` (no return value), `(): any => ...`                             | `unknown`                             |
| `{ response: t.Any() }`                                                    | `any`                                 |
| `{ response: { 200: t.Void(), 418: t.Literal("teapot") } }`                | `""` (418 goes to the error)          |
| generator, async generator, `sse()`, `ReadableStream`                      | `unknown`                             |
| `new Response(...)`, `form(...)`, `redirect(...)`                          | `unknown`                             |
| only `status(503, ...)`, `status("I'm a teapot", ...)`, `status(300, ...)` | `undefined`                           |

Runtime matches: `null` and `void` handlers resolve with `data: ""` and `success: true`, a redirect is followed and
resolves with the target's body, streams resolve as text unless you pass `setOptions({ streaming: true })`.

## Local error

The union of the bodies of every non-2xx status, converted the same way. It is `undefined` when every status is a
success. A 3xx body is an error too.

| Source                                                    | Local error member                                                                                                                    |
| --------------------------------------------------------- | ------------------------------------------------------------------------------------------------------------------------------------- |
| `status(404, { message: "User not found" })`              | `{ readonly message: "User not found" }`                                                                                              |
| `status("I'm a teapot", { brewing: false as const })`     | `{ readonly brewing: false }`                                                                                                         |
| A macro whose `resolve` returns `status(403, { reason })` | `{ readonly reason: "forbidden" }` on every route using it                                                                            |
| `response: { 418: t.Literal("teapot") }`                  | `"teapot"`                                                                                                                            |
| A path param, `body`, `query` or `headers` schema         | `{ type: "validation"; on: string; summary?: string; message?: string; found?: unknown; property?: string; expected?: string }` (422) |
| `throw new Error(...)` in the handler                     | nothing. Runtime: `500` with the message as text, typed as the global error                                                           |

`send()`, `useFetch` and `useSubmit` type `error` as `GlobalError | LocalError`. With `createClient()` the global error
is `Error`; declare yours with `createClient<{ error: ApiError }>()`. Narrow by a distinguishing key:

```ts
const { data, error } = await sdk.users.$userId.$get.setParams({ userId: "1" }).send();

if (error) {
  if ("type" in error && error.type === "validation") {
    console.log(error.on, error.summary); // 422
  } else {
    console.log(error.message); // 404 body or the global error
  }
} else if (data) {
  console.log(data.name);
}
```

Prefer `return status(code, body)` over `throw` for any error the frontend should read, since only returned statuses are
typed.

## Payload

| `body` schema                                                           | Payload type                                          |
| ----------------------------------------------------------------------- | ----------------------------------------------------- |
| `t.Object({ name: t.String() })`                                        | `{ name: string }`                                    |
| `"credentials"` (a name registered with `.model()`)                     | the model type                                        |
| `t.String()`, `t.Array(t.String())`                                     | `string`, `string[]`                                  |
| `t.Optional(t.Object({ note: t.String() }))`                            | `{ note?: string } \| null` (send `null` for no body) |
| `t.Union([t.Object({ a: t.String() }), t.Object({ b: t.Number() })])`   | `{ a: string } \| { b: number }`                      |
| `t.Object({ date: t.Date() })`                                          | `{ date: Date }` (sent as an ISO string, parsed back) |
| any `t.File()` / `t.Files()` field, optional or not                     | `FormData`                                            |
| no `body` schema, a HEAD route, a route with only `status()` or a macro | `undefined`                                           |

## Query params

| `query` schema                                                                  | Query params type                                  |
| ------------------------------------------------------------------------------- | -------------------------------------------------- |
| `t.Object({ page: t.String() })`                                                | `{ page: string }`                                 |
| `t.Object({ day: t.Date(), count: t.Numeric(), note: t.Optional(t.String()) })` | `{ day: Date; count: number; note?: string }`      |
| `t.Object({ alias: t.Literal("Kristen") })`                                     | `{ alias: "Kristen" }`                             |
| `t.Object({ tags: t.Array(t.String()) })`                                       | `{ tags: string[] }` (needs `arrayFormat: "none"`) |
| `t.Partial(...)`, `t.Optional(t.Object(...))`                                   | all fields optional                                |
| `.guard({ query: ... }, (app) => app.get(...))`                                 | the guard's query                                  |
| none, `t.Unknown()`, `t.Object({})`                                             | `undefined`                                        |

## Params and headers

Params are always read from the path: `{ count: string | number }` for `/params/:count`, even with
`params: t.Object({ count: t.Number() })`. The transformed value only shows up in the response if the handler returns
it. `headers` schemas are not typed on the request; a missing required header is a runtime `422`.

## What the compiler rejects

```ts
// @ts-expect-error no DELETE handler on /users
type MissingMethod = AppSchema["users"]["$delete"];
// @ts-expect-error no /posts plugin is used
type MissingRoute = AppSchema["posts"];

// @ts-expect-error the Elysia path names the param `userId`
sdk.users.$userId.$get.setParams({ id: "1" });
// @ts-expect-error the body schema requires a string `name`
sdk.users.$post.setPayload({ name: 1 });
// @ts-expect-error the query schema reads `page`, not `limit`
sdk.users.$userId.posts.$get.setQueryParams({ limit: "2" });
// @ts-expect-error a body with `t.File()` is FormData, it cannot be sent as JSON
sdk.upload.$post.setPayload({ title: "a", file: new Blob() });
// @ts-expect-error the query schema only accepts the literal
sdk.queryLiteral.$get.setQueryParams({ alias: "Other" });
// @ts-expect-error `.ws()` routes are not part of the schema
sdk.live;
// @ts-expect-error an optional param is split into two routes, there is no `$fileId?` key
sdk.files["$fileId?"];

sdk.$configure({
  // @ts-expect-error endpoint keys do not reach routes under a `:param` segment, use "users.$userId.$get"
  "/users/:userId": { staleTime: 1 },
});
```

## Pinning the contract in tests

```ts
import type {
  ExtractEndpointType,
  ExtractLocalErrorType,
  ExtractPayloadType,
  ExtractResponseType,
} from "@hyper-fetch/core";
import { expectTypeOf } from "vitest";

type ValidationError = { type: "validation" };

expectTypeOf<ExtractResponseType<AppSchema["users"]["$get"]>>().toEqualTypeOf<User[]>();
expectTypeOf<ExtractPayloadType<AppSchema["users"]["$post"]>>().toEqualTypeOf<{ name: string }>();
expectTypeOf<ExtractEndpointType<AppSchema["auth"]["googleLogin"]["$get"]>>().toEqualTypeOf<"/auth/google-login">();
expectTypeOf<Exclude<ExtractLocalErrorType<AppSchema["users"]["$userId"]["$get"]>, ValidationError>>().toEqualTypeOf<{
  readonly message: "User not found";
}>();
```

## Patterns that lose inference

| Pattern                                                   | Result                                               | Fix                                              |
| --------------------------------------------------------- | ---------------------------------------------------- | ------------------------------------------------ |
| `const app = new Elysia(); app.get(...)` (separate calls) | Route missing                                        | Chain every `.get/.post/.use`                    |
| `ElysiaAppToHyperFetch<typeof Elysia>`                    | `{}`                                                 | `typeof app` of the instance                     |
| Handler without a return value, or returning `any`        | Response `unknown`                                   | Return a typed value or annotate the return type |
| `throw` for expected failures                             | No local error, runtime text body                    | `return status(code, body)`                      |
| `status(code, { ...literal })`                            | `readonly` literal types                             | Pass a typed variable                            |
| `.all()`, `.ws()`, `*`, `.mount()`                        | Route left out                                       | Concrete method and path, or sockets for ws      |
| 9 segments                                                | Request keeps `ClientInstance`, no global error type | Shorter path                                     |
| 10+ segments                                              | Route left out                                       | Shorter path                                     |
| camelCase path (`/userProfile`)                           | Types fine, runtime URL `/user-profile`              | kebab-case paths                                 |
| `createSdk(client, { camelCaseToKebabCase: false })`      | Types fine, runtime URL `/auth/googleLogin`          | Keep the default                                 |
| Importing the runtime `app` into the frontend             | Server code in the bundle                            | `import type { AppSchema }`                      |
