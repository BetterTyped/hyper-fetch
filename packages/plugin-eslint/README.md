# 🧹 Hyper Fetch ESLint Plugin

<p align="center">
  <b>ESLint rules to enforce HyperFetch best practices and catch type issues early.</b>
</p>

<p align="center">
  <a href="https://github.com/BetterTyped/hyper-fetch">
    <img src="https://img.shields.io/github/stars/BetterTyped/hyper-fetch?style=flat" alt="GitHub stars" />
  </a>
  <a href="https://www.npmjs.com/package/eslint-plugin-hyper-fetch">
    <img src="https://img.shields.io/npm/v/eslint-plugin-hyper-fetch" alt="npm version" />
  </a>
  <a href="https://github.com/BetterTyped/hyper-fetch/blob/main/License.md">
    <img src="https://img.shields.io/github/license/BetterTyped/hyper-fetch" alt="License" />
  </a>
  <a href="https://github.com/BetterTyped/hyper-fetch">
    <img src="https://img.shields.io/badge/typescript-%23007ACC.svg?logo=typescript&logoColor=white" alt="TypeScript" />
  </a>
</p>

## 📖 About

This ESLint plugin provides static analysis rules specific to HyperFetch. It catches generic type issues like typos,
missing values, or incorrect usage of `createClient` and `createRequest` type parameters before they cause runtime
errors.

## 🎯 Key Capabilities

- 🔮 **Catch type bugs before they run** — Validates `createClient` and `createRequest` generic parameters at lint time
- ✨ **No more typo-induced `any`** — Detects misspelled keys like `rsponse` instead of `response`
- 🔧 **Plug and play** — Use the recommended preset or configure rules one by one

## 🚀 Quick Start

```bash
npm install -D eslint-plugin-hyper-fetch
```

```json
{
  "extends": ["plugin:hyper-fetch/recommended"]
}
```

Or configure individual rules:

```json
{
  "plugins": ["hyper-fetch"],
  "rules": {
    "hyper-fetch/client-generic-types": "error",
    "hyper-fetch/request-generic-types": "error"
  }
}
```

## 📚 Documentation

- [ESLint Plugin Docs](https://hyperfetch.bettertyped.com/docs/integrations/plugin-eslint)
- [Getting Started](https://hyperfetch.bettertyped.com/docs/getting-started/quick-start)

## 💡 Examples

### Catches incorrect generic types

```ts
// ❌ This will be flagged by hyper-fetch/request-generic-types
const getUser = client.createRequest<{
  rsponse: User; // Typo: "rsponse" instead of "response"
}>()({
  endpoint: "/users/:userId",
  method: "GET",
});
```

```ts
// ✅ Correct usage — no lint error
const getUser = client.createRequest<{
  response: User;
}>()({
  endpoint: "/users/:userId",
  method: "GET",
});
```

## License

[MIT](https://github.com/BetterTyped/hyper-fetch/blob/main/License.md)
