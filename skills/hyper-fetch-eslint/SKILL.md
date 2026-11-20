---
name: hyper-fetch-eslint
description:
  Setup and rules of eslint-plugin-hyper-fetch, the ESLint plugin that guards HyperFetch type safety by validating the
  generics passed to createClient and client.createRequest. Covers installation with the TypeScript parser
  (typescript-eslint), flat config (eslint.config.js / eslint.config.mjs) with configs.recommended and legacy .eslintrc
  with plugin:hyper-fetch/recommended-legacy, and the two rules hyper-fetch/request-generic-types and
  hyper-fetch/client-generic-types - what each rejects (typos like rsponse or eror, unknown keys, empty {} or non-object
  generics), what they accept, messages, fixes and limits. Use when adding linting to a HyperFetch project, configuring
  eslint-plugin-hyper-fetch, fixing "Unexpected generic type(s) found", "Generic type provided to createRequest is
  empty" or "not matching the expected object-like format", or when a request's response type silently became undefined.
  For Oxlint use hyper-fetch-oxlint.
---

# eslint-plugin-hyper-fetch

HyperFetch puts a request's whole type contract in one generic object:
`client.createRequest<{ response; payload; error; queryParams; endpoint; params }>()`. Every key is optional, so
TypeScript cannot flag a misspelled key that sits next to a valid one: `{ rsponse: User; payload: Input }` compiles, and
the response type silently falls back to its default (`undefined`), losing all type safety for that endpoint's data.
TypeScript only rejects the generic when **no** key matches. This plugin closes that gap at lint time.

## Install

```bash
npm install -D eslint eslint-plugin-hyper-fetch typescript-eslint
```

The rules inspect TypeScript generics, so files must be parsed by the typescript-eslint parser. The plugin needs ESLint
8.57 or newer and works on ESLint 10. No type information (`parserOptions.project`) is required; the rules are syntactic
and fast.

## Flat config (`eslint.config.mjs`)

The default export is the plugin (`meta`, `rules`, `configs`). `configs.recommended` is a flat config object: it
registers the plugin under `hyper-fetch` and sets both rules to `"error"`. It has no `files` and no parser, so add a
block that parses TypeScript files:

```js
// eslint.config.mjs
import hyperFetch from "eslint-plugin-hyper-fetch";
import tseslint from "typescript-eslint";

export default [
  {
    files: ["**/*.{ts,tsx,mts,cts}"],
    languageOptions: { parser: tseslint.parser },
  },
  hyperFetch.configs.recommended,
];
```

Or register the plugin and list the rules explicitly:

```js
{
  plugins: { "hyper-fetch": hyperFetch },
  rules: {
    "hyper-fetch/request-generic-types": "error",
    "hyper-fetch/client-generic-types": "error",
  },
},
```

Both can be combined: the preset and the default export are the same object, so registering `hyper-fetch` again does not
throw `Cannot redefine plugin`. The named exports `rules`, `configs` and `meta` are the same objects as well.

## Legacy config (`.eslintrc.*`)

ESLint 8 only. `plugin:hyper-fetch/recommended` is the flat preset and cannot be extended from `.eslintrc`; use the
legacy one:

```json
{
  "parser": "@typescript-eslint/parser",
  "extends": ["plugin:hyper-fetch/recommended-legacy"]
}
```

or `"plugins": ["hyper-fetch"]` with the two rules under `"rules"`.

## Verify the setup

Lint a file that must fail before trusting a green run:

```ts
// lint-check.ts
import { createClient } from "@hyper-fetch/core";

// Both lines typecheck: a misspelled key next to a valid one is not a TypeScript error, only the rule catches it.
const client = createClient<{ error: Error; eror: Error }>({ url: "/" });
const getUser = client.createRequest<{ response: { id: number }; rsponse: { id: number } }>()({ endpoint: "/users" });
```

Expected: `Unexpected generic type(s) found: eror` (client-generic-types) and
`Unexpected generic type(s) found: rsponse` (request-generic-types). The rules read the call's generics from
`typeArguments` (typescript-eslint 6 and newer) and fall back to the older `typeParameters`. If the check file reports
nothing, the `.ts` files are not parsed by typescript-eslint or not matched by the block that enables the rules.

## Rules

Both rules are `type: "problem"`, have no options, and are `"error"` in the recommended preset. Severity can be `"off"`,
`"warn"` or `"error"`.

### `hyper-fetch/request-generic-types`

Checks the first generic of every **`.createRequest<...>()` member call** (`client.createRequest`, `api.createRequest`,
any object), the definition point of a request's types.

Allowed keys: `response`, `payload`, `error`, `queryParams`, `endpoint`, `params` (mirrors `RequestGenericType` in
`@hyper-fetch/core`).

