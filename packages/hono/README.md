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
`createSdk` with response, payload, query and param types read straight from your Hono routes and validators, and its
sockets connect to `upgradeWebSocket()` and `streamSSE()` routes at type-checked paths. It ships types only, so nothing
from your server ends up in the client bundle.

## 🎯 Key Capabilities

- 🔗 **Backend types, frontend calls** - Change a Hono route and every SDK call that uses it fails to compile
- 🧭 **Paths become properties** - `/users/:userId/posts` is `sdk.users.$userId.posts.$get`, with typed `setParams()`
- 🛂 **Validators drive the payload** - `json` and `query` validators type `setPayload()` and `setQueryParams()`
- 🧩 **Mounted routers included** - `app.route()` and `basePath()` prefixes land in the endpoint and the nesting
- 🧷 **Every path shape** - Optional `:id?` and regex `:id{[0-9]+}` params, `.all()` and `app.on()` get typed accessors
- 📡 **Realtime routes too** - `HonoWebSocketPath` rejects socket URLs that match no `upgradeWebSocket()` route
- 🚫 **No fake requests** - WebSocket routes stay out of the HTTP SDK, so nobody calls `send()` on them
- 🪶 **Zero runtime** - Type exports only, so it adds no code to your bundle
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
- [Hono Realtime](https://hyperfetch.bettertyped.com/docs/integrations/hono/realtime)
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
import type { HonoWebSocketPath } from "@hyper-fetch/hono";

const path: HonoWebSocketPath<AppType> = `/chat/${roomId}`; // "/rooms/1" would not compile
const socket = new Socket({ url: `wss://api.example.com${path}` });
const chat = createSocketSdk<typeof socket, ChatSchema>(socket);

chat.message.$listener.listen(({ data }) => console.log(data.text));
```

### Server-Sent Events with named events

```ts
// backend: named events reach the listeners of the event name, JSON data is parsed
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
  adapter: ServerSentEventsAdapter,
  adapterOptions: { EventSource },
});

events
  .createListener<{ symbol: string; price: number }>()({ topic: "tick" })
  .listen(({ data }) => {
    console.log(data.price);
  });
```

## License

[Apache-2.0](https://github.com/BetterTyped/hyper-fetch/blob/main/License.md)
