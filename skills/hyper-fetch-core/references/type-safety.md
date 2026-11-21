# Type safety

HyperFetch encodes the whole contract of an endpoint in the `Request` type: response, payload, query params, endpoint
params, local and global error, adapter (methods, options, status, extra) and whether params/payload/query params are
already set. Everything below was checked with `tsc --strict` against the core sources. All snippets share this setup:

```ts
import {
  createClient,
  createSdk,
  optimistic,
  Adapter,
  type RequestInstance,
  type RequestModel,
  type RequestSendOptionsType,
  type RequestResponseType,
  type ResponseSuccessType,
  type ResponseErrorType,
  type ExtractResponseType,
  type ExtractPayloadType,
  type ExtractQueryParamsType,
  type ExtractParamsType,
  type ExtractErrorType,
  type ExtractLocalErrorType,
  type ExtractGlobalErrorType,
  type ExtractEndpointType,
  type ExtractAdapterType,
  type ExtractAdapterMethodType,
  type ExtractAdapterOptionsType,
  type ExtractAdapterExtraType,
  type ExtractAdapterStatusType,
  type ExtractClientGlobalError,
  type ExtractClientAdapterType,
  type ExtractClientType,
  type HttpMethodsType,
} from "@hyper-fetch/core";

type User = { id: number; name: string };
type ApiError = { message: string; code: string };
```

## 1. The client: global error and adapter

```ts
export const client = createClient<{ error: ApiError | Error }>({ url: "https://api.example.com" });
```

- `createClient<{ error?: E }>(options)` - the only generic is the **global error** (default `Error`). It must be an
  object type or a string type (`ClientErrorType = Record<string, any> | string`).
- Include `Error` in the union (`ApiError | Error`): timeouts, aborts, network failures and removed requests always
  arrive as `Error` instances, whatever the declared type (see section 6).
- The adapter type comes from the adapter instance: `createClient(...)` uses `HttpAdapterType`; `.setAdapter(adapter)`
  returns a client typed with the new adapter. Chain it in the same expression that you export, otherwise the exported
  variable keeps the old adapter type:

```ts
const httpClient = createClient({ url: "https://api.example.com" });
type HttpClientAdapter = ExtractClientAdapterType<typeof httpClient>; // HttpAdapterType
type HttpClientError = ExtractClientGlobalError<typeof httpClient>; // Error (the default)
```

- The `Client` class has **positional** generics: `new Client<GlobalError, Adapter>(options)`. Passing the
  `createClient` object form to the class compiles but is wrong: `new Client<{ error: ApiError }>` makes the global
  error type literally `{ error: ApiError }`, because any object is a valid `ClientErrorType`. Use `createClient`.

The global error and the adapter flow into every request created by the client: `ExtractErrorType` of every request
includes the global error, and `method`, `options`, `status` and `extra` are typed by the adapter.

## 2. createRequest generics

```ts
const updateUser = client.createRequest<{
  response: User; // type of `data`
  payload: Partial<Omit<User, "id">>; // type of the body
  queryParams?: { notify?: boolean }; // `?` = optional at send time
  error: { fields: Record<string, string[]> }; // local error, unioned with the global error
}>()({
  endpoint: "/users/:userId", // literal kept, params inferred
  method: "PATCH", // checked against the adapter's methods
});
```

| Key           | Default when omitted                   | Effect                                                                         |
| ------------- | -------------------------------------- | ------------------------------------------------------------------------------ |
| `response`    | `undefined`                            | `data` is `undefined \| null`; always declare it for requests that return data |
| `payload`     | `undefined`                            | no `payload` accepted by `send` / `setPayload`                                 |
| `queryParams` | adapter default (`undefined` for HTTP) | no `queryParams` accepted; declare to allow them                               |
| `error`       | the client's global error              | local error; `ExtractErrorType` = local `\|` global                            |
| `endpoint`    | the literal of the `endpoint` option   | override only to force a specific literal type                                 |

There is no `localError` key (that name only exists in `ExtendRequest`), and the `params` key of the generic object is
ignored: endpoint params are always inferred from the endpoint string.

### Why the call is curried

TypeScript cannot infer some generics while you pass others explicitly. The first call fixes your explicit object, the
second call infers the endpoint literal (for params), the method literal and the adapter options from the argument.

