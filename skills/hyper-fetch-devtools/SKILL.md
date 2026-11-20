---
name: hyper-fetch-devtools
description:
  Setup and safe use of @hyper-fetch/plugin-devtools (DevtoolsPlugin), the plugin that streams a HyperFetch client's
  requests, responses, cache and queues over a local WebSocket to the HyperFlow desktop devtools app. Covers
  installation (with @hyper-fetch/sockets), DevtoolsPlugin options (appName, url, debug, environment), development-only
  inclusion with NODE_ENV or import.meta.env.DEV and dynamic import so it never ships to production, changing the
  HyperFlow port, React Native and multiple clients, what HyperFlow can inspect and control (network inspector, cache
  editing, queue pause/resume/clear, dashboard) and security risks. Use when a user wants HyperFetch devtools,
  HyperFlow, request inspection, cache debugging, "devtools not connecting", or asks whether the devtools plugin is safe
  for production.
---

# HyperFetch devtools plugin and HyperFlow

`@hyper-fetch/plugin-devtools` exports `DevtoolsPlugin`, a regular HyperFetch `Plugin`. Added to a `Client`, it
subscribes to the client's request manager, app manager, cache and both dispatchers, and sends every event over a
WebSocket (built with `@hyper-fetch/sockets`) to **HyperFlow**, the desktop devtools app (macOS, Windows, Linux,
currently alpha). HyperFlow listens on `ws://localhost:2137` by default. The connection is two-way: HyperFlow can also
write to your client's cache and stop, start or clear its queues.

## Install

```bash
npm install -D @hyper-fetch/plugin-devtools @hyper-fetch/sockets
```

`@hyper-fetch/sockets` is declared as an optional peer dependency, but the plugin imports `Socket` from it at runtime,
so install it. Download HyperFlow from the GitHub releases page of `BetterTyped/hyper-fetch` and start it before the
app.

## Minimal setup

```ts
// src/api/client.ts
import { createClient } from "@hyper-fetch/core";
import { DevtoolsPlugin } from "@hyper-fetch/plugin-devtools";

export const client = createClient({ url: "https://api.example.com" });

if (process.env.NODE_ENV === "development") {
  client.addPlugin(DevtoolsPlugin({ appName: "My App" }));
}
```

`addPlugin` mounts the plugin immediately: it creates the socket and starts connecting. Events emitted before HyperFlow
answers are queued in memory and flushed once HyperFlow reports it is initialized.

## Options

| Option        | Type      | Default                 | Meaning                                                               |
| ------------- | --------- | ----------------------- | --------------------------------------------------------------------- |
| `appName`     | `string`  | required                | Connection name shown in HyperFlow. Make it unique per client         |
| `url`         | `string`  | `"ws://localhost:2137"` | HyperFlow server URL. Change it when you change the port in HyperFlow |
| `debug`       | `boolean` | `false`                 | Log connect, disconnect and socket errors through the client logger   |
| `environment` | `string`  | `appName`               | Label shown next to the app name (e.g. `"development"`, `"staging"`)  |

The plugin's socket is created with `reconnect: 100` and `reconnectTime: 3000`, so it keeps retrying every 3 s while
HyperFlow is closed.

## Golden rules

1. **Never include the plugin in production builds.** It sends client options, adapter options, request headers,
   payloads, responses and cache contents to whatever listens on the URL, and it accepts commands that rewrite your
   cache and control queues. On a user's machine anything bound to `localhost:2137` would receive that data.
2. **Exclude it from the bundle, not only from execution.** A static `import` keeps the plugin and
   `@hyper-fetch/sockets` in the production bundle even when the `if` never runs. Use a dynamic `import()` inside a
   development-only branch that your bundler removes (see below).
3. **Gate on a build-time constant** (`process.env.NODE_ENV`, `import.meta.env.DEV`, `__DEV__`), never on a runtime
   flag, query parameter or user setting.
4. **Keep it out of tests and CI.** In tests it opens a socket and keeps reconnecting. It also grows an in-memory event
   queue for as long as HyperFlow is not connected.
5. **One `appName` per client.** Multiple clients (API, auth, GraphQL) each get their own plugin and name, so HyperFlow
   shows them as separate connections.
