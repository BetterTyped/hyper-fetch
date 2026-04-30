# 🔧 Hyper Fetch DevTools Plugin

<p align="center">
  <b>Bridge between your app and HyperFlow. Streams request data for real-time debugging and monitoring.</b>
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
  <a href="https://www.npmjs.com/package/@hyper-fetch/plugin-devtools">
    <img src="https://custom-icon-badges.demolab.com/npm/v/@hyper-fetch/plugin-devtools.svg?logo=npm&color=e76f51" />
  </a>
  <a href="https://www.npmjs.com/package/@hyper-fetch/plugin-devtools">
    <img src="https://custom-icon-badges.demolab.com/npm/dm/@hyper-fetch/plugin-devtools?logoColor=fff&logo=trending-up" />
  </a>
  <a href="https://github.com/BetterTyped/hyper-fetch">
    <img src="https://custom-icon-badges.demolab.com/badge/typescript-%23007ACC.svg?logo=typescript&logoColor=white" />
  </a>
  <a href="https://bundlephobia.com/package/@hyper-fetch/plugin-devtools">
    <img src="https://custom-icon-badges.demolab.com/bundlephobia/minzip/@hyper-fetch/plugin-devtools?color=64BC4B&logo=package" />
  </a>
</p>

## 📖 About

The devtools plugin connects your HyperFetch client to HyperFlow, streaming request lifecycle events, cache state changes, queue activity, and performance metrics in real time. It is the data pipeline that powers HyperFlow's debugging and monitoring capabilities.

## 🎯 Key Capabilities

- 🔮 **See every request live** — Real-time stream of request lifecycle events, from start to response
- 💎 **Watch your cache change** — See entries appear, update, and invalidate as they happen
- 📊 **Spot slow endpoints instantly** — Timing breakdowns and payload sizes for every request
- 🚀 **Monitor your queue** — Pending, active, and failed requests visible at a glance
- 📴 **Offline detection** — Know immediately when your app loses or regains connectivity

## 🚀 Quick Start

```bash
npm install @hyper-fetch/plugin-devtools
```

```ts
import { createClient } from "@hyper-fetch/core";
import { DevtoolsPlugin } from "@hyper-fetch/plugin-devtools";

const client = createClient({ url: "https://api.example.com" }).addPlugin(
  DevtoolsPlugin({ appName: "My App" }),
);
```

## 📚 Documentation

- [Plugin Devtools Overview](https://hyperfetch.bettertyped.com/docs/plugin-devtools/overview)
- [HyperFlow](https://hyperfetch.bettertyped.com/docs/hyper-flow)
- [API Reference](https://hyperfetch.bettertyped.com/api/)

## 💡 Examples

### Development-only setup

```ts
import { createClient } from "@hyper-fetch/core";
import { DevtoolsPlugin } from "@hyper-fetch/plugin-devtools";

const client = createClient({ url: "https://api.example.com" });

if (process.env.NODE_ENV === "development") {
  client.addPlugin(
    DevtoolsPlugin({
      appName: "My App - Dev",
    }),
  );
}
```

### Multiple clients

```ts
const apiClient = createClient({ url: "https://api.example.com" }).addPlugin(
  DevtoolsPlugin({ appName: "API Client" }),
);

const authClient = createClient({ url: "https://auth.example.com" }).addPlugin(
  DevtoolsPlugin({ appName: "Auth Client" }),
);
```

## License

[MIT](https://github.com/BetterTyped/hyper-fetch/blob/main/License.md)