```ts
// @ts-expect-error createRequest must be called twice: createRequest<Types>()(options)
const notCurried = client.createRequest<{ response: User }>({ endpoint: "/users" });
```

The error reads `Argument of type '{ endpoint: string; }' is not assignable to parameter of type 'undefined'`.

### Method and adapter options are checked

```ts
const removeUser = client.createRequest<{ response: null }>()({ endpoint: "/users/:userId", method: "DELETE" });
// @ts-expect-error "FETCH" is not one of the adapter's methods
const unknownMethod = client.createRequest()({ endpoint: "/users", method: "FETCH" });

const methodName: string = "GET";
// @ts-expect-error a wide `string` is not a method; keep literals or type it as HttpMethodsType
const wideMethod = client.createRequest()({ endpoint: "/users", method: methodName });
const typedMethod: HttpMethodsType = "GET";
const okMethod = client.createRequest()({ endpoint: "/users", method: typedMethod });

const slow = client.createRequest<{ response: User[] }>()({ endpoint: "/reports", options: { timeout: 30_000 } });
// @ts-expect-error unknown adapter option
slow.setOptions({ unknownOption: true });
```

## 3. Endpoint params

The endpoint literal is parsed at the type level: every `:name` segment becomes a required key of type
`ParamType = string | number`.

```ts
const getTeamUser = client.createRequest<{ response: User }>()({ endpoint: "/teams/:teamId/users/:userId" });

type TeamUserParams = ExtractParamsType<typeof getTeamUser>; // { teamId: ParamType; userId: ParamType }

getTeamUser.send({ params: { teamId: 1, userId: "u_1" } });
// @ts-expect-error every param of the endpoint is required
getTeamUser.send({ params: { userId: 1 } });
// @ts-expect-error unknown param name
getTeamUser.setParams({ teamId: 1, id: 1 });

type NoParams = ExtractParamsType<typeof removeUser>; // { userId: ParamType }
const staticEndpoint = client.createRequest<{ response: User[] }>()({ endpoint: "/users" });
type StaticParams = ExtractParamsType<typeof staticEndpoint>; // null | undefined - nothing to pass
```

### Compile-time "must be set before send"

Each request carries three flags in its type, `HasPayload`, `HasParams` and `HasQuery` (all `false` initially).
`setParams`, `setPayload` and `setQueryParams` return a clone with the flag set to `true`, and `send` / `exec` make the
corresponding option required only while the flag is `false` and the type is non-empty.

```ts
const getUser = client.createRequest<{ response: User }>()({ endpoint: "/users/:userId" });

// @ts-expect-error params are required: "Expected 1 arguments, but got 0"
getUser.send();
// @ts-expect-error `{}` lacks `params`
getUser.send({});

const user1 = getUser.setParams({ userId: 1 });
user1.send(); // flag set, options optional

const createUser = client.createRequest<{ response: User; payload: { name: string } }>()({
  endpoint: "/users",
  method: "POST",
});
// @ts-expect-error payload is required
createUser.send();
// @ts-expect-error payload has to match its type
createUser.send({ payload: { name: 1 } });
createUser.setPayload({ name: "Ann" }).send();
```

The flags live on the **returned** clone. Calling a setter without using its result changes nothing, and the types tell
you:

```ts
const searchUsers = client.createRequest<{ response: User[]; queryParams: { search: string } }>()({
  endpoint: "/users/search",
});
searchUsers.setQueryParams({ search: "ann" }); // result discarded
// @ts-expect-error still requires queryParams - setters return a new request
searchUsers.send();
```

### Keep the endpoint literal

Param inference needs the literal type. A widened `string` endpoint silently disables param checking:

```ts
let dynamicEndpoint = "/users/:userId"; // `let` widens to string
const widened = client.createRequest<{ response: User }>()({ endpoint: dynamicEndpoint });
type WidenedParams = ExtractParamsType<typeof widened>; // null | undefined - params are not checked anymore
// @ts-expect-error with a widened endpoint no params can be passed at all
widened.setParams({ userId: 1 });

const literalEndpoint = "/users/:userId"; // `const` keeps the literal
const kept = client.createRequest<{ response: User }>()({ endpoint: literalEndpoint });
kept.setParams({ userId: 1 });
```

