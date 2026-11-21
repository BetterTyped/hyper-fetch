# tRPC adapter: type safety in depth

Read this when a procedure's types look wrong in the SDK, when typing errors, when writing requests without the SDK, or
when pinning the router contract in tests. The rules below come from the adapter's type tests (`TrpcSchema` is checked
with `expectTypeOf` and `@ts-expect-error` against real `initTRPC` routers).

## The pipeline

```
initTRPC.create(...).router({...})            server: router value
        │ export type AppRouter = typeof appRouter
TrpcSchema<AppRouter>                         walks Router["_def"]["record"] into a createSdk schema
        │
createSdk<typeof client, TrpcSchema<AppRouter>>(client, { camelCaseToKebabCase: false })
        │
api.user.byId.$query                          Request<Output, Input, ..., ErrorShape, "/user/byId", typeof client>
        │
send() / useFetch() / useSubmit()             data, error and payload typed
```

`TrpcSchema<Router extends AnyTRPCRouter>` has one parameter, the router type. The client type is injected by
`createSdk`, so the client's global error and the `TrpcAdapterType` options apply to every procedure.

## Inference per procedure

| Router                                        | SDK                                          |
| --------------------------------------------- | -------------------------------------------- |
| `t.procedure.query(...)`                      | `$query` leaf only                           |
| `t.procedure.mutation(...)`                   | `$mutation` leaf only                        |
| `t.procedure.subscription(...)`               | omitted, a `$listener` in `TrpcSocketSchema` |
| nested `t.router`, `t.mergeRouters`, `lazy()` | nested keys, endpoint `"/a/b/c/leaf"`        |
| `camelCaseName`                               | key and endpoint keep `camelCaseName`        |

| Input                               | `payload` type       | Must be set before `send()` |
| ----------------------------------- | -------------------- | --------------------------- |
| no `.input()`                       | `undefined`          | No                          |
| `{ id: number }`                    | `{ id: number }`     | Yes                         |
| `{ limit?: number } \| undefined`   | `{ limit?: number }` | No                          |
| union, `string \| null`, `number[]` | kept as is           | Yes                         |

| Output                                  | `response` type                                             |
| --------------------------------------- | ----------------------------------------------------------- |
| plain value                             | the value type (`"ok"` literal stays a literal)             |
| `Date` **without** a router transformer | `string` (the JSON form, `inferTransformedProcedureOutput`) |
| `Date`, `Set` **with** `superjson`      | `Date`, `Set<string>`                                       |
| nothing returned                        | `unknown`                                                   |

The output type follows the **server** router's transformer. The adapter's `transformer` option has no effect on types,
so `TrpcAdapter({ transformer: superjson })` must be set whenever the router uses one, or `data.createdAt` is typed
`Date` but is a string at runtime.

`TrpcAdapter({ transformer })` requires both directions:

```ts
TrpcAdapter({ transformer: { serialize: (value) => value, deserialize: (value) => value } });
// @ts-expect-error both serialize and deserialize are required
TrpcAdapter({ transformer: { serialize: (value: unknown) => value } });
```

## Subscriptions (`TrpcSocketSchema`)

`TrpcSocketSchema<AppRouter>` is the mirror of `TrpcSchema` for `createSocketSdk`: it keeps only subscription procedures
and gives each one a `$listener`.

| Listener slot | Inferred as                                                                               |
| ------------- | ----------------------------------------------------------------------------------------- |
| `response`    | what the procedure yields (async generator) or emits (observable), after the transformer  |
| `tracked()`   | unwrapped: `tracked(id, data)` reaches listeners as `data`, the id is in `extra.eventId`  |
| `payload`     | the procedure input, required only when the input is required, not taken without an input |
| `topic`       | the procedure path with slashes, `"chat/onMessage"`                                       |
| `extra`       | `TrpcSocketExtraType`: `{ eventId: string \| null; payload: unknown }`                    |

A procedure that yields its own `{ id: string; data: T }` objects (exactly those two keys) is typed as tracked and
unwrapped to `T`. Wrap events with `tracked()` or use other field names.

```ts
const realtime = createSocketSdk<typeof socket, TrpcSocketSchema<AppRouter>>(socket, { camelCaseToKebabCase: false });

// @ts-expect-error the input is required
realtime.chat.onMessage.$listener.listen(() => {});
// @ts-expect-error queries and mutations are not listeners
realtime.user.byId;
```

## What the compiler rejects

