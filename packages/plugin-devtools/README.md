# 🔧 Hyper Fetch DevTools Plugin

<p>
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
  <a href="https://api.codeclimate.com/v1/badges/eade9435e75ecea0c004/test_coverage">
    <img src="https://api.codeclimate.com/v1/badges/eade9435e75ecea0c004/test_coverage" />
  </a>
  <a href="https://github.com/BetterTyped/hyper-fetch">
    <img src="https://custom-icon-badges.demolab.com/badge/typescript-%23007ACC.svg?logo=typescript&logoColor=white" />
  </a>
  <a href="https://www.npmjs.com/package/@hyper-fetch/plugin-devtools">
    <img src="https://custom-icon-badges.demolab.com/bundlephobia/minzip/@hyper-fetch/plugin-devtools?color=64BC4B&logo=package" />
  </a>
</p>

## About

**`Hyper Fetch DevTools Plugin`** is an essential bridge between your application and HyperFlow. It enables real-time
streaming of request data, allowing you to monitor, debug, and optimize your application's network operations. This
plugin is the foundation that powers HyperFlow's advanced developer tools, providing the data pipeline needed for
comprehensive request inspection and management.

## Key Features

🔮 **Real-time Data Streaming** - Seamless streaming of request data to HyperFlow

🎯 **Request Lifecycle Tracking** - Complete visibility into request lifecycle events

✨ **Performance Metrics Collection** - Automatic gathering of timing and performance data

🚀 **Queue State Monitoring** - Real-time tracking of request queue status

💎 **Cache State Synchronization** - Live updates of cache state changes

🪄 **Error Tracking** - Comprehensive error reporting and debugging information

🎊 **Request/Response Interception** - Ability to inspect and modify requests and responses

🔋 **Offline State Detection** - Automatic detection and reporting of offline states

📡 **WebSocket Connection Management** - Specialized handling for WebSocket connections

## Integration

The DevTools Plugin is designed to work seamlessly with HyperFlow. To get started:

1. Install the plugin:

```bash
npm install @hyper-fetch/plugin-devtools
```

2. Add it to your Hyper Fetch client:

```typescript
import { createClient } from "@hyper-fetch/core";
import { DevtoolsPlugin } from "@hyper-fetch/plugin-devtools";

const client = createClient({
  url: "https://api.example.com",
}).addPlugin(
  DevtoolsPlugin({
    // Name displayed in the HyperFlow
    appName: "Adjusted App",
  }),
);
```

3. Connect to HyperFlow to start receiving real-time data.

## Help me keep working on this project ❤️

- [Become a Sponsor on GitHub](https://github.com/sponsors/prc5)

## Sources

- #### [Installation](https://hyperfetch.bettertyped.com/docs/getting-started/installation)
- #### [Docs](https://hyperfetch.bettertyped.com/docs/plugin-devtools/overview)
- #### [API](https://hyperfetch.bettertyped.com/api/)
- #### [NPM](https://www.npmjs.com/package/@hyper-fetch/plugin-devtools)
- #### [Guides](https://hyperfetch.bettertyped.com/guides/plugin-devtools/getting-started)

## Other Packages

- - #### [Hyper Fetch](https://github.com/BetterTyped/hyper-fetch/tree/main/packages/core)
- #### [HyperFlow](https://github.com/BetterTyped/hyper-fetch/tree/main/packages/flow)
- #### [Hyper Fetch Sockets](https://github.com/BetterTyped/hyper-fetch/tree/main/packages/sockets)