Write endpoints inline or as `const`. Build variants with `setParams`, never with template strings (`` `/users/${id}` ``
is a wide `string` and also produces a different cache key per id format).

## 4. Query params typing

```ts
const listUsers = client.createRequest<{
  response: User[];
  queryParams?: { page?: number; role?: "admin" | "member"; tags?: string[] };
}>()({ endpoint: "/users" });

listUsers.send(); // optional because the key is declared with `?`
listUsers.send({ queryParams: { page: 2, role: "admin" } });
// @ts-expect-error literal union is enforced
listUsers.send({ queryParams: { role: "owner" } });

const searchTeams = client.createRequest<{ response: User[]; queryParams: { q: string; page: number } }>()({
  endpoint: "/teams/search",
});
// @ts-expect-error required query params must be complete
searchTeams.send({ queryParams: { q: "a" } });
searchTeams.setQueryParams({ q: "a", page: 1 }).send();

// @ts-expect-error no queryParams declared, so none are accepted
staticEndpoint.send({ queryParams: { page: 1 } });

const rawQuery = client.createRequest<{ response: User[]; queryParams: string }>()({ endpoint: "/raw" });
rawQuery.send({ queryParams: "?page=1" }); // the HTTP adapter also accepts a string
```

## 5. Mappers and how they change types

| Method                  | Changes the request type?                                                                       |
| ----------------------- | ----------------------------------------------------------------------------------------------- |
| `setResponseMapper(fn)` | Yes: `response` becomes the mapped `data` type, the local error becomes the mapped `error` type |
| `setRequestMapper(fn)`  | No, it must return a request                                                                    |
| `setPayloadMapper(fn)`  | No: `payload` stays the type callers pass; the mapper only changes the wire body                |

```ts
type ApiUser = { id: number; full_name: string };
const getProfile = client
  .createRequest<{ response: ApiUser }>()({ endpoint: "/me" })
  .setResponseMapper((response) => {
    if (!response.success) return response; // keep error branch
    return { ...response, data: { id: response.data.id, name: response.data.full_name } };
  });

type Profile = ExtractResponseType<typeof getProfile>; // { id: number; name: string }

// Async mappers infer the same way
const getProfileName = client
  .createRequest<{ response: ApiUser }>()({ endpoint: "/me" })
  .setResponseMapper(async (response) => {
    if (!response.success) return response;
    return { ...response, data: response.data.full_name };
  });
type ProfileName = ExtractResponseType<typeof getProfileName>; // string

// Turning a success into a typed failure adds the error type
const getValidated = client
  .createRequest<{ response: User }>()({ endpoint: "/users/validated" })
  .setResponseMapper((response) => {
    if (!response.success) return response;
    if (!response.data.name) {
      return { ...response, success: false as const, data: null, error: { issues: ["name"] } };
    }
    return response;
  });
type ValidatedError = ExtractErrorType<typeof getValidated>; // ApiError | Error | { issues: string[] } | null
```

Rules for mappers that type well:

- Branch on `response.success` first; inside the success branch `response.data` is non-null.
- Return a full response. Returning bare data (`(res) => res.data.users`) does not match `ResponseMapper` and fails.
- Spreading the unnarrowed `response` and replacing only `data` with a nullable value fails, because the result is
  neither a valid success nor a valid error response. Narrow first.
- For validation libraries, type the request with the raw shape (or `unknown`) and let the mapper's parse result type
  `data`: `{ response: unknown }` + `data: Schema.parse(response.data)`.
- Annotate the mapper's return type with
  `ResponseSuccessType<D, typeof client.adapter> | ResponseErrorType<E, typeof client.adapter>` when inference gets
  complicated.

## 6. Errors: global, local, narrowing

```ts
const signUp = client.createRequest<{
  response: User;
  payload: { email: string };
  error: { fields: Record<string, string[]> };
}>()({ endpoint: "/sign-up", method: "POST" });

type SignUpError = ExtractErrorType<typeof signUp>; // { fields } | ApiError | Error
type SignUpLocal = ExtractLocalErrorType<typeof signUp>; // { fields }
type SignUpGlobal = ExtractGlobalErrorType<typeof signUp>; // ApiError | Error

export const handleSignUp = async (email: string) => {
  const { data, error, success } = await signUp.send({ payload: { email } });

  if (success && data) return data; // `success` alone does not narrow `data`
  if (error instanceof Error) return `Network or system error: ${error.message}`;
  if (error && "fields" in error) return error.fields;
  if (error) return error.code; // ApiError
  return null;
};
```

