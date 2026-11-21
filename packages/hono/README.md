<p align="center">
  <a href="https://hyperfetch.bettertyped.com/docs/integrations/hono/overview"><img src="https://raw.githubusercontent.com/BetterTyped/hyper-fetch/main/.github/assets/packages/hono.png" alt="Hyper Fetch Hono. Your Hono app. Typed on the client. Route, validator and param types read from typeof app with no codegen and no runtime." /></a>
</p>

<p align="center">
  <a href="https://hyperfetch.bettertyped.com/docs/integrations/hono/overview"><b>Quick Start</b></a> ·
  <a href="https://hyperfetch.bettertyped.com/docs/integrations/hono/overview">Documentation</a> ·
  <a href="https://hyperfetch.bettertyped.com/docs/api/hono/Types/HonoSchema">API Reference</a> ·
  <a href="https://github.com/BetterTyped/hyper-fetch">GitHub</a> ·
  <a href="https://discord.gg/7upC2kVmyM">Discord</a>
</p>

<p align="center">
  <a href="https://github.com/BetterTyped/hyper-fetch"><img src="https://img.shields.io/github/stars/BetterTyped/hyper-fetch?style=flat&logo=github&color=333" alt="GitHub stars" /></a>
  <a href="https://www.npmjs.com/package/@hyper-fetch/hono"><img src="https://img.shields.io/npm/v/@hyper-fetch/hono?logo=npm&color=e76f51" alt="npm version" /></a>
  <a href="https://www.npmjs.com/package/@hyper-fetch/hono"><img src="https://api.maciejpyrc.com/portfolio/npm/downloads.svg?packages=@hyper-fetch/hono&color=fbc646" alt="Monthly downloads" /></a>
  <a href="https://bundlejs.com/?q=@hyper-fetch/hono"><img src="https://api.maciejpyrc.com/portfolio/npm/size.svg?package=@hyper-fetch/hono&external=@hyper-fetch/core,hono" alt="Bundle size" /></a>
  <a href="https://github.com/BetterTyped/hyper-fetch"><img src="https://img.shields.io/badge/TypeScript-strict-3178C6?logo=typescript&logoColor=white" alt="TypeScript" /></a>
  <a href="https://hyperfetch.bettertyped.com/docs/integrations/hono/overview"><img src="https://img.shields.io/badge/Hono-4%2B-E36002?logo=hono&logoColor=white" alt="Hono" /></a>
  <a href="https://github.com/BetterTyped/hyper-fetch/blob/main/License.md"><img src="https://img.shields.io/github/license/BetterTyped/hyper-fetch?color=blue" alt="License" /></a>
</p>

## 📖 About

`@hyper-fetch/hono` turns the type of a Hono app into a Hyper Fetch SDK schema. Your frontend calls the backend
through `createSdk` with response, payload, query and param types read straight from your Hono routes and validators,
and its sockets connect to `upgradeWebSocket()` and `streamSSE()` routes at type-checked paths. It ships types only, so
nothing from your server ends up in the client bundle.

## 🎯 Key Capabilities

- 🔗 **Backend types, frontend calls** - Change a Hono route and every SDK call that uses it fails to compile
- 🧭 **Paths become properties** - `/users/:userId/posts` is `sdk.users.$userId.posts.$get`, with typed `setParams()`
- 🛂 **Validators drive the payload** - `json` and `query` validators type `setPayload()` and `setQueryParams()`
- 🧩 **Mounted routers included** - `app.route()` and `basePath()` prefixes land in the endpoint and the nesting
- 🧷 **Every path shape** - Optional `:id?` and regex `:id{[0-9]+}` params, `.all()` and `app.on()` get typed accessors
- 📡 **Realtime routes too** - `HonoSocketPath` rejects socket URLs that match no `upgradeWebSocket()` route
- 🚫 **No fake requests** - WebSocket routes stay out of the HTTP SDK, so nobody calls `send()` on them
- 🪶 **Zero runtime** - Type exports only, so it adds no code to your bundle
- ⚡ **Every HyperFetch feature** - Cache, retries, deduplication, offline replay and React hooks on every route

## 🚀 Quick Start

```bash
npm install @hyper-fetch/core @hyper-fetch/hono
```

