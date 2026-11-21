<p align="center">
  <a href="https://hyperfetch.bettertyped.com/docs/integrations/plugin-devtools"><img src="https://raw.githubusercontent.com/BetterTyped/hyper-fetch/main/.github/assets/packages/plugin-devtools.png" alt="Hyper Fetch Devtools Plugin. See every request. As it happens. One plugin streams requests, cache and queues from your app to the HyperFlow desktop devtools." /></a>
</p>

<p align="center">
  <a href="https://hyperfetch.bettertyped.com/docs/hyper-flow/connecting"><b>Quick Start</b></a> ·
  <a href="https://hyperfetch.bettertyped.com/docs/integrations/plugin-devtools">Documentation</a> ·
  <a href="https://hyperfetch.bettertyped.com/docs/api/plugin-devtools/Functions/DevtoolsPlugin">API Reference</a> ·
  <a href="https://github.com/BetterTyped/hyper-fetch">GitHub</a> ·
  <a href="https://discord.gg/7upC2kVmyM">Discord</a>
</p>

<p align="center">
  <a href="https://github.com/BetterTyped/hyper-fetch"><img src="https://img.shields.io/github/stars/BetterTyped/hyper-fetch?style=flat&logo=github&color=333" alt="GitHub stars" /></a>
  <a href="https://www.npmjs.com/package/@hyper-fetch/plugin-devtools"><img src="https://img.shields.io/npm/v/@hyper-fetch/plugin-devtools?logo=npm&color=e76f51" alt="npm version" /></a>
  <a href="https://www.npmjs.com/package/@hyper-fetch/plugin-devtools"><img src="https://api.maciejpyrc.com/portfolio/npm/downloads.svg?packages=@hyper-fetch/plugin-devtools&color=fbc646" alt="Monthly downloads" /></a>
  <a href="https://bundlejs.com/?q=@hyper-fetch/plugin-devtools"><img src="https://api.maciejpyrc.com/portfolio/npm/size.svg?package=@hyper-fetch/plugin-devtools&external=@hyper-fetch/core,@hyper-fetch/sockets" alt="Bundle size" /></a>
  <a href="https://github.com/BetterTyped/hyper-fetch"><img src="https://img.shields.io/badge/TypeScript-strict-3178C6?logo=typescript&logoColor=white" alt="TypeScript" /></a>
  <a href="https://hyperfetch.bettertyped.com/docs/integrations/plugin-devtools"><img src="https://img.shields.io/badge/HyperFlow-devtools-F59E0B" alt="Integration" /></a>
  <a href="https://github.com/BetterTyped/hyper-fetch/blob/main/License.md"><img src="https://img.shields.io/github/license/BetterTyped/hyper-fetch?color=blue" alt="License" /></a>
</p>

## 📖 About

`@hyper-fetch/plugin-devtools` connects a Hyper Fetch client to [HyperFlow](https://github.com/BetterTyped/hyper-fetch/tree/main/packages/hyper-flow),
the desktop devtools. It streams every request, cache change and queue update from your app over a local socket, and
lets HyperFlow edit the cache and control queues while you debug. Add it in development and keep it out of production.

## 🎯 Key Capabilities

- 🔮 **See every request live** - Method, endpoint, payload, response, status and timing as they happen
- 💎 **Watch the cache change** - Entries appear, update, go stale and get invalidated in front of you
- 🚦 **Follow your queues** - Pending, running, paused and canceled requests per queue
- 📡 **Inspect sockets too** - Pass `sockets: [socket]` and HyperFlow shows connections, messages and errors
- 📊 **Find slow endpoints** - Response times and statistics collected per endpoint
- 🧪 **Debug by editing** - Change cache entries and control queues from HyperFlow, your hooks re-render with it
- 🧭 **Every adapter** - fetch, Axios, GraphQL, tRPC, oRPC and Firebase requests all show up the same way
- 🏷️ **Many apps, one window** - One `appName` per client, each shown as its own connection

## 🚀 Quick Start

```bash
npm install -D @hyper-fetch/plugin-devtools @hyper-fetch/sockets
```

```ts
import { createClient } from "@hyper-fetch/core";

export const client = createClient({ url: "https://api.example.com" });

// A build-time flag drops the plugin and its chunk from production builds
if (process.env.NODE_ENV === "development") {
  void import("@hyper-fetch/plugin-devtools").then(({ DevtoolsPlugin }) => {
    client.addPlugin(DevtoolsPlugin({ appName: "Web App" }));
  });
}
```

Then [download HyperFlow](https://hyperfetch.bettertyped.com/docs/hyper-flow/download), start it, and run your app.

## 📚 Documentation

- **[Devtools Plugin](https://hyperfetch.bettertyped.com/docs/integrations/plugin-devtools)** - Install, options and production safety
- **[Connecting HyperFlow](https://hyperfetch.bettertyped.com/docs/hyper-flow/connecting)** - Ports, environments and multiple apps
- **[HyperFlow](https://hyperfetch.bettertyped.com/docs/hyper-flow)** - Network, cache, queue and socket inspectors
- **[Adapter compatibility](https://hyperfetch.bettertyped.com/docs/hyper-flow/compatibility)** - What works with each adapter
- **[API Reference](https://hyperfetch.bettertyped.com/docs/api/plugin-devtools/Functions/DevtoolsPlugin)** - Every option and type

## 💡 Examples

### Vite

```ts
import { createClient } from "@hyper-fetch/core";

export const client = createClient({ url: import.meta.env.VITE_API_URL });

if (import.meta.env.DEV) {
  void import("@hyper-fetch/plugin-devtools").then(({ DevtoolsPlugin }) => {
    client.addPlugin(DevtoolsPlugin({ appName: "Web App", environment: "development" }));
  });
}
```

### Several clients side by side

```ts
// One plugin and one appName per client, so HyperFlow shows them as separate connections
apiClient.addPlugin(DevtoolsPlugin({ appName: "API" }));
authClient.addPlugin(DevtoolsPlugin({ appName: "Auth" }));
graphqlClient.addPlugin(DevtoolsPlugin({ appName: "GraphQL" }));
```

### Inspect sockets

```ts
import { Socket } from "@hyper-fetch/sockets";

const socket = new Socket({ url: "ws://localhost:3000" });

client.addPlugin(DevtoolsPlugin({ appName: "My App", sockets: [socket] }));
```

### A custom HyperFlow port

```ts
client.addPlugin(
  DevtoolsPlugin({
    appName: "My App",
    url: "ws://localhost:4000", // the default is ws://localhost:2137
    debug: true, // log connection events through the client logger
  }),
);
```

> **Never ship the plugin to production.** It sends headers, payloads, responses and cache contents to whatever listens
> on its URL, and accepts commands that change your cache. Gate it on a build-time constant and import it dynamically.

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