The response type is **not** a discriminated union: `data: T | null`, `error: E | null` and `success: boolean` are
independent (GraphQL can return both data and errors). `if (success)` does not make `data` non-null; check `data` itself
or both. `ResponseSuccessType` / `ResponseErrorType` are the discriminated shapes, used by mappers.

```ts
export const readName = async () => {
  const response = await getProfile.send();
  if (response.success) {
    // @ts-expect-error success does not narrow data
    const strict: { id: number; name: string } = response.data;
  }
  return response.data?.name; // check data instead
};
```

## 7. Extractor and helper types

All exported from `@hyper-fetch/core`:

| Type                                                                                                                                                                                                                                   | Gives                                                      |
| -------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------- | ---------------------------------------------------------- |
| `ExtractResponseType<R>`                                                                                                                                                                                                               | response (`data` without `null`)                           |
| `ExtractPayloadType<R>`                                                                                                                                                                                                                | payload                                                    |
| `ExtractQueryParamsType<R>`                                                                                                                                                                                                            | query params (includes `undefined` when declared with `?`) |
| `ExtractParamsType<R>`                                                                                                                                                                                                                 | endpoint params object, or `null \| undefined`             |
| `ExtractEndpointType<R>`                                                                                                                                                                                                               | endpoint literal (template, e.g. `"/users/:userId"`)       |
| `ExtractErrorType<R>`                                                                                                                                                                                                                  | local `\|` global error                                    |
| `ExtractLocalErrorType<R>` / `ExtractGlobalErrorType<R>`                                                                                                                                                                               | each side separately                                       |
| `ExtractClientType<R>`, `ExtractAdapterType<R>`                                                                                                                                                                                        | the client / adapter of a request                          |
| `ExtractHasPayloadType<R>`, `ExtractHasParamsType<R>`, `ExtractHasQueryParamsType<R>`                                                                                                                                                  | the "already set" flags                                    |
| `ExtractMutationContextType<R>`                                                                                                                                                                                                        | context returned by `setOptimistic`                        |
| `ExtractClientGlobalError<C>`, `ExtractClientAdapterType<C>`                                                                                                                                                                           | from a client                                              |
| `ExtractAdapterMethodType<A>`, `ExtractAdapterOptionsType<A>`, `ExtractAdapterStatusType<A>`, `ExtractAdapterExtraType<A>`, `ExtractAdapterQueryParamsType<A>`, `ExtractAdapterEndpointType<A>`, `ExtractAdapterRequestOptionsType<A>` | from an adapter                                            |
| `RequestResponseType<R>`                                                                                                                                                                                                               | what `send()` resolves with                                |
| `RequestSendOptionsType<R>`                                                                                                                                                                                                            | the argument of `send()`                                   |
| `ResponseType<D, E, A>`, `ResponseSuccessType<D, A>`, `ResponseErrorType<E, A>`                                                                                                                                                        | response shapes                                            |
| `ExtendRequest<R, { response?, payload?, queryParams?, localError?, endpoint?, client?, hasData?, hasParams?, hasQuery? }>`                                                                                                            | a request type with some slots replaced                    |
| `RequestInstance<{...}>` / `RequestModel<{...}>`                                                                                                                                                                                       | see below                                                  |
| `ClientInstance<{ error?, adapter? }>`, `AdapterInstance`                                                                                                                                                                              | any client / adapter                                       |

