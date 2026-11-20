---
name: hyper-fetch-oxlint
description:
  Setup and rules of oxlint-plugin-hyper-fetch, the Oxlint JS plugin that guards HyperFetch type safety by validating
  the generics passed to createClient and client.createRequest. Covers installation (oxlint 1.62.0 or newer), jsPlugins
  registration in .oxlintrc.json or oxlint.config.ts with defineConfig, migrating from eslint-plugin-hyper-fetch, and
  the two rules hyper-fetch/request-generic-types and hyper-fetch/client-generic-types - what each rejects (typos like
  rsponse or eror, unknown keys, empty {} or non-object generics), what they accept, messages, fixes, performance and
  limits. Use when linting a HyperFetch project with Oxlint, configuring oxlint-plugin-hyper-fetch, fixing "Unexpected
  generic type(s) found" or "Generic type provided to createRequest is empty", or when a request's response type
  silently became undefined. For ESLint use hyper-fetch-eslint.
---

# oxlint-plugin-hyper-fetch

HyperFetch puts a request's type contract in one generic object:
`client.createRequest<{ response; payload; error; queryParams; endpoint; params }>()`. Every key is optional, so
TypeScript accepts `{ rsponse: User; payload: Input }` (a typo next to a valid key) and the response type silently
becomes its default (`undefined`). TypeScript only rejects the generic when no key matches at all. This plugin reports
those mistakes in Oxlint. Rule ids are identical to `eslint-plugin-hyper-fetch`.

## Install

```bash
npm install -D oxlint oxlint-plugin-hyper-fetch
```

Requires Oxlint `1.62.0` or newer (JS plugin support, declared as a peer dependency). The package is ESM and has a
default export, which is how Oxlint loads JS plugins.

## Configure

`.oxlintrc.json`:

```json
{
  "jsPlugins": ["oxlint-plugin-hyper-fetch"],
  "rules": {
    "hyper-fetch/client-generic-types": "error",
    "hyper-fetch/request-generic-types": "error"
  }
}
```

`oxlint.config.ts`:

```ts
import { defineConfig } from "oxlint";

export default defineConfig({
  jsPlugins: ["oxlint-plugin-hyper-fetch"],
  rules: {
    "hyper-fetch/client-generic-types": "error",
    "hyper-fetch/request-generic-types": "error",
  },
});
```

There is no preset: enable both rules explicitly. Each accepts `"off"`, `"warn"` or `"error"` and has no options.
Diagnostics appear as `hyper-fetch(request-generic-types)` and `hyper-fetch(client-generic-types)`. Oxlint exits with
code 1 when an `"error"` rule reports, which fails CI.

## Verify the setup

```ts
// lint-check.ts
import { createClient } from "@hyper-fetch/core";

// Both lines typecheck: a misspelled key next to a valid one is not a TypeScript error, only the rule catches it.
const client = createClient<{ error: Error; eror: Error }>({ url: "/" });
const getUser = client.createRequest<{ response: { id: number }; rsponse: { id: number } }>()({ endpoint: "/users" });
```

`npx oxlint` must report `Unexpected generic type(s) found: eror` and `Unexpected generic type(s) found: rsponse`. If
nothing is reported, the plugin is not loaded (check `jsPlugins` and that the package resolves from the config's
directory).

## Migrating from ESLint

Rule ids and behavior match, only registration changes:

```diff
- "plugins": ["hyper-fetch"],
+ "jsPlugins": ["oxlint-plugin-hyper-fetch"],
  "rules": {
    "hyper-fetch/client-generic-types": "error",
    "hyper-fetch/request-generic-types": "error"
  }
```

Remove the ESLint rules when both linters run, otherwise every mistake is reported twice. Existing
`eslint-disable-next-line hyper-fetch/...` comments keep working in Oxlint.

## Rules

### `hyper-fetch/request-generic-types`

Checks the first generic of every `.createRequest<...>()` member call (on any object: `client.createRequest`,
`api.createRequest`). Computed access (`client["createRequest"]`) is ignored.

Allowed keys: `response`, `payload`, `error`, `queryParams`, `endpoint`, `params` (mirrors `RequestGenericType` in
`@hyper-fetch/core`).

