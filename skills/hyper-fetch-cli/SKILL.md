---
name: hyper-fetch-cli
description:
  Using @hyper-fetch/cli (the hyper-fetch binary) to generate a fully typed HyperFetch SDK from an OpenAPI 3 or Swagger
  JSON schema. Covers the init command and api.json config (aliases, tsx, tsconfig paths), the generate command and its
  exact flags (--template openapi|swagger, --url remote URL or local .json path, --fileName, --overwrite, --cwd),
  non-interactive and CI usage, regenerating and keeping types in sync with the backend, what the generated file
  contains (Components and Paths namespaces, per-operation ResponseType, RequestBody, QueryParams, PathParams and
  ErrorType aliases, the SdkSchema of RequestModel entries, a createSdk factory), how it plugs into createSdk generics,
  $configure, send(), useFetch and useSubmit, and type tests for generated SDKs. Use when a user wants to generate a
  HyperFetch client or SDK from OpenAPI/Swagger, asks about npx @hyper-fetch/cli, api.json, sdk.$get / $post paths,
  regenerating an API client, or codegen in CI.
---

# @hyper-fetch/cli: OpenAPI to typed SDK

The CLI reads an OpenAPI 3.x (or Swagger) **JSON** document and writes one TypeScript file with every schema type, every
operation's request/response types, an `SdkSchema` type and a `createSdk(client)` factory. You keep the `Client` in your
own code (base URL, auth, adapters, plugins); the generated file contributes only types plus a thin wrapper over
`createSdk` from `@hyper-fetch/core`. Runtime behavior is plain HyperFetch, so everything from the `hyper-fetch-core`
and `hyper-fetch-react` skills applies to the generated requests.

## Install and run

```bash
npm install -D @hyper-fetch/cli
npm install @hyper-fetch/core
```

The binary is `hyper-fetch`. Without a command it opens an interactive picker; `npx @hyper-fetch/cli@latest <command>`
works without installing. Pin the version in projects and CI so regenerated output is reproducible.

Requirements in the working directory (`--cwd`, default `process.cwd()`): a `package.json` and a `tsconfig.json`.
`generate` exits with an error without them.

## `init`

```bash
npx hyper-fetch init            # asks for the main directory (src, app, other) and the API folder name (api)
npx hyper-fetch init --yes      # defaults: src/api
```

| Flag           | Meaning                                        |
| -------------- | ---------------------------------------------- |
| `-y`, `--yes`  | Skip prompts, use `src` + `api`                |
| `-c`, `--cwd`  | Working directory (default: current directory) |
| `-h`, `--help` | Print options                                  |

It creates the API directory and writes `api.json`:

```json
{
  "tsx": true,
  "aliases": {
    "api": "@/api",
    "hooks": "@/hooks",
    "ui": "@/components/ui",
    "components": "@/components",
    "lib": "@/lib"
  }
}
```

- The alias prefix (`@`) is detected from `tsconfig.json` `compilerOptions.paths` (for example `"@/*": ["./src/*"]`).
  Without `paths` the aliases have no prefix (`"api": "api"`).
- `generate` writes into `aliases.api` **resolved through tsconfig paths / baseUrl**. Check that the alias points to the
  folder you expect; `"@/*": ["./src/*"]` with `"api": "@/api"` writes to `src/api`.
- `tsx: true` gives a `.ts` file, `false` a `.js` file (when `--fileName` has no extension).
- Running `generate` without an `api.json` auto-initializes with the `--yes` defaults first.
- Only `api` is used by `generate` today; the other aliases are reserved.

## `generate`

```bash
npx hyper-fetch generate \
  --template openapi \
  --url https://api.example.com/openapi.json \
  --fileName api.sdk.ts \
  --overwrite
```

| Flag                      | Meaning                                                                             |
| ------------------------- | ----------------------------------------------------------------------------------- |
| `-t`, `--template <name>` | `openapi` or `swagger` (same generator; prefer OpenAPI 3.x input)                   |
| `-u`, `--url <source>`    | `http(s)` URL fetched with a plain GET, or a local `.json` path relative to `--cwd` |
| `-f`, `--fileName <name>` | File name inside the `api` directory (default prompt value `api-<template>.sdk.ts`) |
| `-o`, `--overwrite`       | Replace an existing file without asking                                             |
| `-c`, `--cwd <dir>`       | Working directory (default: current directory)                                      |
| `-h`, `--help`            | Print options                                                                       |

- There is **no `--output` flag** and `-o` means `--overwrite`. The output location comes from `api.json`; `--fileName`
  is only the file name.
- Any missing value is asked interactively. Pass all of `-t`, `-u`, `-f` and `-o` in scripts and CI so it never prompts.
- Remote schemas are fetched without auth headers. For protected schemas, download the JSON first (with your own auth)
  and pass the local path. YAML is not supported; convert to JSON.
