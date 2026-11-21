<p align="center">
  <a href="https://hyperfetch.bettertyped.com/docs/hyper-flow"><img src="https://raw.githubusercontent.com/BetterTyped/hyper-fetch/main/.github/assets/packages/hyper-flow.png" alt="HyperFlow. Devtools for your API layer. A desktop app for macOS, Windows and Linux to inspect requests, browse the cache, watch queues and find slow endpoints." /></a>
</p>

<p align="center">
  <a href="https://hyperfetch.bettertyped.com/docs/hyper-flow/download"><b>Download</b></a> ·
  <a href="https://hyperfetch.bettertyped.com/docs/hyper-flow">Documentation</a> ·
  <a href="https://github.com/BetterTyped/hyper-fetch">GitHub</a> ·
  <a href="https://discord.gg/7upC2kVmyM">Discord</a>
</p>

<p align="center">
  <a href="https://github.com/BetterTyped/hyper-fetch"><img src="https://img.shields.io/github/stars/BetterTyped/hyper-fetch?style=flat&logo=github&color=333" alt="GitHub stars" /></a>
  <a href="https://hyperfetch.bettertyped.com/docs/hyper-flow/download"><img src="https://img.shields.io/badge/platforms-macOS%20%7C%20Windows%20%7C%20Linux-333?logo=electron&logoColor=white" alt="macOS, Windows and Linux" /></a>
  <a href="https://github.com/BetterTyped/hyper-fetch/releases"><img src="https://img.shields.io/badge/status-alpha-F59E0B" alt="Alpha" /></a>
  <a href="https://github.com/BetterTyped/hyper-fetch"><img src="https://img.shields.io/badge/TypeScript-strict-3178C6?logo=typescript&logoColor=white" alt="TypeScript" /></a>
  <a href="https://github.com/BetterTyped/hyper-fetch/blob/main/packages/hyper-flow/LICENSE.md"><img src="https://img.shields.io/badge/license-GPL--3.0-blue" alt="License" /></a>
</p>

## 📖 About

HyperFlow is the desktop devtools app for Hyper Fetch, for macOS, Windows and Linux. It connects to your app through
[`@hyper-fetch/plugin-devtools`](https://github.com/BetterTyped/hyper-fetch/tree/main/packages/plugin-devtools) and
shows every request, cache entry, queue and socket in real time, so you can debug failures, inspect responses and find
slow endpoints without `console.log`. HyperFlow is in alpha.

## 🎯 Key Capabilities

- 🔮 **X-ray vision for your API layer** - Every request with its payload, response, headers, status and timing
- 🔎 **Find the request in seconds** - Search by endpoint, method or key, filter by success, failure, paused or canceled
- 💎 **Browse the cache** - Fresh or stale, observers, last update, and edits that your hooks pick up live
- 🚦 **Watch the queues** - Pending and in-flight requests per queue, with the history of what passed through
- 📡 **Read socket traffic** - Connection state, messages in and out, and errors for WebSocket and SSE
- 📊 **Spot slow endpoints** - A dashboard with success rates, cache efficiency and performance insights
- 🧭 **Every adapter** - fetch, Axios, GraphQL, tRPC, oRPC and Firebase, each tested end to end
- 🏷️ **All your apps in one window** - Each client shows up as its own connection

## 🚀 Quick Start

1. [Download HyperFlow](https://hyperfetch.bettertyped.com/docs/hyper-flow/download) and start it
2. Install the plugin in your app:

```bash
npm install -D @hyper-fetch/plugin-devtools @hyper-fetch/sockets
```

3. Connect your client in development:

```ts
if (process.env.NODE_ENV === "development") {
  void import("@hyper-fetch/plugin-devtools").then(({ DevtoolsPlugin }) => {
    client.addPlugin(DevtoolsPlugin({ appName: "My App" }));
  });
}
```

Run your app and its requests appear in HyperFlow.

## 📚 Documentation

- **[HyperFlow](https://hyperfetch.bettertyped.com/docs/hyper-flow)** - Overview of every inspector
- **[Download](https://hyperfetch.bettertyped.com/docs/hyper-flow/download)** - Builds for macOS, Windows and Linux
- **[Connecting](https://hyperfetch.bettertyped.com/docs/hyper-flow/connecting)** - Set up the devtools plugin
- **[Network Inspector](https://hyperfetch.bettertyped.com/docs/hyper-flow/features/network)** - Requests, search and filters
- **[Adapter compatibility](https://hyperfetch.bettertyped.com/docs/hyper-flow/compatibility)** - What works with each adapter

## 💡 Examples

### Debug a failed request

Open **Network**, filter by **Failed** and pick the request. You see the method, endpoint, params, payload, the error
the app received, the status and the time it took, in one view.

### Check what the cache holds

Open **Cache** to see every key, whether it is fresh or stale, how many components observe it and when it was last
updated. Edit or remove an entry and the mounted hooks re-render with the change.

### Follow a queue

Open **Queues** to watch requests enter and leave each queue. Paused and pending requests show up as soon as they are
queued, so offline replays and sequential uploads are easy to follow.

### Inspect sockets

Pass your sockets to the plugin and open **Sockets** to read every message in and out, with its topic and size.

```ts
client.addPlugin(DevtoolsPlugin({ appName: "My App", sockets: [socket] }));
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

[GPL-3.0-or-later](https://github.com/BetterTyped/hyper-fetch/blob/main/packages/hyper-flow/LICENSE.md)