| Code                                                 | Report                                                                                   |
| ---------------------------------------------------- | ---------------------------------------------------------------------------------------- |
| `createRequest<{ rsponse: User }>()`                 | `Unexpected generic type(s) found: rsponse`                                              |
| `createRequest<{ response: User; querParams: Q }>()` | `Unexpected generic type(s) found: querParams`                                           |
| `createRequest<Base & { paylod: Input; eror: E }>()` | `Unexpected generic type(s) found: paylod, eror` (all unknown keys in one report)        |
| `createRequest<{}>()`                                | `Generic type provided to createRequest is empty`                                        |
| `createRequest<string>()`, `<unknown>`, `<A \| B>`   | `Generic type provided to createRequest is not matching the expected object-like format` |
| `createRequest<{ response: User } & string>()`       | not matching (every intersection part must be an object literal or a reference)          |

Accepted:

```ts
client.createRequest<{ response: User; payload: UserInput; error: ApiError; queryParams?: { page?: number } }>()({
  endpoint: "/users",
  method: "POST",
});
client.createRequest<{ response: User; params: { userId: number } }>()({ endpoint: "/users/:userId" });
client.createRequest<{ response: User }>()({ endpoint: "/me" }); // quoted keys count as identifiers
client.createRequest<GetUserTypes>()({ endpoint: "/users/:id" }); // type reference: left to TypeScript
client.createRequest<GqlResponse<User> & { payload: Input }>()({ endpoint: query }); // object parts checked
client.createRequest()({ endpoint: "/health" }); // no generic, nothing to check
```

Fix: correct the key name, remove keys HyperFetch does not use, drop an empty `<{}>` (or call `createRequest()` without
a generic), and wrap non-object types in the right key (`<{ response: string }>` instead of `<string>`).

### `hyper-fetch/client-generic-types`

Checks the generic of **`createClient` imported from `@hyper-fetch/core`**: a named import, an aliased import
(`import { createClient as makeClient }`) or a namespace (`import * as HF` then `HF.createClient<...>()`). A
`createClient` from any other module is ignored.

Allowed keys: `error` (the client's global error type, mirrors `ClientGenericType`).

| Code                                    | Report                                                                                  |
| --------------------------------------- | --------------------------------------------------------------------------------------- |
| `createClient<{ eror: ApiError }>(...)` | `Unexpected generic type(s) found: eror`                                                |
| `createClient<{ adapter: X }>(...)`     | `Unexpected generic type(s) found: adapter`                                             |
| `createClient<{}>(...)`                 | `Generic type provided to createClient is empty`                                        |
| `createClient<unknown>(...)`            | `Generic type provided to createClient is not matching the expected object-like format` |

Accepted: `createClient<{ error: ApiError }>(...)`, `createClient<ClientTypes>(...)`,
`createClient<Base & { error: ApiError }>(...)`, `createClient(...)`.

Fix: use `{ error: YourErrorType }`. The adapter is not a generic key; set it with `client.setAdapter(...)`.

## What the rules do not check

- `new Client<...>(...)` (only the `createClient` call is checked).
- Contents of a referenced type (`createRequest<RequestTypes>()`). TypeScript checks the reference against the
  constraint, but the same typo problem applies inside it: prefer inline generics, or keep the referenced type small and
  covered by a type test.
- SDK schemas built with `RequestModel<{ ... }>` and `createSdk`. Cover those with type tests
  (`expectTypeOf<ExtractResponseType<typeof sdk.users.$get>>()`, see `hyper-fetch-testing`).
- Computed access (`client["createRequest"]<...>()`) and a bare `createRequest<...>()` function call.

## Pitfalls

- **Parser not set for `.ts` files** in flat config: ESLint's default parser cannot read generics and reports parse
  errors, or the files are not linted at all. Scope the block with `files` and set `languageOptions.parser`.
- **Running only `tsc`**: type checking passes on `{ rsponse: User; payload: Input }`. The lint rule (or a type test) is
  what catches it.
- **Suppressing instead of fixing**: an `// eslint-disable-next-line hyper-fetch/request-generic-types` hides a broken
  type contract. Fix the key.
- **Both linters on one codebase**: ESLint and Oxlint plugins use the same rule ids; enable them in one linter only to
  avoid duplicate reports.

## Related

- `hyper-fetch-oxlint`: the same two rules for Oxlint (faster).
- `hyper-fetch-core`: request generics and `createClient`.
- `hyper-fetch-testing`: type-level tests for requests and SDKs.

Docs: https://hyperfetch.bettertyped.com/docs/integrations/plugin-eslint,
https://hyperfetch.bettertyped.com/docs/integrations/plugin-eslint/configuration,
https://hyperfetch.bettertyped.com/docs/integrations/plugin-eslint/rules
