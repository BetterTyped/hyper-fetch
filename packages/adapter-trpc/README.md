# 🎡 Hyper Fetch tRPC

<p align="center">
  <b>tRPC adapter for HyperFetch. Typed procedures with caching, queueing and React hooks.</b>
</p>

<p align="center">
  <a href="https://bettertyped.com/">
    <img src="https://custom-icon-badges.demolab.com/static/v1?label=&message=BetterTyped&color=333&logo=BT" />
  </a>
  <a href="https://github.com/BetterTyped/hyper-fetch">
    <img src="https://custom-icon-badges.demolab.com/github/stars/BetterTyped/hyper-fetch?logo=star&color=118ab2" />
  </a>
  <a href="https://github.com/BetterTyped/hyper-fetch/blob/main/License.md">
    <img src="https://custom-icon-badges.demolab.com/github/license/BetterTyped/hyper-fetch?logo=law&color=yellow" />
  </a>
  <a href="https://www.npmjs.com/package/@hyper-fetch/trpc">
    <img src="https://custom-icon-badges.demolab.com/npm/v/@hyper-fetch/trpc.svg?logo=npm&color=e76f51" />
  </a>
</p>

## 📖 About

This adapter connects HyperFetch to a tRPC server. Procedures become regular HyperFetch requests, with types inferred
from your router through `createSdk`.

## 🎯 Key Capabilities

- 🔮 **End-to-end types** — Inputs, outputs and errors inferred from your `AppRouter`
- 💾 **Smart caching included** — Every procedure input is cached separately
- ⚛️ **React-ready** — Use `useFetch` and `useSubmit` with your procedures
- 🔁 **Transformers** — Works with `superjson` and any `serialize` / `deserialize` pair
- 📡 **Live subscriptions** - Listen over WebSocket or SSE and resume from the last `tracked()` event

## 🚀 Quick Start

```bash
npm install @hyper-fetch/core @hyper-fetch/trpc
```

```ts
import { createClient, createSdk } from "@hyper-fetch/core";
import { TrpcAdapter } from "@hyper-fetch/trpc";
import type { TrpcSchema } from "@hyper-fetch/trpc";

import type { AppRouter } from "./server";

const client = createClient({ url: "http://localhost:3000/trpc" }).setAdapter(TrpcAdapter());

const api = createSdk<typeof client, TrpcSchema<AppRouter>>(client, { camelCaseToKebabCase: false });

const { data: user } = await api.user.byId.$query.setPayload({ id: 1 }).send();
const { data: created } = await api.user.create.$mutation.setPayload({ name: "John" }).send();
```

## 📚 Documentation

- [tRPC Adapter Docs](https://hyperfetch.bettertyped.com/docs/integrations/adapter-trpc/overview)
- [tRPC Subscriptions](https://hyperfetch.bettertyped.com/docs/integrations/adapter-trpc/subscriptions)
- [Getting Started](https://hyperfetch.bettertyped.com/docs/getting-started/quick-start)
- [API Reference](https://hyperfetch.bettertyped.com/api/)

## 💡 Examples

### Realtime subscriptions

Subscription procedures become typed listeners of a `Socket` from `@hyper-fetch/sockets`. Listeners with the same input
share one server subscription, and after a reconnect it resumes from the last `tracked()` event.

```ts
import { Socket, createSocketSdk } from "@hyper-fetch/sockets";
import { TrpcWebsocketAdapter } from "@hyper-fetch/trpc";
import type { TrpcSocketSchema } from "@hyper-fetch/trpc";

import type { AppRouter } from "./server";

// Use TrpcSseAdapter() with the url of the HTTP handler to receive them as Server-Sent Events
const socket = new Socket({ url: "ws://localhost:3001", adapter: TrpcWebsocketAdapter() });

const realtime = createSocketSdk<typeof socket, TrpcSocketSchema<AppRouter>>(socket, { camelCaseToKebabCase: false });

const stop = realtime.chat.onMessage.$listener.setPayload({ room: "general" }).listen(({ data, extra }) => {
  console.log(data.text, extra.eventId);
});
```

## License

[Apache-2.0](https://github.com/BetterTyped/hyper-fetch/blob/main/License.md)
