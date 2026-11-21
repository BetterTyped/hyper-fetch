<p align="center">
  <a href="https://hyperfetch.bettertyped.com/docs/integrations/elysia/overview"><img src="https://raw.githubusercontent.com/BetterTyped/hyper-fetch/main/.github/assets/packages/elysia.png" alt="Hyper Fetch Elysia. Your Elysia app. Typed to every status. Bodies, queries, params and errors read from typeof app." /></a>
</p>

<p align="center">
  <a href="https://hyperfetch.bettertyped.com/docs/integrations/elysia/overview"><b>Quick Start</b></a> ·
  <a href="https://hyperfetch.bettertyped.com/docs/integrations/elysia/overview">Documentation</a> ·
  <a href="https://hyperfetch.bettertyped.com/docs/api/elysia/Types/ElysiaAppToHyperFetch">API Reference</a> ·
  <a href="https://github.com/BetterTyped/hyper-fetch">GitHub</a> ·
  <a href="https://discord.gg/7upC2kVmyM">Discord</a>
</p>

<p align="center">
  <a href="https://github.com/BetterTyped/hyper-fetch"><img src="https://img.shields.io/github/stars/BetterTyped/hyper-fetch?style=flat&logo=github&color=333" alt="GitHub stars" /></a>
  <a href="https://www.npmjs.com/package/@hyper-fetch/elysia"><img src="https://img.shields.io/npm/v/@hyper-fetch/elysia?logo=npm&color=e76f51" alt="npm version" /></a>
  <a href="https://www.npmjs.com/package/@hyper-fetch/elysia"><img src="https://api.maciejpyrc.com/portfolio/npm/downloads.svg?packages=@hyper-fetch/elysia&color=fbc646" alt="Monthly downloads" /></a>
  <a href="https://bundlejs.com/?q=@hyper-fetch/elysia"><img src="https://api.maciejpyrc.com/portfolio/npm/size.svg?package=@hyper-fetch/elysia&external=@hyper-fetch/core,elysia" alt="Bundle size" /></a>
  <a href="https://github.com/BetterTyped/hyper-fetch"><img src="https://img.shields.io/badge/TypeScript-strict-3178C6?logo=typescript&logoColor=white" alt="TypeScript" /></a>
  <a href="https://hyperfetch.bettertyped.com/docs/integrations/elysia/overview"><img src="https://img.shields.io/badge/Elysia-1.3%2B-C084FC" alt="Integration" /></a>
  <a href="https://github.com/BetterTyped/hyper-fetch/blob/main/License.md"><img src="https://img.shields.io/github/license/BetterTyped/hyper-fetch?color=blue" alt="License" /></a>
</p>

## 📖 About

`@hyper-fetch/elysia` turns the type of an Elysia app into a Hyper Fetch SDK schema. Your frontend calls the backend
through `createSdk` with response, error, payload, query and param types read straight from your Elysia routes and
schemas. It ships types only, so nothing from your server ends up in the client bundle.

## 🎯 Key Capabilities

- 🔗 **Backend types, frontend calls** - Change an Elysia route and every SDK call that uses it fails to compile
- 🧭 **Paths become properties** - `/users/:userId/posts` is `sdk.users.$userId.posts.$get`, with typed `setParams()`
- 🛂 **Schemas drive the inputs** - `body` and `query` schemas type `setPayload()` and `setQueryParams()`
- 🚦 **Typed errors per status** - 2xx bodies type `data`. Every other status, `422` validation errors included, types `error`
- 📡 **Types match the wire** - Dates arrive as strings, file bodies are `FormData` and streams stay `unknown`
- 🧩 **Plugins included** - `prefix`, `.group()`, `.guard()`, `.model()` and macros land in the endpoint and the types
- 🪶 **Zero runtime** - A single type export, so it adds no code to your bundle
- ⚡ **Every HyperFetch feature** - Cache, retries, deduplication, offline replay and React hooks on every route

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

