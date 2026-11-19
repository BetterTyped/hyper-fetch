# GraphQL adapter: type safety in depth

Read this when typing GraphQL operations beyond the basics in `SKILL.md`: codegen documents, string documents, adapter
types, error typing, and the patterns that silently lose inference.

## What is typed where

| Request slot  | Source of the type                                                               | Inferred from the document? |
| ------------- | -------------------------------------------------------------------------------- | --------------------------- |
| `response`    | `createRequest<{ response }>` generic                                            | No                          |
| `payload`     | `createRequest<{ payload }>` generic (the variables)                             | No                          |
| `queryParams` | `createRequest<{ queryParams }>` generic                                         | No                          |
| `params`      | `:param` segments of a **string path** `endpoint`                                | From the endpoint string    |
| `error`       | client global error, plus a request `error` generic                              | No                          |
| `endpoint`    | `string \| DocumentNode`                                                         | -                           |
| `document`    | `string \| DocumentNode \| undefined`, GraphQL only                              | -                           |
| `method`      | `GraphqlMethod` enum (`POST`, `GET`)                                             | -                           |
| `options`     | `FetchGraphqlAdapterOptionsType`                                                 | -                           |
| `extra`       | `GraphQlExtraType` = `{ headers: HeadersInit; extensions: Record<string, any> }` | -                           |

Core helpers read them back: `ExtractResponseType<typeof req>`, `ExtractPayloadType<typeof req>`,
`ExtractAdapterExtraType<GraphqlAdapterType>`, `ExtractAdapterOptionsType<GraphqlAdapterType>`,
`ExtractAdapterRequestOptionsType<GraphqlAdapterType>` (equals `GraphqlRequestOptionsType`, `{ document? }`).

A request with no generics has `response: undefined`, so `data` is `undefined | null`. Always declare `response`.

## Typed documents (GraphQL Code Generator, gql.tada and friends)

The adapter accepts a `TypedDocumentNode` anywhere a `DocumentNode` is accepted, but does not read its result and
variables types. Lift them into the generics once, in a small factory:

```ts
import { createClient } from "@hyper-fetch/core";
import { GraphqlAdapter } from "@hyper-fetch/graphql";
import type { TypedDocumentNode } from "@graphql-typed-document-node/core";

import { GetUserDocument, ListUsersDocument } from "./gql/graphql"; // generated

export const client = createClient({ url: "https://api.example.com/graphql" }).setAdapter(GraphqlAdapter());

/** Codegen types operations without variables as `{ [key: string]: never }`, which would force `send({ payload: {} })` */
type OperationPayload<Variables> = string extends keyof Variables ? undefined : Variables;

export const createOperation = <Result, Variables>(document: TypedDocumentNode<Result, Variables>) =>
  client.createRequest<{ response: Result; payload: OperationPayload<Variables> }>()({ endpoint: document });

export const getUser = createOperation(GetUserDocument);
export const listUsers = createOperation(ListUsersDocument);

await listUsers.send(); // no variables, no payload needed
const { data } = await getUser.send({ payload: { id: "1" } });
data?.user?.name; // typed from the generated GetUserQuery

// @ts-expect-error `id` is `string` in the generated variables
getUser.send({ payload: { id: 1 } });
// @ts-expect-error the variables are required
getUser.send();
```

Without the factory, pass the generated types directly:

```ts
import type { GetUserQuery, GetUserQueryVariables } from "./gql/graphql";

const getUserById = client.createRequest<{ response: GetUserQuery; payload: GetUserQueryVariables }>()({
  endpoint: GetUserDocument,
});
```

To get a per-path URL (the `document` option) from the factory, add the path as an argument and pass
`{ endpoint: path, document }`. The `:param` segments of `path` type `setParams()` only when `path` is a string literal
type, so make the factory generic over it (`<Path extends string>(path: Path, ...)`).

## Variables from a string document: `ExtractGqlRouteParams`

`ExtractGqlRouteParams<Doc>` parses the variable list of a string literal type. Required (`!`) variables become required
keys, the rest optional. Values are loose: `boolean | string | number | Record<string, any> | null | undefined`, so it
checks names, not GraphQL scalar types.