- Operations without `operationId` are included; their type names are derived from method and path
  (`GET /users/{userId}/posts-list` gives `GetUsers$userIdPostsList...`).

## What gets generated

For the path `/users/{userId}/posts-list` with `get` (query `page` required, 200 and 404 responses) and `post`
(`operationId: createPost`):

```ts
import { createSdk as coreCreateSdk } from "@hyper-fetch/core";
import type { ClientInstance, RequestModel } from "@hyper-fetch/core";

declare namespace Components {
  namespace Schemas {
    export interface User {
      id?: string;
    }
  }
}
declare namespace Paths {
  /* request bodies, parameters and responses per operation */
}

export type GetUsers$userIdPostsListPathParams = Paths.Users$UserIdPostsList.PathParameters;
export type GetUsers$userIdPostsListQueryParams = Paths.Users$UserIdPostsList.Get.QueryParameters;
export type GetUsers$userIdPostsListErrorType = Paths.Users$UserIdPostsList.Get.Responses.$404;
export type GetUsers$userIdPostsListResponseType = Paths.Users$UserIdPostsList.Get.Responses.$200;
export type CreatePostRequestBody = Paths.CreatePost.RequestBody;
export type CreatePostErrorType = undefined;
export type CreatePostResponseType = Paths.CreatePost.Responses.$201;

export type SdkSchema = {
  users: {
    $userId: {
      postsList: {
        $get: RequestModel<{
          response: GetUsers$userIdPostsListResponseType;
          queryParams: GetUsers$userIdPostsListQueryParams;
          error: GetUsers$userIdPostsListErrorType;
          endpoint: "/users/:userId/posts-list";
        }>;
        $post: RequestModel<{
          response: CreatePostResponseType;
          payload: CreatePostRequestBody;
          error: CreatePostErrorType;
          endpoint: "/users/:userId/posts-list";
        }>;
      };
    };
  };
};

export type { Components };

export const createSdk = <Client extends ClientInstance>(
  client: Client,
  options?: Parameters<typeof coreCreateSdk>[1] | undefined,
) => {
  return coreCreateSdk<Client, SdkSchema>(client, options);
};
```

How schema parts map to types:

| OpenAPI                | Generated                                                                                            |
| ---------------------- | ---------------------------------------------------------------------------------------------------- |
| `components.schemas.X` | `Components.Schemas.X` (exported namespace)                                                          |
| 2xx responses          | `<Op>ResponseType` (union of all 2xx bodies; `any` when none is described)                           |
| 4xx / 5xx responses    | `<Op>ErrorType` (union; `undefined` when none, so only the client's global error applies)            |
| `requestBody`          | `<Op>RequestBody` → `payload`                                                                        |
| query parameters       | `<Op>QueryParams` → `queryParams` (required key if any query param is required, else `queryParams?`) |
| path parameters        | `<Op>PathParams` (exported for your use; `params` itself is typed from the `endpoint` string)        |
| path `/a/{id}/b-c`     | endpoint `"/a/:id/b-c"`, SDK keys `a.$id.bC`                                                         |
| HTTP method            | `$get`, `$post`, `$put`, `$patch`, `$delete`, ... on the path node                                   |
| root path `/`          | `sdk.$get` at the top level                                                                          |

The `SdkSchema` is the generic that drives every SDK type: `createSdk` calls `coreCreateSdk<Client, SdkSchema>`, and
each `RequestModel<{...}>` becomes a fully typed `Request` bound to your client. Kebab-case path segments become
camelCase keys and `createSdk` (with its default `camelCaseToKebabCase: true`) maps them back to the URL. Method keys
are upper-cased by the default `methodTransform`.

## Using the generated SDK

```ts
// src/api/sdk.ts
import { createClient } from "@hyper-fetch/core";
import { createSdk } from "./api.sdk";

export const client = createClient<{ error: { message: string } }>({ url: "https://api.example.com" });

export const sdk = createSdk(client).$configure({
  "*": { retry: 2 },
  "users.$userId.postsList.$get": { staleTime: 60_000 },
});
```

```ts
const { data, error, status } = await sdk.users.$userId.postsList.$get.send({
  params: { userId: "1" },
  queryParams: { page: 1 },
});
// data: Components.Schemas.User | null - send() resolves, errors come through `error`

await sdk.users.$userId.postsList.$post.send({ params: { userId: "1" }, payload: { id: "2" } });
```

```tsx
import { useFetch, useSubmit } from "@hyper-fetch/react";

export function Posts({ userId }: { userId: string }) {
  const { data, loading } = useFetch(
    sdk.users.$userId.postsList.$get.setParams({ userId }).setQueryParams({ page: 1 }),
  );
  const { submit, submitting } = useSubmit(sdk.users.$userId.postsList.$post.setParams({ userId }));

  if (loading) return <p>Loading...</p>;
  return (
    <button type="button" disabled={submitting} onClick={() => submit({ payload: { id: "2" } })}>
      Add ({data?.id})
    </button>
  );
}
```

- Configure endpoints with `sdk.$configure({...})`, not with the `options.defaults` argument of the generated
  `createSdk`: `$configure` keys are type-checked against `SdkSchema` (typos fail to compile), the generated `options`
  parameter is typed loosely and accepts any key.
- Every property access (`sdk.users.$get`) creates a new request. Store it in a variable if you need the same instance
  (for example to attach a mock); see `hyper-fetch-testing` for mocking SDK endpoints with `$configure`.
- Auth, base URL per environment, interceptors and plugins belong on the client, never in the generated file.

## Golden rules

1. **Never edit the generated file by hand.** The next `generate --overwrite` erases the edit. Customize through the
   client, `$configure`, response mappers on the request, or wrapper modules that import the generated types.
2. **Regenerate instead of patching types.** When the backend changes, update the schema and rerun `generate`; let `tsc`
   show every call site that broke. That is the point of generated types.
3. **Commit the generated file** (or generate it before `tsc` in every build) so type checks always run against the
   schema the code was written for.
4. **Pin the CLI version** (`@hyper-fetch/cli@<version>` in devDependencies), since generator changes alter output.
5. **Exclude the generated file from formatters and lint autofix** and do not lint it for style. Its `RequestModel`
   schema is not checked by `hyper-fetch-eslint` / `hyper-fetch-oxlint` (they check `createRequest` / `createClient`
   generics), so cover it with type tests instead.
6. **Keep the schema accurate.** Missing 2xx bodies become `any` responses and missing 4xx/5xx bodies leave only the
   global error type; fix the OpenAPI document rather than casting in app code.

## Keeping types in sync

```json
{
  "scripts": {
    "api:generate": "hyper-fetch generate -t openapi -u ./openapi.json -f api.sdk.ts -o",
    "api:check": "npm run api:generate && git diff --exit-code -- src/api/api.sdk.ts"
  }
}
```

CI job:

```yaml
- run: npm ci
- run: npm run api:check # fails when the committed SDK is stale
- run: npx tsc --noEmit # fails when app code no longer matches the schema
```

For a remote schema, fetch it into the repo first (`curl -fsSL "$SCHEMA_URL" -o openapi.json`, with any auth header your
API needs), then generate from the local file so the job is deterministic and reviewable.

Add type tests for critical endpoints so a schema change that silently widens a type (for example a response turning
into `any`) is caught:

```ts
import type { ExtractPayloadType, ExtractResponseType } from "@hyper-fetch/core";
import { expectTypeOf } from "vitest";
import type { Components, GetUsers$userIdPostsListResponseType } from "src/api/api.sdk";
import { sdk } from "src/api/sdk";

it("matches the API contract", () => {
  expectTypeOf<
    ExtractResponseType<typeof sdk.users.$userId.postsList.$get>
  >().toEqualTypeOf<GetUsers$userIdPostsListResponseType>();
  expectTypeOf<ExtractPayloadType<typeof sdk.users.$userId.postsList.$post>>().toEqualTypeOf<Components.Schemas.User>();
});
```

## Pitfalls

| Problem                                                 | Cause and fix                                                                                                                     |
| ------------------------------------------------------- | --------------------------------------------------------------------------------------------------------------------------------- |
| `error: unknown option '--output'`                      | No such flag. Set the folder in `api.json` (`aliases.api`), pass the name with `-f`                                               |
| File written to an unexpected folder                    | `aliases.api` resolves through tsconfig `paths`; fix the alias or the paths mapping                                               |
| `Failed to load tsconfig.json`                          | Add a `tsconfig.json` to `--cwd`                                                                                                  |
| CI hangs or fails on a prompt                           | A flag is missing; pass `-t`, `-u`, `-f` and `-o`                                                                                 |
| Existing SDK replaced without a prompt                  | The overwrite prompt checks `<cwd>/<fileName>`, not the `api` folder. Always decide with `-o` explicitly and keep the file in git |
| `Cannot reach the server`                               | Schema URL unreachable; download it and use a local path                                                                          |
| `Schema validation failed ... cannot end with '/'`      | Broken `$ref` in the schema; fix the document                                                                                     |
| Docs or README show `sdk.users.get` or `sdk.users.list` | Generated keys are `$get`, `$post`, ... on path nodes: `sdk.users.$get`                                                           |

## Related

- `hyper-fetch-core`: `createSdk`, `$configure`, requests and the client.
- `hyper-fetch-react`: `useFetch`, `useSubmit` with SDK requests.
- `hyper-fetch-testing`: mocking SDK endpoints and type-level tests.

Docs: https://hyperfetch.bettertyped.com/docs/cli/overview, https://hyperfetch.bettertyped.com/docs/cli/commands/init,
https://hyperfetch.bettertyped.com/docs/cli/commands/generate, https://hyperfetch.bettertyped.com/docs/core/sdk