```ts
type UpdateUserParams = ExtractParamsType<typeof updateUser>;
type UpdateUserPayload = ExtractPayloadType<typeof updateUser>;
type UpdateUserQuery = ExtractQueryParamsType<typeof updateUser>; // { notify?: boolean } | undefined
type UpdateUserEndpoint = ExtractEndpointType<typeof updateUser>; // "/users/:userId"
type UpdateUserResult = RequestResponseType<typeof updateUser>; // { data: User | null; error: ...; ... }

type Http = ExtractAdapterType<typeof updateUser>;
type HttpMethod = ExtractAdapterMethodType<Http>; // "GET" | "POST" | "PUT" | "PATCH" | "DELETE" | "QUERY"
type HttpOptions = ExtractAdapterOptionsType<Http>; // RequestInit fields + timeout + streaming + responseType
type HttpStatus = ExtractAdapterStatusType<Http>; // number
type HttpExtra = ExtractAdapterExtraType<Http>; // { headers: Record<string, string> }

export const saveUser = (params: UpdateUserParams, payload: UpdateUserPayload) =>
  updateUser.setParams(params).send({ payload });
```

## 8. Functions that accept requests

`RequestInstance<{...}>` is the **constraint** form: omitted slots are `any`, so any matching request is accepted.
`RequestModel<{...}>` is the **definition** form for one endpoint: omitted slots stay strict (`response: unknown`,
`payload` and `queryParams: undefined`, `error: Error`, `endpoint: string`, flags `false`).

```ts
// Accept any request returning User[]
export function countUsers<R extends RequestInstance<{ response: User[] }>>(request: R) {
  // Inside generic code the send options type is still unresolved; pass it explicitly
  return request.send({} as RequestSendOptionsType<R>).then(({ data }) => data?.length ?? 0);
}
countUsers(listUsers);
// @ts-expect-error response is User, not User[]
countUsers(getUser);

// Accept any request and keep its exact response type
export async function sendOrThrow<R extends RequestInstance>(request: R, options: RequestSendOptionsType<R>) {
  const response = await request.send(options);
  if (!response.success || response.data === null) throw response.error ?? new Error("Empty response");
  return response.data as ExtractResponseType<R>;
}
export const loadUser = () => sendOrThrow(getUser, { params: { userId: 1 } }); // Promise<User>
```

- Prefer `<R extends RequestInstance<...>>(request: R)` over `(request: RequestInstance<...>)`: the generic keeps the
  concrete type for return values and callbacks.
- Concrete requests always pass a `RequestInstance` constraint, but `RequestInstance` without a generic is `any` in
  every slot; do not use it as the type of a variable you read `data` from.
- `sendOrThrow` above is for adapters to code that expects exceptions (for example a server action or a framework that
  needs a rejected promise). The `as` on `data` is the only cast and is sound because `null` was excluded; in normal
  code branch on the response instead.

## 9. SDK typing

```ts
type Todo = { id: number; title: string; done: boolean };

type ApiSchema = {
  todos: {
    $get: RequestModel<{ response: Todo[]; queryParams?: { done?: boolean } | null; endpoint: "/todos" }>;
    $post: RequestModel<{ response: Todo; payload: Omit<Todo, "id">; endpoint: "/todos" }>;
    $todoId: {
      $get: RequestModel<{ response: Todo; endpoint: "/todos/:todoId" }>;
    };
  };
};

const sdk = createSdk<typeof client, ApiSchema>(client);

sdk.todos.$get.send({ queryParams: { done: true } });
sdk.todos.$get.send(); // optional thanks to `| null`
sdk.todos.$todoId.$get.send({ params: { todoId: 1 } });
// @ts-expect-error params required, inferred from the schema endpoint literal
sdk.todos.$todoId.$get.send();
// @ts-expect-error payload required
sdk.todos.$post.send();

type SdkTodo = ExtractResponseType<typeof sdk.todos.$todoId.$get>; // Todo
type SdkClient = ExtractClientType<typeof sdk.todos.$get>; // typeof client (injected by createSdk)

sdk.$configure({
  "todos.$get": { staleTime: 30_000 },
  "/todos/*": { retry: 1 },
  // @ts-expect-error configuration keys are checked against the schema
  "todo.$get": { retry: 2 },
});
```

- Pass both generics: `createSdk<typeof client, Schema>(client)`; the client is injected into every leaf, so the global
  error and adapter types apply.
- Use `RequestModel` in schemas. `RequestInstance` there widens every omitted slot to `any`.
- Omitting `response` in a `RequestModel` gives `unknown`, which forces narrowing. Declare it.
- Optional query params in a `RequestModel` are written `queryParams?: Q | null`. `RequestModel` strips `undefined` from
  its slots, so `queryParams?: Q` alone makes them required (`createRequest` keeps `?` optional).
