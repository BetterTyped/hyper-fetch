<p align="center">
  <a href="https://hyperfetch.bettertyped.com/docs/integrations/adapter-orpc/overview"><img src="https://raw.githubusercontent.com/BetterTyped/hyper-fetch/main/.github/assets/packages/orpc.png" alt="Hyper Fetch oRPC. oRPC procedures. Typed down to errors. Inputs, outputs and defined errors inferred from your router, with event iterators as live listeners." /></a>
</p>

<p align="center">
  <a href="https://hyperfetch.bettertyped.com/docs/integrations/adapter-orpc/overview"><b>Quick Start</b></a> ·
  <a href="https://hyperfetch.bettertyped.com/docs/integrations/adapter-orpc/overview">Documentation</a> ·
  <a href="https://hyperfetch.bettertyped.com/docs/api/adapter-orpc/Functions/OrpcAdapter">API Reference</a> ·
  <a href="https://github.com/BetterTyped/hyper-fetch">GitHub</a> ·
  <a href="https://discord.gg/7upC2kVmyM">Discord</a>
</p>

<p align="center">
  <a href="https://github.com/BetterTyped/hyper-fetch"><img src="https://img.shields.io/github/stars/BetterTyped/hyper-fetch?style=flat&logo=github&color=333" alt="GitHub stars" /></a>
  <a href="https://www.npmjs.com/package/@hyper-fetch/orpc"><img src="https://img.shields.io/npm/v/@hyper-fetch/orpc?logo=npm&color=e76f51" alt="npm version" /></a>
  <a href="https://www.npmjs.com/package/@hyper-fetch/orpc"><img src="https://api.maciejpyrc.com/portfolio/npm/downloads.svg?packages=@hyper-fetch/orpc&color=fbc646" alt="Monthly downloads" /></a>
  <a href="https://bundlejs.com/?q=@hyper-fetch/orpc"><img src="https://api.maciejpyrc.com/portfolio/npm/size.svg?package=@hyper-fetch/orpc&external=@hyper-fetch/core,@orpc/client,@orpc/server" alt="Bundle size" /></a>
  <a href="https://github.com/BetterTyped/hyper-fetch"><img src="https://img.shields.io/badge/TypeScript-strict-3178C6?logo=typescript&logoColor=white" alt="TypeScript" /></a>
  <a href="https://hyperfetch.bettertyped.com/docs/integrations/adapter-orpc/overview"><img src="https://img.shields.io/badge/oRPC-v1-FF6CA5" alt="Integration" /></a>
  <a href="https://github.com/BetterTyped/hyper-fetch/blob/main/License.md"><img src="https://img.shields.io/github/license/BetterTyped/hyper-fetch?color=blue" alt="License" /></a>
</p>

## 📖 About

`@hyper-fetch/orpc` connects Hyper Fetch to an oRPC server through the oRPC RPC protocol. Procedures become regular
Hyper Fetch requests through `createSdk`, with inputs, outputs and defined errors inferred from your router or
contract, and event iterators become typed socket listeners. Rich types survive the wire thanks to the oRPC serializer.

## 🎯 Key Capabilities

- 🔮 **Types from your router or contract** - Inputs, outputs and `.errors()` maps inferred, no codegen
- 🛡️ **Defined errors you can switch on** - `error.code` narrows `error.data` to the shape you declared on the server
- 📅 **Rich types on the wire** - `Date`, `BigInt`, `Map`, `Set`, `URL` and files, encoded by the oRPC serializer
- 💾 **Cache per input** - `{ id: 1 }` and `{ id: 2 }` are cached, deduplicated and queued separately
- 🌐 **GET when your server allows it** - `queryMethod: "GET"` makes queries cacheable by browsers and CDNs
- ⚛️ **React hooks** - `useFetch` on `$query`, `useSubmit` on `$mutation`, file uploads included
- 📡 **Live event iterators** - Listen to `async function*` procedures over HTTP streams or one WebSocket
- ⏯️ **Resume where you stopped** - Reconnects send the last `withEventMeta` id, so the server can replay what you missed

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

// camelCaseToKebabCase: false keeps procedure names like findById as they are
const api = createSdk<typeof client, OrpcSchema<typeof router>>(client, { camelCaseToKebabCase: false });

const { data, error } = await api.planet.find.$query.setPayload({ id: 1 }).send();
```

## 📚 Documentation

- **[oRPC Adapter](https://hyperfetch.bettertyped.com/docs/integrations/adapter-orpc/overview)** - Setup, GET queries, errors, serializers and caching
- **[Event Iterators](https://hyperfetch.bettertyped.com/docs/integrations/adapter-orpc/event-iterators)** - Streams, WebSockets and resume
- **[SDK](https://hyperfetch.bettertyped.com/docs/core/sdk)** - How `createSdk` turns a schema into requests
- **[API Reference](https://hyperfetch.bettertyped.com/docs/api/adapter-orpc/Functions/OrpcAdapter)** - Adapters, schemas and types

## 💡 Examples

### Handle a defined error

```ts
const { data, error } = await api.planet.find.$query.setPayload({ id: 99 }).send();

// `error` also includes the global error of the client, so check for the oRPC shape first
if (error && "defined" in error && error.defined && error.code === "NOT_FOUND") {
  // error.data has the shape declared in the procedure's .errors()
  console.log(`Planet ${error.data.id} does not exist`);
}
```

### Upload a file from React

```tsx
import { useSubmit } from "@hyper-fetch/react";

const PlanetImage = ({ planetId }: { planetId: number }) => {
  const { submit, submitting } = useSubmit(api.planet.uploadImage.$mutation);

  return (
    <input
      type="file"
      disabled={submitting}
      onChange={(event) => {
        const image = event.target.files?.[0];
        if (image) submit({ payload: { planetId, image } });
      }}
    />
  );
};
```

### Cacheable GET queries

```ts
const client = createClient({ url: "http://localhost:3000/rpc" }).setAdapter(OrpcAdapter({ queryMethod: "GET" }));

// Fall back to POST for one request
const { data } = await api.planet.list.$query.setOptions({ queryMethod: "POST" }).send();
```

The server accepts GET for procedures declared with `.route({ method: "GET" })`.

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