```ts
import type { ExtractGqlRouteParams } from "@hyper-fetch/graphql";

const USER_QUERY = "query User($id: ID!, $name: String) { user(id: $id, name: $name) { id } }";

const findUser = client.createRequest<{
  response: { user: { id: string } };
  payload: ExtractGqlRouteParams<typeof USER_QUERY>;
}>()({
  endpoint: "/User",
  document: USER_QUERY,
});

findUser.setPayload({ id: 1 });
findUser.setPayload({ id: "1", name: "Ann" });
// @ts-expect-error `id` is required by the document
findUser.setPayload({ name: "Ann" });
```

Use it with the `document` option. Do not put the literal in `endpoint` (next section).

## What the compiler rejects

```ts
import { createClient } from "@hyper-fetch/core";
import { GraphqlMethod } from "@hyper-fetch/graphql";

// @ts-expect-error `document` exists only on clients using GraphqlAdapter
createClient({ url: "" }).createRequest()({ endpoint: "/User", document: "query User { id }" });

// @ts-expect-error methods are the GraphqlMethod enum, not strings
client.createRequest()({ endpoint: GetUserDocument, method: "GET" });
client.createRequest()({ endpoint: GetUserDocument, method: GraphqlMethod.GET });

// @ts-expect-error `body`, `method`, `headers`, `signal` belong to the adapter
client.createRequest()({ endpoint: GetUserDocument, options: { body: "x" } });

const tenantUser = client.createRequest()({ endpoint: "/tenant/:tenantId/User", document: GetUserDocument });
tenantUser.setParams({ tenantId: 1 });
// @ts-expect-error params come from the path
tenantUser.setParams({ other: 1 });

const withQuery = client.createRequest<{ queryParams: { source: string } }>()({ endpoint: GetUserDocument });
// @ts-expect-error declared query params are checked
withQuery.setQueryParams({ source: 1 });
```

## Patterns that lose or break inference

| Pattern                                                      | Effect                                                                                            | Do instead                                     |
| ------------------------------------------------------------ | ------------------------------------------------------------------------------------------------- | ---------------------------------------------- |
| `endpoint: "query GetUser($id: ID!) {...}"` (string literal) | Core reads `:` as a URL param: `send()` demands `params: { " ID!) {...": ... }` and `queryParams` | `gql`, `as string`, or `document`              |
| No `response` generic                                        | `data` is `undefined \| null`                                                                     | Declare it, or use the codegen factory         |
| `payload: any` / `as any` on variables                       | No variable checking at all                                                                       | Generated variables or `ExtractGqlRouteParams` |
| Passing `TypedDocumentNode` and expecting inference          | Result and variables are ignored                                                                  | Factory above                                  |
| Declaring a request `error` generic for GraphQL errors only  | Aborts and network errors are `Error[]`, timeouts a single `Error`                                | Client global error `GraphQlError[] \| Error`  |
| `method: "GET"` string                                       | Compile error                                                                                     | `GraphqlMethod.GET`                            |
| Factory with `path: string` instead of a generic `Path`      | `setParams()` loses the param names                                                               | `<Path extends string>(path: Path)`            |

## Error typing

Every failure is an array except the timeout:

```ts
type GraphQlError = {
  message: string;
  path?: (string | number)[];
  locations?: { line: number; column: number }[];
  extensions?: Record<string, unknown>;
};

export const gqlClient = createClient<{ error: GraphQlError[] | Error }>({
  url: "https://api.example.com/graphql",
}).setAdapter(GraphqlAdapter());

const { error } = await gqlClient
  .createRequest<{ response: { me: { id: string } } }>()({ endpoint: MeDocument })
  .send();

if (Array.isArray(error)) {
  // GraphQL errors, or [AbortError] / [TypeError] / [UnexpectedError] wrapped in a list
  error.map((item) => item.message);
} else if (error) {
  error.message; // TimeoutError
}
```

The global type flows into every request, `useFetch` and `useSubmit` state, and `onError` interceptors of that client. A
request-level `error` generic is added to the global one (`LocalError | GlobalError`), it does not replace it.
