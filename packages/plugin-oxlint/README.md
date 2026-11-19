# 🐂 Hyper Fetch Oxlint Plugin

<p align="center">
  <b>The HyperFetch lint rules on Oxlint, 16x faster than the ESLint plugin on the HyperFetch codebase.</b>
</p>

<p align="center">
  <a href="https://github.com/BetterTyped/hyper-fetch">
    <img src="https://img.shields.io/github/stars/BetterTyped/hyper-fetch?style=flat" alt="GitHub stars" />
  </a>
  <a href="https://www.npmjs.com/package/oxlint-plugin-hyper-fetch">
    <img src="https://img.shields.io/npm/v/oxlint-plugin-hyper-fetch" alt="npm version" />
  </a>
  <a href="https://www.npmjs.com/package/oxlint-plugin-hyper-fetch">
    <img src="https://img.shields.io/npm/dm/oxlint-plugin-hyper-fetch" alt="npm downloads" />
  </a>
  <a href="https://bundlephobia.com/package/oxlint-plugin-hyper-fetch">
    <img src="https://img.shields.io/bundlephobia/minzip/oxlint-plugin-hyper-fetch" alt="Bundle size" />
  </a>
  <a href="https://github.com/BetterTyped/hyper-fetch/blob/main/License.md">
    <img src="https://img.shields.io/github/license/BetterTyped/hyper-fetch" alt="License" />
  </a>
  <a href="https://github.com/BetterTyped/hyper-fetch">
    <img src="https://img.shields.io/badge/typescript-%23007ACC.svg?logo=typescript&logoColor=white" alt="TypeScript" />
  </a>
  <a href="https://oxc.rs/docs/guide/usage/linter">
    <img src="https://img.shields.io/badge/oxlint-JS%20plugin-1c2c4c" alt="Oxlint" />
  </a>
</p>

## 📖 About

This is an [Oxlint](https://oxc.rs/docs/guide/usage/linter) JS plugin with the HyperFetch rules. It catches typos and
unknown keys in the generics of `createClient` and `createRequest` before they quietly turn a response into `any`. Rule
names match `eslint-plugin-hyper-fetch`, so moving from ESLint is a config change.

## 🎯 Key Capabilities

- ⚡ **Lints a large codebase in about a second** - Files without a HyperFetch generic are skipped before their AST is
  built
- ✨ **No more typo-induced `any`** - Flags `rsponse` instead of `response` in `createRequest<{ ... }>()`
- 🔮 **Knows the real generics** - Accepts every key of `RequestGenericType`, including `params`
- 🧩 **Handles composed types** - Checks each object part of `GqlResponse<User> & { payload: Input }`
- 🎯 **Only your HyperFetch client** - `createClient` is checked when it comes from `@hyper-fetch/core`, by name, alias
  or namespace
- 🔁 **Same rule names as ESLint** - `hyper-fetch/request-generic-types` and `hyper-fetch/client-generic-types`

## 🚀 Quick Start

```bash
npm install -D oxlint oxlint-plugin-hyper-fetch
```

```json
{
  "jsPlugins": ["oxlint-plugin-hyper-fetch"],
  "rules": {
    "hyper-fetch/client-generic-types": "error",
    "hyper-fetch/request-generic-types": "error"
  }
}
```

## 📚 Documentation

- [Oxlint Plugin Docs](https://hyperfetch.bettertyped.com/docs/integrations/plugin-oxlint)
- [Rules](https://hyperfetch.bettertyped.com/docs/integrations/plugin-oxlint/rules)
- [Oxlint JS plugins](https://oxc.rs/docs/guide/usage/linter/js-plugins)

## 💡 Examples

### Catches a misspelled generic

```ts
// ❌ hyper-fetch/request-generic-types: Unexpected generic type(s) found: rsponse
const getUser = client.createRequest<{ rsponse: User }>()({
  endpoint: "/users/:userId",
});

// ✅
const getUser = client.createRequest<{ response: User }>()({
  endpoint: "/users/:userId",
});
```

### Checks composed generics part by part

```ts
// ❌ hyper-fetch/request-generic-types: Unexpected generic type(s) found: paylod
const updateUser = client.createRequest<GqlResponse<{ user: User }> & { paylod: UserInput }>()({
  endpoint: updateUserMutation,
});
```

## License

[MIT](https://github.com/BetterTyped/hyper-fetch/blob/main/License.md)