- The schema's `endpoint` literal is what the types use; the runtime endpoint is built from the property path
  (`todos.$todoId` -> `/todos/:todoId`, camelCase -> kebab-case). Nothing checks that they match, so keep the `endpoint`
  of every leaf equal to its path.
- `hyper-fetch-cli` generates the schema from OpenAPI so these stay in sync.

## 10. Adapter typing

Every adapter fixes the methods, options, status, extra and query params types:

```ts
type MyExtra = { requestId: string };
const rpcAdapter = new Adapter<
  { signal?: AbortSignal }, // adapter options (request `options`)
  "CALL" | "NOTIFY", // methods
  "ok" | "error", // status type
  MyExtra // extra
>({
  name: "rpc",
  defaultMethod: "CALL",
  defaultExtra: { requestId: "" },
  systemErrorStatus: "error",
  systemErrorExtra: { requestId: "" },
});

const rpcClient = createClient({ url: "rpc://local" }).setAdapter(rpcAdapter);
const ping = rpcClient.createRequest<{ response: "pong" }>()({ endpoint: "ping", method: "NOTIFY" });
// @ts-expect-error methods come from the adapter, GET does not exist here
rpcClient.createRequest()({ endpoint: "ping", method: "GET" });

export const pingStatus = async () => {
  const { status, extra } = await ping.send();
  return { status, id: extra?.requestId }; // status: "ok" | "error" | null
};
```

`DeclareAdapterType<{ adapterOptions, methodType, statusType, extra, queryParams, defaultQueryParams, endpointType, requestOptions, ... }>`
declares an adapter type by name instead of by position. Adapter packages export their own type (`HttpAdapterType`,
`AxiosAdapterType`, GraphQL/Firebase adapters); see their skills for their request options.

## 11. Optimistic typing

```ts
const getTodos = client.createRequest<{ response: Todo[] }>()({ endpoint: "/todos" });
const getTodo = client.createRequest<{ response: Todo }>()({ endpoint: "/todos/:todoId" });

optimistic(getTodos).patch(1, { done: true });
// @ts-expect-error fields are checked against the list item
optimistic(getTodos).patch(1, { done: "yes" });
// @ts-expect-error a target with endpoint params needs setParams first
optimistic(getTodo);
optimistic(getTodo.setParams({ todoId: 1 })).set((todo) => ({ ...todo, done: true }));
```

## Pitfalls checklist

- **Not currying `createRequest`** - error about `parameter of type 'undefined'`; add `()`.
- **Discarding setter results** - `request.setParams(...)` alone changes nothing; the compiler keeps requiring params.
- **Widened endpoint or method** - `let endpoint = ...`, template literals, `method: string` lose params checking or
  fail; use inline literals, `const`, or `HttpMethodsType`.
- **Missing `response`** - `data` becomes `undefined | null` (or `unknown` in `RequestModel`). Always declare it.
- **`new Client<{ error }>`** - compiles with a wrong global error; use `createClient`.
- **Global error without `Error`** - `error.message` may be read from an `AbortError` while typed as your API shape;
  include `Error` and narrow with `instanceof Error`.
- **`success` as a discriminant** - it does not narrow `data`; check `data`.
- **`as` casts** - `createRequest<any>`, `as never` on `send` options or `as RequestInstance` erase the contract. If a
  call does not compile, the request is usually missing a setter result or a generic; fix that instead.
- **`RequestInstance` in schemas or variables** - every omitted slot is `any`; use `RequestModel` for definitions.
- **Optional vs required query params** - `queryParams: Q` forces them on every `send`; use `queryParams?: Q` when the
  endpoint works without them.
- **Payload mapper expectations** - `setPayloadMapper` never changes the payload type callers see; transform shapes with
  a typed helper before `send` if callers should pass another type.
- **Mapper returning bare data** - mappers return full responses; narrow on `success` first.
- **SDK path vs schema endpoint drift** - types follow the schema literal, runtime follows the property path.
- **Generic helpers calling `request.send()`** - unresolved conditional types require an argument; pass
  `{} as RequestSendOptionsType<R>` or accept the options as a parameter.
