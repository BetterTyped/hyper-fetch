# 🛸 Hyper Fetch oRPC

<p align="center">
  <b>oRPC adapter for HyperFetch. Typed procedures with caching, queueing and React hooks.</b>
</p>

<p align="center">
  <a href="https://github.com/BetterTyped/hyper-fetch">
    <img src="https://img.shields.io/github/stars/BetterTyped/hyper-fetch?logo=github&color=118ab2" />
  </a>
  <a href="https://www.npmjs.com/package/@hyper-fetch/orpc">
    <img src="https://img.shields.io/npm/v/@hyper-fetch/orpc.svg?logo=npm&color=e76f51" />
  </a>
  <a href="https://www.npmjs.com/package/@hyper-fetch/orpc">
    <img src="https://img.shields.io/npm/dm/@hyper-fetch/orpc.svg?logo=npm&color=2a9d8f" />
  </a>
  <a href="https://bundlephobia.com/package/@hyper-fetch/orpc">
    <img src="https://img.shields.io/bundlephobia/minzip/@hyper-fetch/orpc?color=8338ec" />
  </a>
  <a href="https://github.com/BetterTyped/hyper-fetch/blob/main/License.md">
    <img src="https://img.shields.io/github/license/BetterTyped/hyper-fetch?color=yellow" />
  </a>
  <img src="https://img.shields.io/badge/TypeScript-ready-3178c6?logo=typescript&logoColor=white" />
  <img src="https://img.shields.io/badge/oRPC-v1-000000" />
</p>

## 📖 About

This adapter connects HyperFetch to an oRPC server through the oRPC RPC protocol. Procedures become regular HyperFetch
requests, with inputs, outputs and defined errors inferred from your router through `createSdk`, and event iterators
become typed socket listeners.

## 🎯 Key Capabilities

- 🔮 **End-to-end types** - Inputs, outputs and `.errors()` maps inferred from your router or contract
- 📅 **Rich types on the wire** - `Date`, `BigInt`, `Map`, `Set`, `URL` and files, encoded by the oRPC serializer
- 💾 **Cache per input** - `{ id: 1 }` and `{ id: 2 }` are cached, deduplicated and queued separately
- ⚛️ **React-ready** - Use `useFetch` and `useSubmit` with your procedures
- 🌐 **GET when you want it** - Opt into cacheable `GET` queries for the procedures your server allows
- 📡 **Live event iterators** - Listen to `async function*` procedures over HTTP streams or one WebSocket with
  `useListener`
- 🔁 **Resume where you stopped** - Reconnects send the last `withEventMeta` id, so the server can replay what you
  missed

## 🚀 Quick Start

```bash
npm install @hyper-fetch/core @hyper-fetch/orpc @orpc/client
```

```ts
import { createClient, createSdk } from "@hyper-fetch/core";
import { OrpcAdapter } from "@hyper-fetch/orpc";
import type { OrpcSchema } from "@hyper-fetch/orpc";

import type { router } from "./server";

const client = createClient({ url: "http://localhost:3000/rpc" }).setAdapter(OrpcAdapter());
const api = createSdk<typeof client, OrpcSchema<typeof router>>(client, { camelCaseToKebabCase: false });

const { data, error } = await api.planet.find.$query.setPayload({ id: 1 }).send();
```

## 📚 Documentation

- [oRPC Adapter Docs](https://hyperfetch.bettertyped.com/docs/integrations/adapter-orpc/overview)
- [Event Iterators](https://hyperfetch.bettertyped.com/docs/integrations/adapter-orpc/event-iterators)
- [Getting Started](https://hyperfetch.bettertyped.com/docs/getting-started/quick-start)
- [API Reference](https://hyperfetch.bettertyped.com/api/)

## 💡 Examples

### Handle a defined error

```ts
const { data, error } = await api.planet.find.$query.setPayload({ id: 99 }).send();

if (error?.defined && error.code === "NOT_FOUND") {
  console.log(`Planet ${error.data.id} does not exist`);
}
```

### Upload a file

```tsx
import { useSubmit } from "@hyper-fetch/react";

const { submit, submitting } = useSubmit(api.planet.uploadImage.$mutation);

await submit({ payload: { planetId: 1, image: file } });
```

### Listen to an event iterator

```ts
import { createSocketSdk, Socket } from "@hyper-fetch/sockets";
import { OrpcStreamAdapter } from "@hyper-fetch/orpc";
import type { OrpcSocketSchema } from "@hyper-fetch/orpc";

// Or OrpcWebsocketAdapter() with the RPCHandler of @orpc/server/ws
const socket = new Socket({ url: "http://localhost:3000/rpc", adapter: OrpcStreamAdapter() });
const live = createSocketSdk<typeof socket, OrpcSocketSchema<typeof router>>(socket, { camelCaseToKebabCase: false });

const stop = live.planet.onUpdate.$listener.setPayload({ id: 1 }).listen(({ data, extra }) => {
  console.log(data.name, extra.id);
});
```

### Find the subscription that failed

```ts
import { OrpcSocketError } from "@hyper-fetch/orpc";

socket.onError(({ error }) => {
  if (error instanceof OrpcSocketError && error.code === "UNAUTHORIZED") {
    console.log(`${error.topic} was rejected for`, error.payload);
  }
});
```

### Contract-first APIs

```ts
import type { ContractRouterClient } from "@orpc/contract";

import type { contract } from "./contract";

const api = createSdk<typeof client, OrpcSchema<ContractRouterClient<typeof contract>>>(client, {
  camelCaseToKebabCase: false,
});
```

## License

[Apache-2.0](https://github.com/BetterTyped/hyper-fetch/blob/main/License.md)
