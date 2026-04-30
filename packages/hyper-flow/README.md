# ⚛️ HyperFlow

<p align="center">
  <b>Visual dashboard for monitoring and debugging your HyperFetch-powered applications.</b>
</p>

<p align="center">
  <a href="https://github.com/BetterTyped/hyper-fetch">
    <img src="https://img.shields.io/github/stars/BetterTyped/hyper-fetch?style=flat" alt="GitHub stars" />
  </a>
  <a href="https://github.com/BetterTyped/hyper-fetch/blob/main/License.md">
    <img src="https://img.shields.io/github/license/BetterTyped/hyper-fetch" alt="License" />
  </a>
  <a href="https://github.com/BetterTyped/hyper-fetch">
    <img src="https://img.shields.io/badge/typescript-%23007ACC.svg?logo=typescript&logoColor=white" alt="TypeScript" />
  </a>
</p>

## 📖 About

HyperFlow is a standalone desktop application that connects to your HyperFetch-powered app via the devtools plugin. It
gives you real-time visibility into every request, cache entry, and queue operation — debug failed requests, inspect
response data, monitor performance, and simulate offline behavior.

## 🎯 Key Capabilities

- 🔮 **X-ray vision for your API layer** — See every request, response, header, and payload in real time
- 💎 **Debug failed requests in seconds** — Full lifecycle view: method, endpoint, status, error, timing breakdown
- 📊 **Find your slow endpoints** — Performance analytics pinpoint bottlenecks and outlier requests
- 🗂️ **Browse your cache** — Inspect cached entries, check freshness, and manually invalidate keys
- 📴 **Simulate offline** — Toggle network loss to test how your app handles disconnection

## 🚀 Quick Start

1. Install the devtools plugin in your app:

```bash
npm install @hyper-fetch/plugin-devtools
```

2. Connect it to your HyperFetch client:

```ts
import { createClient } from "@hyper-fetch/core";
import { DevtoolsPlugin } from "@hyper-fetch/plugin-devtools";

const client = createClient({ url: "https://api.example.com" }).addPlugin(DevtoolsPlugin({ appName: "My App" }));
```

3. Open HyperFlow to see requests, cache state, and queue activity in real time.

## 📚 Documentation

- [HyperFlow Overview](https://hyperfetch.bettertyped.com/docs/hyper-flow)
- [Download](https://hyperfetch.bettertyped.com/docs/hyper-flow/download)
- [Plugin Devtools Setup](https://hyperfetch.bettertyped.com/docs/plugin-devtools/overview)

## 💡 Examples

### Debugging a failed request

Open HyperFlow and see the full request lifecycle: method, endpoint, headers, payload sent, response status, error
details, and timing breakdown — all in one view.

### Inspecting cache state

Browse all cached entries, see when they were last updated, and manually invalidate specific cache keys to test
refetching behavior.

### Monitoring queue activity

Watch requests enter and leave the queue in real time. See which requests are pending, retrying, or failed, and
understand the order of execution.

## License

[MIT](https://github.com/BetterTyped/hyper-fetch/blob/main/License.md)