```ts
api.health.$query.send();
api.user.list.$query.send();
api.user.byId.$query.send({ payload: { id: 1 } });

// @ts-expect-error the input is required
api.user.byId.$query.send();
// @ts-expect-error wrong input type
api.user.byId.$query.setPayload({ id: "1" });
// @ts-expect-error wrong input type
api.user.create.$mutation.setPayload({ id: 1 });

const { submit } = useSubmit(api.user.create.$mutation);
submit({ payload: { name: "John" } });
// @ts-expect-error wrong input type
submit({ payload: { id: 1 } });

// @ts-expect-error GET is not a method of this adapter
client.createRequest()({ endpoint: "health", method: "GET" });

api.$configure({ "*": { retry: 1 }, "merged.$query": { cache: false } }); // keys validated against the schema
```

`useFetch(api.user.byId.$query.setPayload({ id: 1 })).data` is `User | null`, and so is `useSubmit(...).data` for a
mutation returning `User`.

## Error typing

The local error of every SDK request is the router's error shape:

```ts
type ById = (typeof api)["user"]["byId"]["$query"];
type Shape = ExtractLocalErrorType<ById>;
// { message: string; code: number; data: { code: string; httpStatus: number; path?: string; stack?: string } }
// plus every field your errorFormatter adds, e.g. data.requestId
```

`response.error` is `LocalError | GlobalError | null`. The global error is `Error` by default (network, abort, timeout),
so reading `error.data` directly does not compile. Narrow first:

```ts
const { error } = await api.user.byId.$query.setPayload({ id: 1 }).send();

if (error && "data" in error) {
  error.data.code; // string, e.g. "NOT_FOUND"
  error.data.httpStatus;
} else if (error) {
  error.message; // transport-level Error
}
```

Same narrowing in hooks (`useFetch(...).error`) and in `setRetryOnError(({ error }) => ...)`.

## Requests without the SDK

The SDK is optional, but then nothing is inferred. Type by hand and reuse the router's types:

```ts
import type { inferRouterInputs, inferRouterOutputs } from "@trpc/server";
import type { TrpcErrorType } from "@hyper-fetch/trpc";

type Inputs = inferRouterInputs<AppRouter>;
type Outputs = inferRouterOutputs<AppRouter>;

const getUser = client.createRequest<{
  response: Outputs["user"]["byId"];
  payload: Inputs["user"]["byId"];
  error: TrpcErrorType;
}>()({ endpoint: "user.byId", method: "QUERY" });
```

`TrpcErrorType<Data = TrpcErrorDataType>` is the default tRPC error shape. Pass your formatter's data type as `Data`.

## Patterns that lose inference

| Pattern                                                | Effect                                             | Fix                                             |
| ------------------------------------------------------ | -------------------------------------------------- | ----------------------------------------------- |
| `const appRouter: AnyTRPCRouter = t.router({...})`     | Procedure types widen to `any`, nothing is checked | Let TypeScript infer, export `typeof appRouter` |
| `appRouter as any`, `TrpcSchema<any>`                  | No checking at all                                 | `TrpcSchema<typeof appRouter>`                  |
| `import { appRouter } from "server"` in client code    | Types fine, server code in the bundle              | `import type { AppRouter }`                     |
| `@trpc/server` v10 in the project                      | `TrpcSchema` does not compile (v11 types)          | tRPC v11 (peer `^11.0.0`)                       |
| Hand-typed `createRequest` with `payload: any`         | Input mismatches compile                           | `inferRouterInputs` as above                    |
| Router uses `superjson`, adapter does not              | Types say `Date`, runtime gives `string`           | `TrpcAdapter({ transformer: superjson })`       |
| Reading `error.data` without narrowing                 | Compile error on `Error \| Shape`                  | `"data" in error`                               |
| Passing `{ camelCaseToKebabCase: true }` (the default) | Types fine, runtime URL `user.by-id`               | `{ camelCaseToKebabCase: false }`               |

## Pinning the contract in tests

```ts
import type { ExtractEndpointType, ExtractPayloadType, ExtractResponseType } from "@hyper-fetch/core";
import { expectTypeOf } from "vitest";

type Api = typeof api;

expectTypeOf<ExtractResponseType<Api["user"]["byId"]["$query"]>>().toEqualTypeOf<User>();
expectTypeOf<ExtractPayloadType<Api["user"]["byId"]["$query"]>>().toEqualTypeOf<{ id: number }>();
expectTypeOf<ExtractEndpointType<Api["user"]["byId"]["$query"]>>().toEqualTypeOf<"/user/byId">();
expectTypeOf<Api["user"]["byId"]>().not.toHaveProperty("$mutation");
```
