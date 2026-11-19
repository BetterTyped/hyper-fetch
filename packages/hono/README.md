# 🏯 Hyper Fetch Hono

<p align="center">
  <b>Call your Hono backend from a fully typed HyperFetch SDK. No codegen, no duplicated types.</b>
</p>

<p align="center">
  <a href="https://github.com/BetterTyped/hyper-fetch">
    <img src="https://img.shields.io/github/stars/BetterTyped/hyper-fetch?logo=github&color=118ab2" alt="GitHub stars" />
  </a>
  <a href="https://www.npmjs.com/package/@hyper-fetch/hono">
    <img src="https://img.shields.io/npm/v/@hyper-fetch/hono?logo=npm&color=e76f51" alt="npm version" />
  </a>
  <a href="https://www.npmjs.com/package/@hyper-fetch/hono">
    <img src="https://img.shields.io/npm/dm/@hyper-fetch/hono?logo=npm" alt="npm downloads" />
  </a>
  <a href="https://bundlephobia.com/package/@hyper-fetch/hono">
    <img src="https://img.shields.io/bundlephobia/minzip/@hyper-fetch/hono?color=64BC4B" alt="bundle size" />
  </a>
  <a href="https://github.com/BetterTyped/hyper-fetch/blob/main/License.md">
    <img src="https://img.shields.io/github/license/BetterTyped/hyper-fetch?color=yellow" alt="license" />
  </a>
  <a href="https://github.com/BetterTyped/hyper-fetch">
    <img src="https://img.shields.io/badge/typescript-%23007ACC.svg?logo=typescript&logoColor=white" alt="TypeScript" />
  </a>
  <a href="https://hono.dev/">
    <img src="https://img.shields.io/badge/hono-E36002?logo=hono&logoColor=white" alt="Hono" />
  </a>
</p>

## 📖 About

`@hyper-fetch/hono` turns the type of a Hono app into a HyperFetch SDK schema. Your frontend calls the backend through
`createSdk` with response, payload, query and param types read straight from your Hono routes and validators. It ships
types only, so nothing from your server ends up in the client bundle.

## 🎯 Key Capabilities

- 🔗 **Backend types, frontend calls** - Change a Hono route and every SDK call that uses it fails to compile
- 🧭 **Paths become properties** - `/users/:userId/posts` is `sdk.users.$userId.posts.$get`, with typed `setParams()`
- 🛂 **Validators drive the payload** - `json` and `query` validators type `setPayload()` and `setQueryParams()`
- 🧩 **Mounted routers included** - `app.route()` and `basePath()` prefixes land in the endpoint and the nesting
- 🪶 **Zero runtime** - A single type export, so it adds no code to your bundle
- ⚡ **Every HyperFetch feature** - Cache, retries, deduplication, offline and React hooks work on every route

## 🚀 Quick Start

```bash
npm install @hyper-fetch/core @hyper-fetch/hono
```

```ts
// backend
import { Hono } from "hono";
import type { HonoAppToHyperFetch } from "@hyper-fetch/hono";

const app = new Hono().get("/users/:userId", (c) => c.json({ id: c.req.param("userId"), name: "Ann" }));

export type AppSchema = HonoAppToHyperFetch<typeof app>;
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

- [Hono Integration Docs](https://hyperfetch.bettertyped.com/docs/integrations/hono/overview)
- [SDK Guide](https://hyperfetch.bettertyped.com/docs/core/sdk)
- [Getting Started](https://hyperfetch.bettertyped.com/docs/getting-started/quick-start)

## 💡 Examples

### Mounted routers with validators

```ts
import { Hono } from "hono";
import { validator } from "hono/validator";
import type { HonoAppToHyperFetch } from "@hyper-fetch/hono";

const users = new Hono()
  .get("/", (c) => c.json([{ id: "1", name: "Ann" }]))
  .post(
    "/",
    validator("json", (value: { name: string }) => value),
    (c) => c.json({ id: "2", name: c.req.valid("json").name }, 201),
  );

const auth = new Hono().get("/google-login", (c) => c.json({ authUrl: "https://accounts.example.com" }));

const app = new Hono().route("/users", users).route("/auth", auth);

export type AppSchema = HonoAppToHyperFetch<typeof app>;
```

```ts
const sdk = createSdk<typeof client, AppSchema>(client);

await sdk.users.$post.setPayload({ name: "Bob" }).send();
// kebab-case paths become camelCase properties: GET /auth/google-login
await sdk.auth.googleLogin.$get.send();
```

### React hooks on a Hono route

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
