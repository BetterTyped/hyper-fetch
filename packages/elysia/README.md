# 🦊 Hyper Fetch Elysia

<p align="center">
  <b>Call your Elysia backend from a fully typed HyperFetch SDK. No codegen, no duplicated types.</b>
</p>

<p align="center">
  <a href="https://github.com/BetterTyped/hyper-fetch">
    <img src="https://img.shields.io/github/stars/BetterTyped/hyper-fetch?logo=github&color=118ab2" alt="GitHub stars" />
  </a>
  <a href="https://www.npmjs.com/package/@hyper-fetch/elysia">
    <img src="https://img.shields.io/npm/v/@hyper-fetch/elysia?logo=npm&color=e76f51" alt="npm version" />
  </a>
  <a href="https://www.npmjs.com/package/@hyper-fetch/elysia">
    <img src="https://img.shields.io/npm/dm/@hyper-fetch/elysia?logo=npm" alt="npm downloads" />
  </a>
  <a href="https://bundlephobia.com/package/@hyper-fetch/elysia">
    <img src="https://img.shields.io/bundlephobia/minzip/@hyper-fetch/elysia?color=64BC4B" alt="bundle size" />
  </a>
  <a href="https://github.com/BetterTyped/hyper-fetch/blob/main/License.md">
    <img src="https://img.shields.io/github/license/BetterTyped/hyper-fetch?color=yellow" alt="license" />
  </a>
  <a href="https://github.com/BetterTyped/hyper-fetch">
    <img src="https://img.shields.io/badge/typescript-%23007ACC.svg?logo=typescript&logoColor=white" alt="TypeScript" />
  </a>
  <a href="https://elysiajs.com/">
    <img src="https://img.shields.io/badge/elysia-8A2BE2" alt="Elysia" />
  </a>
</p>

## 📖 About

`@hyper-fetch/elysia` turns the type of an Elysia app into a HyperFetch SDK schema. Your frontend calls the backend
through `createSdk` with response, error, payload, query and param types read straight from your Elysia routes and
schemas. It ships types only, so nothing from your server ends up in the client bundle.

## 🎯 Key Capabilities

- 🔗 **Backend types, frontend calls** - Change an Elysia route and every SDK call that uses it fails to compile
- 🧭 **Paths become properties** - `/users/:userId/posts` is `sdk.users.$userId.posts.$get`, with typed `setParams()`
- 🛂 **Schemas drive the inputs** - `body` and `query` schemas type `setPayload()` and `setQueryParams()`
- 🚦 **Typed errors per status** - 2xx bodies type `data`, every other status, including `422` validation errors, types
  `error`
- 🧩 **Plugins included** - `prefix`, `.group()` and `.use()` land in the endpoint and the nesting
- 🪶 **Zero runtime** - A single type export, so it adds no code to your bundle
- ⚡ **Every HyperFetch feature** - Cache, retries, deduplication, offline and React hooks work on every route

## 🚀 Quick Start

```bash
npm install @hyper-fetch/core @hyper-fetch/elysia
```

```ts
// backend
import { Elysia } from "elysia";
import type { ElysiaAppToHyperFetch } from "@hyper-fetch/elysia";

const app = new Elysia().get("/users/:userId", ({ params }) => ({ id: params.userId, name: "Ann" }));

export type AppSchema = ElysiaAppToHyperFetch<typeof app>;
```

```ts
// frontend
import { createClient, createSdk } from "@hyper-fetch/core";
import type { AppSchema } from "@my-app/backend";

const client = createClient({ url: "https://api.example.com" });
const sdk = createSdk<typeof client, AppSchema>(client);

const { data } = await sdk.users.$userId.$get.setParams({ userId: "1" }).send();
```

## 📚 Documentation

- [Elysia Integration Docs](https://hyperfetch.bettertyped.com/docs/integrations/elysia/overview)
- [SDK Guide](https://hyperfetch.bettertyped.com/docs/core/sdk)
- [Getting Started](https://hyperfetch.bettertyped.com/docs/getting-started/quick-start)

## 💡 Examples

### Plugins with schemas and error statuses

```ts
import { Elysia, t } from "elysia";
import type { ElysiaAppToHyperFetch } from "@hyper-fetch/elysia";

const users = new Elysia({ prefix: "/users" })
  .post("/", ({ body, status }) => status(201, { id: "2", name: body.name }), {
    body: t.Object({ name: t.String() }),
  })
  .get("/:userId", ({ params, status }) =>
    params.userId === "missing" ? status(404, { message: "User not found" }) : { id: params.userId, name: "Ann" },
  );

const auth = new Elysia({ prefix: "/auth" }).get("/google-login", () => ({ authUrl: "https://accounts.example.com" }));

const app = new Elysia().use(users).use(auth);

export type AppSchema = ElysiaAppToHyperFetch<typeof app>;
```

```ts
const sdk = createSdk<typeof client, AppSchema>(client);

await sdk.users.$post.setPayload({ name: "Bob" }).send();

const { data, error } = await sdk.users.$userId.$get.setParams({ userId: "missing" }).send();
// data: { id: string; name: string } | null, error: { message: "User not found" } | ...

// kebab-case paths become camelCase properties: GET /auth/google-login
await sdk.auth.googleLogin.$get.send();
```

### React hooks on an Elysia route

```tsx
import { useFetch } from "@hyper-fetch/react";

import { sdk } from "./api";

export const UserName = ({ userId }: { userId: string }) => {
  const { data, loading } = useFetch(sdk.users.$userId.$get.setParams({ userId }));

  if (loading) return <p>Loading...</p>;
  return <p>{data?.name}</p>;
};
```

## License

[Apache-2.0](https://github.com/BetterTyped/hyper-fetch/blob/main/License.md)