- **[Elysia Integration](https://hyperfetch.bettertyped.com/docs/integrations/elysia/overview)** - Setup, schemas, errors and plugins
- **[SDK](https://hyperfetch.bettertyped.com/docs/core/sdk)** - How `createSdk` turns a schema into requests
- **[Getting Started](https://hyperfetch.bettertyped.com/docs/getting-started/quick-start)** - The core request API
- **[API Reference](https://hyperfetch.bettertyped.com/docs/api/elysia/Types/ElysiaAppToHyperFetch)** - Every exported type

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

// the payload is typed by t.Object({ name: t.String() })
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
  const { data, error, loading } = useFetch(sdk.users.$userId.$get.setParams({ userId }));

  if (loading) return <Spinner />;
  if (error) return <p>Could not load the user</p>;
  return <p>{data?.name}</p>;
};
```

## 🧩 Hyper Fetch Ecosystem

One typed client for every backend. Swap the adapter and keep the same `createRequest()` everywhere.

<table align="center">
  <tr>
    <td align="center" width="110"><a href="https://github.com/BetterTyped/hyper-fetch/tree/main/packages/core"><img src="https://raw.githubusercontent.com/BetterTyped/hyper-fetch/main/documentation/static/img/integration-hyper-fetch.svg" width="36" height="36" alt="" /><br /><sub><b>Core</b></sub></a></td>
    <td align="center" width="110"><a href="https://github.com/BetterTyped/hyper-fetch/tree/main/packages/react"><img src="https://raw.githubusercontent.com/BetterTyped/hyper-fetch/main/documentation/static/img/integration-react.svg" width="36" height="36" alt="" /><br /><sub><b>React</b></sub></a></td>
    <td align="center" width="110"><a href="https://github.com/BetterTyped/hyper-fetch/tree/main/packages/sockets"><img src="https://raw.githubusercontent.com/BetterTyped/hyper-fetch/main/documentation/static/img/integration-sockets.svg" width="36" height="36" alt="" /><br /><sub><b>Sockets</b></sub></a></td>
    <td align="center" width="110"><a href="https://github.com/BetterTyped/hyper-fetch/tree/main/packages/cli"><img src="https://raw.githubusercontent.com/BetterTyped/hyper-fetch/main/documentation/static/img/integration-openapi.svg" width="36" height="36" alt="" /><br /><sub><b>OpenAPI CLI</b></sub></a></td>
    <td align="center" width="110"><a href="https://github.com/BetterTyped/hyper-fetch/tree/main/packages/adapter-graphql"><img src="https://raw.githubusercontent.com/BetterTyped/hyper-fetch/main/documentation/static/img/integration-graphql.svg" width="36" height="36" alt="" /><br /><sub><b>GraphQL</b></sub></a></td>
    <td align="center" width="110"><a href="https://github.com/BetterTyped/hyper-fetch/tree/main/packages/adapter-trpc"><img src="https://raw.githubusercontent.com/BetterTyped/hyper-fetch/main/documentation/static/img/integration-trpc.svg" width="36" height="36" alt="" /><br /><sub><b>tRPC</b></sub></a></td>
  </tr>
  <tr>
    <td align="center" width="110"><a href="https://github.com/BetterTyped/hyper-fetch/tree/main/packages/adapter-orpc"><picture><source media="(prefers-color-scheme: dark)" srcset="https://raw.githubusercontent.com/BetterTyped/hyper-fetch/main/documentation/static/img/integration-orpc-dark.svg" /><img src="https://raw.githubusercontent.com/BetterTyped/hyper-fetch/main/documentation/static/img/integration-orpc.svg" width="36" height="36" alt="" /></picture><br /><sub><b>oRPC</b></sub></a></td>
    <td align="center" width="110"><a href="https://github.com/BetterTyped/hyper-fetch/tree/main/packages/hono"><img src="https://raw.githubusercontent.com/BetterTyped/hyper-fetch/main/documentation/static/img/integration-hono.svg" width="36" height="36" alt="" /><br /><sub><b>Hono</b></sub></a></td>
    <td align="center" width="110"><a href="https://github.com/BetterTyped/hyper-fetch/tree/main/packages/elysia"><img src="https://raw.githubusercontent.com/BetterTyped/hyper-fetch/main/documentation/static/img/integration-elysia.svg" width="36" height="36" alt="" /><br /><sub><b>Elysia</b></sub></a></td>
    <td align="center" width="110"><a href="https://github.com/BetterTyped/hyper-fetch/tree/main/packages/adapter-firebase"><img src="https://raw.githubusercontent.com/BetterTyped/hyper-fetch/main/documentation/static/img/integration-firebase.svg" width="36" height="36" alt="" /><br /><sub><b>Firebase</b></sub></a></td>
    <td align="center" width="110"><a href="https://github.com/BetterTyped/hyper-fetch/tree/main/packages/adapter-axios"><img src="https://raw.githubusercontent.com/BetterTyped/hyper-fetch/main/documentation/static/img/integration-axios.svg" width="36" height="36" alt="" /><br /><sub><b>Axios</b></sub></a></td>
    <td align="center" width="110"><a href="https://github.com/BetterTyped/hyper-fetch/tree/main/packages/hyper-flow"><img src="https://raw.githubusercontent.com/BetterTyped/hyper-fetch/main/documentation/static/img/hyper-flow.svg" width="36" height="36" alt="" /><br /><sub><b>HyperFlow</b></sub></a></td>
  </tr>
</table>

## 💖 Sponsors

<p align="center">
  <a href="https://github.com/sponsors/prc5">
    <img src="https://raw.githubusercontent.com/prc5/sponsors/main/packages/other/sponsorkit/sponsors.svg?raw=true" alt="Sponsors" />
  </a>
</p>

## License

[Apache-2.0](https://github.com/BetterTyped/hyper-fetch/blob/main/License.md)