```ts
// backend
import { Hono } from "hono";
import type { HonoSchema } from "@hyper-fetch/hono";

const app = new Hono().get("/users/:userId", (c) => c.json({ id: c.req.param("userId"), name: "Ann" }));

export type AppSchema = HonoSchema<typeof app>;
```

```ts
// frontend
import { createClient, createSdk } from "@hyper-fetch/core";
import type { AppSchema } from "@my-app/backend";

const client = createClient({ url: "https://api.example.com" });
const sdk = createSdk<typeof client, AppSchema>(client);

// data is { id: string; name: string } | null
const { data } = await sdk.users.$userId.$get.setParams({ userId: "1" }).send();
```

## 📚 Documentation

- **[Hono Integration](https://hyperfetch.bettertyped.com/docs/integrations/hono/overview)** - Setup, routes, validators and path shapes
- **[Hono Realtime](https://hyperfetch.bettertyped.com/docs/integrations/hono/realtime)** - WebSocket and Server-Sent Events routes
- **[SDK](https://hyperfetch.bettertyped.com/docs/core/sdk)** - How `createSdk` turns a schema into requests
- **[API Reference](https://hyperfetch.bettertyped.com/docs/api/hono/Types/HonoSchema)** - Every exported type

## 💡 Examples

### Mounted routers with validators

```ts
import { Hono } from "hono";
import { validator } from "hono/validator";
import type { HonoSchema } from "@hyper-fetch/hono";

const users = new Hono()
  .get("/", (c) => c.json([{ id: "1", name: "Ann" }]))
  .post(
    "/",
    validator("json", (value: { name: string }) => value),
    (c) => c.json({ id: "2", name: c.req.valid("json").name }, 201),
  );

const auth = new Hono().get("/google-login", (c) => c.json({ authUrl: "https://accounts.example.com" }));

const app = new Hono().route("/users", users).route("/auth", auth);

export type AppSchema = HonoSchema<typeof app>;
```

```ts
const sdk = createSdk<typeof client, AppSchema>(client);

// the payload is typed by the json validator
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

  if (loading) return <Spinner />;
  return <p>{data?.name}</p>;
};
```

### WebSocket routes with a typed socket SDK

```ts
// backend
import { createNodeWebSocket } from "@hono/node-ws";
import type { ListenerModel } from "@hyper-fetch/sockets";

const base = new Hono();
const { upgradeWebSocket } = createNodeWebSocket({ app: base }); // plus injectWebSocket(server) on Node

const app = base.get(
  "/chat/:roomId",
  upgradeWebSocket((c) => ({
    onOpen: (_event, ws) => ws.send(JSON.stringify({ topic: "message", data: { text: "Welcome" } })),
  })),
);

export type AppType = typeof app;
export type ChatSchema = { message: { $listener: ListenerModel<{ response: { text: string }; topic: "message" }> } };
```

```ts
// frontend
import { createSocketSdk, Socket } from "@hyper-fetch/sockets";
import type { HonoSocketPath } from "@hyper-fetch/hono";

const path: HonoSocketPath<AppType> = `/chat/${roomId}`; // "/rooms/1" would not compile
const socket = new Socket({ url: `wss://api.example.com${path}` });
const chat = createSocketSdk<typeof socket, ChatSchema>(socket);

chat.message.$listener.listen(({ data }) => console.log(data.text));
```

### Server-Sent Events with named events

```ts
// backend: named events reach the listeners of that event name, JSON data is parsed
app.get("/events", (c) =>
  streamSSE(c, async (stream) => {
    await stream.writeSSE({ id: "1", event: "tick", data: JSON.stringify({ symbol: "BTC", price: 100 }) });
  }),
);
```

```ts
// frontend: Node has no global EventSource, so pass the `eventsource` package there
import { EventSource } from "eventsource";
import { ServerSentEventsAdapter, Socket } from "@hyper-fetch/sockets";

const events = new Socket({
  url: "http://localhost:3000/events",
  adapter: ServerSentEventsAdapter(),
  adapterOptions: { EventSource },
});

events
  .createListener<{ symbol: string; price: number }>()({ topic: "tick" })
  .listen(({ data }) => console.log(data.price));
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