6. **Treat HyperFlow edits as debugging only.** Cache changes made in HyperFlow are applied to the live client and
   emitted to your hooks, they are not persisted anywhere else.

## Development-only, tree-shaken setup

Vite:

```ts
import { createClient } from "@hyper-fetch/core";

export const client = createClient({ url: import.meta.env.VITE_API_URL });

if (import.meta.env.DEV) {
  void import("@hyper-fetch/plugin-devtools").then(({ DevtoolsPlugin }) => {
    client.addPlugin(DevtoolsPlugin({ appName: "Web App", environment: "development" }));
  });
}
```

Webpack, Next.js and other bundlers that replace `process.env.NODE_ENV`:

```ts
if (process.env.NODE_ENV === "development") {
  void import("@hyper-fetch/plugin-devtools").then(({ DevtoolsPlugin }) => {
    client.addPlugin(DevtoolsPlugin({ appName: "Web App" }));
  });
}
```

The dead branch and its dynamic chunk are dropped from production output. Requests sent before the import resolves are
not shown in HyperFlow, which is fine for debugging. If you need the very first requests, use a static import in a
dev-only entry file (for example a separate `client.dev.ts` selected by a bundler alias) instead.

For Next.js App Router, add the plugin only on the client side (inside a module that runs in the browser) and only in
development; on the server every request would stream from the Node process.

## Custom port, LAN and React Native

```ts
DevtoolsPlugin({ appName: "Mobile", url: "ws://192.168.1.20:2137", environment: "ios-simulator" });
```

- If you change the server port in HyperFlow settings, pass the same port in `url`.
- `localhost` only works when the app runs on the same machine as HyperFlow. A physical device needs the computer's LAN
  IP; the Android emulator reaches the host machine at `10.0.2.2`.
- In React Native gate with `__DEV__`.

## What HyperFlow shows and controls

| Area      | Inspect                                                                      | Control                             |
| --------- | ---------------------------------------------------------------------------- | ----------------------------------- |
| Network   | Every request: method, endpoint, status, timings, headers, payload, response | -                                   |
| Cache     | Entries, keys, data, timestamps, the request that filled each entry          | Edit an entry, invalidate, delete   |
| Queues    | Fetch and submit dispatcher queues, pending and in-flight requests           | Stop / start a queue, clear a queue |
| Dashboard | Request counts, success and error rates, cache hit and size stats, timings   | -                                   |
| App       | Online / focus state from the app manager, the list of created requests      | -                                   |

Cache edits from HyperFlow go through `client.cache` and emit cache events, so mounted `useFetch` hooks re-render with
the edited data. That makes it a quick way to test how a screen renders unusual data without changing the backend.

## Troubleshooting

| Symptom                           | Check                                                                                                                                                                                 |
| --------------------------------- | ------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------- |
| App never appears in HyperFlow    | HyperFlow running, port matches `url`, `@hyper-fetch/sockets` installed, dev branch ran                                                                                               |
| Appears, but no requests          | Plugin added to the client that actually sends (requests are bound to their client)                                                                                                   |
| Events stop after a reset         | `client.clear()` removes all emitter listeners, including the plugin's. Reload the app; do not call `clear()` on a client you inspect (adding the plugin again opens a second socket) |
| Want to see connection logs       | `debug: true`, plus a logger level that prints info and errors                                                                                                                        |
| Device or emulator cannot connect | Use the LAN IP or `10.0.2.2` instead of `localhost`                                                                                                                                   |

## Testing notes

Do not add the plugin in unit or component tests; inspect behavior through responses and the UI (see the
`hyper-fetch-testing` skill). If a shared client module adds the plugin in development mode, make sure the test
environment sets `NODE_ENV=test` (Vitest and Jest do by default) so the branch does not run.

## Related

- `hyper-fetch-core`: plugins, cache, dispatchers and the client the plugin hooks into.
- `hyper-fetch-sockets`: the socket layer the plugin uses for its connection.

Docs: https://hyperfetch.bettertyped.com/docs/integrations/plugin-devtools,
https://hyperfetch.bettertyped.com/docs/hyper-flow, https://hyperfetch.bettertyped.com/docs/hyper-flow/connecting,
https://hyperfetch.bettertyped.com/docs/hyper-flow/download