| Code                                                     | Report                                                                                   |
| -------------------------------------------------------- | ---------------------------------------------------------------------------------------- |
| `createRequest<{ rsponse: User; eror: ApiError }>()`     | `Unexpected generic type(s) found: rsponse, eror` (all unknown keys, one report)         |
| `createRequest<GqlResponse<User> & { paylod: Input }>()` | `Unexpected generic type(s) found: paylod`                                               |
| `createRequest<{}>()`                                    | `Generic type provided to createRequest is empty`                                        |
| `createRequest<string>()`, `<unknown>`, `<A \| B>`       | `Generic type provided to createRequest is not matching the expected object-like format` |
| `createRequest<{ response: User } & string>()`           | not matching (each intersection part must be an object literal or a reference)           |

Accepted:

```ts
client.createRequest<{ response: User; params: { id: number } }>()({ endpoint: "/users/:id" });
client.createRequest<{ response: User; error: ApiError }>()({ endpoint: "/me" }); // quoted keys
client.createRequest<UserRequestTypes>()({ endpoint: "/users/:id" }); // type reference, left to TypeScript
client.createRequest<GqlResponse<{ user: User }> & { payload: { id: string } }>()({ endpoint: getUserQuery });
client.createRequest()({ endpoint: "/health" }); // no generic
```

### `hyper-fetch/client-generic-types`

Checks the generic of `createClient` imported from `@hyper-fetch/core` by name, alias
(`import { createClient as make }`) or namespace (`import * as HF` then `HF.createClient<...>()`). A `createClient` from
another library is ignored, and imports are tracked per file.

Allowed keys: `error` (the global error type, mirrors `ClientGenericType`).

| Code                                    | Report                                                                                  |
| --------------------------------------- | --------------------------------------------------------------------------------------- |
| `createClient<{ eror: ApiError }>(...)` | `Unexpected generic type(s) found: eror`                                                |
| `createClient<{}>(...)`                 | `Generic type provided to createClient is empty`                                        |
| `createClient<unknown>(...)`            | `Generic type provided to createClient is not matching the expected object-like format` |

Accepted: `createClient<{ error: ApiError }>(...)`, `createClient<ClientTypes>(...)`,
`createClient<Base & { error: ApiError }>(...)`, `createClient(...)`.

### Fixes

| Report                     | Fix                                                                                                                                   |
| -------------------------- | ------------------------------------------------------------------------------------------------------------------------------------- |
| Unexpected generic type(s) | Correct the spelling, or delete keys HyperFetch does not use                                                                          |
| Empty generic              | Remove `<{}>` or fill in at least `response`                                                                                          |
| Not object-like            | Wrap the type in a key: `<{ response: string }>` instead of `<string>`; split unions into separate requests or one `response: A \| B` |

## Performance

Both rules test the raw file text before Oxlint builds a JS AST for them:

- `request-generic-types` runs only on files matching `createRequest\s*<`.
- `client-generic-types` runs only on files containing both `@hyper-fetch/core` and `createClient`.

Other files cost nothing, so the plugin adds time only for files that define clients or requests. Keeping request
definitions in dedicated modules (`src/api/*.ts`) keeps that set small.

## Limits

- `new Client<...>(...)` is not checked, only `createClient`.
- Referenced types (`createRequest<RequestTypes>()`) are trusted; a typo inside `RequestTypes` is not reported. Prefer
  inline generics or cover the type with a type test.
- `RequestModel<{ ... }>` schemas used with `createSdk` (including CLI-generated SDKs) are not checked. Cover them with
  `expectTypeOf` tests (see `hyper-fetch-testing`); generated files come from `hyper-fetch-cli` and should not be edited
  or linted by hand.

## Related

- `hyper-fetch-eslint`: the same rules for ESLint.
- `hyper-fetch-core`: request and client generics.
- `hyper-fetch-testing`: type-level tests for requests and SDKs.

Docs: https://hyperfetch.bettertyped.com/docs/integrations/plugin-oxlint,
https://hyperfetch.bettertyped.com/docs/integrations/plugin-oxlint/rules
