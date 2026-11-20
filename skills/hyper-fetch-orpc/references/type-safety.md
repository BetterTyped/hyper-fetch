# oRPC adapter: type safety in depth

Read this when a procedure's types look wrong in the SDK, when typing contract-first APIs, when narrowing errors, when
writing requests without the SDK, or when pinning the API contract in tests. The rules below come from the adapter's
type tests (`OrpcSchema` is checked with `expectTypeOf` and `@ts-expect-error` against real `os` routers, `oc` contracts
and `implement(contract)` routers).

## The pipeline

```
router = { planet: { find: os.input(...).errors(...).handler(...) } }      or   contract = { planet: { find: oc... } }
        │ typeof router / RouterClient<typeof router>                            │ ContractRouterClient<typeof contract>
OrpcSchema<...>                                   maps every procedure to { $query, $mutation }
        │
createSdk<typeof client, OrpcSchema<...>>(client, { camelCaseToKebabCase: false })
        │
api.planet.find.$query                            Request<Output, Input, ..., ProcedureError, "/planet/find", typeof client>
        │
send() / useFetch() / useSubmit()                 data, error and payload typed
```

`OrpcSchema<Router extends AnyRouter | NestedClient<any>>` takes one of:

| You have                                   | Pass                                                    | Needs `@orpc/server` |
| ------------------------------------------ | ------------------------------------------------------- | -------------------- |
| A router built with `os`                   | `OrpcSchema<typeof router>`                             | Yes (types)          |
| The router's client type                   | `OrpcSchema<RouterClient<typeof router>>` (same result) | Yes (types)          |
| A contract built with `oc`                 | `OrpcSchema<ContractRouterClient<typeof contract>>`     | No                   |
| A router from `implement(contract).router` | `OrpcSchema<typeof router>`                             | Yes (types)          |

```ts
// @ts-expect-error a string is not a router
type Broken = OrpcSchema<string>;
```

The client type is injected by `createSdk`, so the client's global error and the `OrpcAdapterType` options apply to
every procedure.

## Inference per procedure

Every procedure gets both leaves, with identical types: `$query` (method `QUERY`, deduplicated) and `$mutation` (method
`MUTATION`). Procedures that return an event iterator are omitted. Procedures that only throw are kept.

| Input schema                                            | `payload` type                            | Required before `send()` |
| ------------------------------------------------------- | ----------------------------------------- | ------------------------ |
| none                                                    | `undefined`                               | No                       |
| `z.object({ id: z.number() })`                          | `{ id: number }`                          | Yes                      |
| `z.object({ limit: z.number().optional() }).optional()` | `{ limit?: number \| undefined }`         | No                       |
| `z.number()`                                            | `number`                                  | Yes                      |
| discriminated union, `.nullable()`, `z.array()`         | kept as is                                | Yes                      |
| `z.string().transform((v) => v.length)`                 | `string` (input **before** the transform) | Yes                      |
| `z.object({ date: z.date(), total: z.bigint() })`       | `{ date: Date; total: bigint }`           | Yes                      |
| `z.object({ file: z.instanceof(Blob) })`                | `{ file: Blob }` (sent as multipart)      | Yes                      |

| Output                                 | `response` type                                  |
| -------------------------------------- | ------------------------------------------------ |
| plain value                            | the value type (`"ok" as const` stays a literal) |
| `Date`, `bigint`, `Set`, `Map`, `File` | kept, the serializer restores them at runtime    |
| nothing returned                       | `unknown`                                        |
| `.output(schema)` in a contract        | the output schema type                           |

Unlike tRPC, rich types need no option: the oRPC serializer is always on. Only custom classes need
`customJsonSerializers` on both sides.

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
// @ts-expect-error wrong input type
submit({ payload: { id: 1 } });

// @ts-expect-error POST is the wire method, not a method of this adapter
client.createRequest()({ endpoint: "health", method: "POST" });

OrpcAdapter({ queryMethod: "GET" });
// @ts-expect-error mutations always use POST, other methods are not supported
OrpcAdapter({ queryMethod: "PUT" });
client.createRequest()({ endpoint: "health" }).setOptions({ queryMethod: "GET", timeout: 1 });
// @ts-expect-error unknown method
client.createRequest()({ endpoint: "health" }).setOptions({ queryMethod: "DELETE" });

