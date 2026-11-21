# GraphQL adapter: type safety in depth

Read this when typing GraphQL operations beyond the basics in `SKILL.md`: codegen documents, string documents, adapter
types, error typing, and the patterns that silently lose inference.

## What is typed where

| Request slot  | Source of the type                                                                | Inferred from the document?  |
| ------------- | --------------------------------------------------------------------------------- | ---------------------------- |
| `response`    | `createRequest<{ response }>` generic, else a typed `endpoint` document           | Typed documents only         |
| `payload`     | `createRequest<{ payload }>` generic (the variables), else a typed document       | Typed documents only         |
| `queryParams` | `createRequest<{ queryParams }>` generic                                          | No                           |
| `params`      | `:param` segments of a **string path** `endpoint`                                 | From the endpoint string     |
| `error`       | client global error (`GraphqlErrorType`), plus a request `error` generic          | No                           |
| `endpoint`    | `string \| DocumentNode`                                                          | -                            |
| `document`    | `string \| DocumentNode \| undefined`, GraphQL only                               | -                            |
| `method`      | `GraphqlMethod` enum (`POST`, `GET`)                                              | -                            |
| `options`     | `FetchGraphqlAdapterOptionsType` (`timeout`, `errorPolicy`, `persistedQueries`)   | -                            |
| `extra`       | `GraphQlExtraType` = `{ headers; extensions; errors?: GraphQLFormattedError[] }`  | -                            |

Core helpers read them back: `ExtractResponseType<typeof req>`, `ExtractPayloadType<typeof req>`,
`ExtractAdapterExtraType<GraphqlAdapterType>`, `ExtractAdapterOptionsType<GraphqlAdapterType>`,
`ExtractAdapterRequestOptionsType<GraphqlAdapterType>` (equals `GraphqlRequestOptionsType`, `{ document? }`).

A request with a plain `gql` document and no generics has `response: undefined`, so `data` is `undefined | null`.

## Typed documents (GraphQL Code Generator, gql.tada and friends)

A typed document carries its result and variables types in the `__apiType` decoration. As the `endpoint` it types the
request on its own:

```ts
import { GetUserDocument, ListUsersDocument } from "./gql/graphql"; // generated

const getUser = client.createRequest()({ endpoint: GetUserDocument });
const listUsers = client.createRequest()({ endpoint: ListUsersDocument });

await listUsers.send(); // no variables, no payload needed
const { data } = await getUser.send({ payload: { id: "1" } });
data?.user?.name; // typed from the generated GetUserQuery

// @ts-expect-error `id` is `string` in the generated variables
getUser.send({ payload: { id: 1 } });
// @ts-expect-error the variables are required
getUser.send();
```

- Declared generics win over the document: `createRequest<{ response: Custom }>()({ endpoint: GetUserDocument })`.
- A plain `DocumentNode` stays untyped.
- With the `document` option, or to add other request types, spell the types out with `GraphqlDocumentTypes`:

```ts
import type { GraphqlDocumentTypes } from "@hyper-fetch/graphql";

const tenantUser = client.createRequest<GraphqlDocumentTypes<typeof GetUserDocument> & { queryParams: { v: string } }>()({
  endpoint: "/tenant/:tenantId/GetUser",
  document: GetUserDocument,
});
```

The same decoration types socket listeners of the `GraphqlWsAdapter` through their `document` option - see
[subscriptions.md](subscriptions.md).

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
| Plain `gql` document and no `response` generic               | `data` is `undefined \| null`                                                                     | Typed document, or declare `response`          |
| `payload: any` / `as any` on variables                       | No variable checking at all                                                                       | Generated variables or `ExtractGqlRouteParams` |
| Typed document in the `document` option                      | Only the `endpoint` is read for inference                                                         | `GraphqlDocumentTypes<typeof Doc>` generic     |
| Declaring a request `error` generic for GraphQL errors only  | Aborts, timeouts and network errors are `Error[]`                                                 | Client global error `GraphqlErrorType`         |
| `method: "GET"` string                                       | Compile error                                                                                     | `GraphqlMethod.GET`                            |

## Error typing

Every failure is a list - GraphQL errors, and network, abort and timeout errors wrapped in one:

```ts
import type { GraphqlErrorType } from "@hyper-fetch/graphql";

export const gqlClient = createClient<{ error: GraphqlErrorType }>({
  url: "https://api.example.com/graphql",
}).setAdapter(GraphqlAdapter());

const { error } = await gqlClient.createRequest()({ endpoint: MeDocument }).send();

error?.map((item) => item.message); // GraphQLFormattedError | Error
```

The global type flows into every request, `useFetch` and `useSubmit` state, and `onError` interceptors of that client. A
request-level `error` generic is added to the global one (`LocalError | GlobalError`), it does not replace it.