api.$configure({ "*": { retry: 1 }, "camelCaseName.$query": { cache: false } }); // keys validated
```

`useFetch(api.user.byId.$query.setPayload({ id: 1 })).data` is `User | null`, and so is `useSubmit(...).data`.

## Error typing

For a procedure with `.errors({ NOT_FOUND: { data: z.object({ id: z.number() }) } })` the local error is:

```ts
| (OrpcErrorType<"NOT_FOUND", { id: number }> & { defined: true })
| (OrpcErrorType & { defined: false }) // any other error, data: unknown
// OrpcErrorType<Code, Data> = { defined: boolean; code: Code; status: number; message: string; data: Data }
```

A procedure without `.errors()` has only the `defined: false` member. `response.error` adds the client's global error
(`Error` by default: network, abort, timeout), so narrow in two steps:

```ts
const { error } = await api.user.byId.$query.setPayload({ id: 99 }).send();

if (error && "defined" in error) {
  if (error.defined && error.code === "NOT_FOUND") {
    error.data.id; // number
  } else {
    error.data; // unknown
  }
} else if (error) {
  error.message; // transport-level Error
}
```

The same narrowing works in `useFetch(...).error`, `useSubmit(...).error` and `setRetryOnError(({ error }) => ...)`.

## Requests without the SDK

Nothing is inferred without the SDK. Reuse the router's types with oRPC's helpers and type the error with
`OrpcErrorType`:

```ts
import type { InferRouterInputs, InferRouterOutputs } from "@orpc/server";
import type { OrpcErrorType } from "@hyper-fetch/orpc";

type Inputs = InferRouterInputs<typeof router>;
type Outputs = InferRouterOutputs<typeof router>;

const findPlanet = client.createRequest<{
  response: Outputs["planet"]["find"];
  payload: Inputs["planet"]["find"];
  error: OrpcErrorType<"NOT_FOUND", { id: number }>;
}>()({ endpoint: "planet/find", method: "QUERY" });
```

## Patterns that lose inference

| Pattern                                                                  | Effect                                       | Fix                                                   |
| ------------------------------------------------------------------------ | -------------------------------------------- | ----------------------------------------------------- |
| `const router: AnyRouter = {...}` or `router as any`                     | Procedure types widen, nothing is checked    | Let TypeScript infer, use `typeof router`             |
| Passing the contract itself to `OrpcSchema`                              | Not the documented shape                     | `OrpcSchema<ContractRouterClient<typeof contract>>`   |
| `import { router } from "server"` in client code                         | Types fine, server code in the bundle        | `import type { router }` / export a type alias        |
| Hand-typed `createRequest` with `payload: any`                           | Input mismatches compile                     | `InferRouterInputs` as above                          |
| Reading `error.code` / `error.data` without narrowing                    | Compile error on `Error \| OrpcError`        | `"defined" in error`, then `defined` and `code`       |
| Expecting `error.data` typed for errors thrown with `new ORPCError(...)` | `defined: false`, `data: unknown`            | Declare them in `.errors()` and throw `errors.CODE()` |
| `{ camelCaseToKebabCase: true }` (the `createSdk` default)               | Types fine, runtime URL `/planet/find-by-id` | `{ camelCaseToKebabCase: false }`                     |

## Pinning the contract in tests

```ts
import type {
  ExtractEndpointType,
  ExtractLocalErrorType,
  ExtractPayloadType,
  ExtractResponseType,
} from "@hyper-fetch/core";
import { expectTypeOf } from "vitest";

type Find = (typeof api)["planet"]["find"]["$query"];

expectTypeOf<ExtractPayloadType<Find>>().toEqualTypeOf<{ id: number }>();
expectTypeOf<ExtractResponseType<Find>>().toEqualTypeOf<Planet>();
expectTypeOf<ExtractEndpointType<Find>>().toEqualTypeOf<"/planet/find">();
expectTypeOf<Extract<ExtractLocalErrorType<Find>, { defined: true }>["data"]>().toEqualTypeOf<{ id: number }>();
```
