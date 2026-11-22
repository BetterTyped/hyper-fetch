<p align="center">
  <a href="https://hyperfetch.bettertyped.com/docs/integrations/adapter-axios/overview"><img src="https://raw.githubusercontent.com/BetterTyped/hyper-fetch/main/.github/assets/packages/axios.png" alt="Hyper Fetch Axios. Axios underneath. HyperFetch on top. Keep your interceptors and Axios options, add typed requests, cache, retries and React hooks." /></a>
</p>

<p align="center">
  <a href="https://hyperfetch.bettertyped.com/docs/integrations/adapter-axios/overview"><b>Quick Start</b></a> ·
  <a href="https://hyperfetch.bettertyped.com/docs/integrations/adapter-axios/overview">Documentation</a> ·
  <a href="https://hyperfetch.bettertyped.com/docs/api/adapter-axios/Variables/AxiosAdapter">API Reference</a> ·
  <a href="https://github.com/BetterTyped/hyper-fetch">GitHub</a> ·
  <a href="https://discord.gg/7upC2kVmyM">Discord</a>
</p>

<p align="center">
  <a href="https://github.com/BetterTyped/hyper-fetch"><img src="https://img.shields.io/github/stars/BetterTyped/hyper-fetch?style=flat&logo=github&color=333" alt="GitHub stars" /></a>
  <a href="https://www.npmjs.com/package/@hyper-fetch/axios"><img src="https://img.shields.io/npm/v/@hyper-fetch/axios?logo=npm&color=e76f51" alt="npm version" /></a>
  <a href="https://www.npmjs.com/package/@hyper-fetch/axios"><img src="https://api.maciejpyrc.com/portfolio/npm/downloads.svg?packages=@hyper-fetch/axios&color=fbc646" alt="Monthly downloads" /></a>
  <a href="https://bundlejs.com/?q=@hyper-fetch/axios"><img src="https://api.maciejpyrc.com/portfolio/npm/size.svg?package=@hyper-fetch/axios&external=@hyper-fetch/core,axios" alt="Bundle size" /></a>
  <a href="https://github.com/BetterTyped/hyper-fetch"><img src="https://img.shields.io/badge/TypeScript-strict-3178C6?logo=typescript&logoColor=white" alt="TypeScript" /></a>
  <a href="https://hyperfetch.bettertyped.com/docs/integrations/adapter-axios/overview"><img src="https://img.shields.io/badge/Axios-adapter-5A29E4?logo=axios&logoColor=white" alt="Axios" /></a>
  <a href="https://github.com/BetterTyped/hyper-fetch/blob/main/License.md"><img src="https://img.shields.io/github/license/BetterTyped/hyper-fetch?color=blue" alt="License" /></a>
</p>

## 📖 About

`@hyper-fetch/axios` swaps the default HTTP transport of Hyper Fetch for Axios. Your interceptors, `axios.defaults`
and Axios request options keep working, and every request gains typed params and responses, cache, retries, offline
replay and React hooks. Your requests do not change, only the engine that sends them.

## 🎯 Key Capabilities

- 🔌 **One line to switch** - `setAdapter(AxiosAdapter)` and every existing request goes through Axios
- 🎯 **Keep your interceptors** - Interceptors and defaults on the default `axios` export apply to every request
- 🔧 **Axios options per request** - `timeout`, `responseType`, `withCredentials`, `proxy` and agents through `options`
- 📈 **Every progress event** - Axios reports incremental upload progress in the browser, not one final event
- 🖥️ **Node-only options** - `proxy`, `httpAgent`, `httpsAgent` and `maxRedirects` on the server
- 🧾 **Response headers in `extra`** - Read the Axios response headers next to typed `data`
- ✨ **Nothing else changes** - Cache, retries, deduplication, offline replay and React hooks work as before

## 🚀 Quick Start

```bash
npm install @hyper-fetch/core @hyper-fetch/axios axios
```

```ts
import { createClient } from "@hyper-fetch/core";
import { AxiosAdapter } from "@hyper-fetch/axios";

// AxiosAdapter is a ready instance, pass it without parentheses
const client = createClient({ url: "https://api.example.com" }).setAdapter(AxiosAdapter);

const getUser = client.createRequest<{ response: User }>()({
  endpoint: "/users/:userId",
  options: { timeout: 5000, withCredentials: true }, // Axios options, typed
});

const { data, error, extra } = await getUser.setParams({ userId: 1 }).send();
// extra.headers holds the Axios response headers
```

## 📚 Documentation

- **[Axios Adapter](https://hyperfetch.bettertyped.com/docs/integrations/adapter-axios/overview)** - Setup, options, progress and errors
- **[Getting Started](https://hyperfetch.bettertyped.com/docs/getting-started/quick-start)** - The core request API
- **[API Reference](https://hyperfetch.bettertyped.com/docs/api/adapter-axios/Variables/AxiosAdapter)** - `AxiosAdapter` and its types

## 💡 Examples

### Keep your Axios interceptors

`AxiosAdapter` sends every request through the default `axios` export, so register interceptors there. Instances from
`axios.create()` are not used by the adapter.

```ts
import axios from "axios";

axios.interceptors.request.use((config) => {
  config.headers.Authorization = `Bearer ${getToken()}`;
  return config;
});

axios.interceptors.response.use(
  (response) => response,
  (error) => {
    if (error.response?.status === 401) refreshToken();
    return Promise.reject(error);
  },
);

const client = createClient({ url: "https://api.example.com" }).setAdapter(AxiosAdapter);
```

### A timeout and GET deduplication for every request

```ts
// Axios has no default timeout and no GET deduplication, so set both once
const client = createClient({ url: "https://api.example.com" }).setAdapter(
  AxiosAdapter.setAdapterDefaults(() => ({ timeout: 5000 })).setRequestDefaults((options) =>
    (options.method ?? "GET") === "GET" ? { deduplicate: true } : {},
  ),
);
```

### Download a file

```ts
const downloadReport = client.createRequest<{ response: Blob }>()({
  endpoint: "/reports/:reportId",
  options: { responseType: "blob", timeout: 30000 },
});

const { data: report } = await downloadReport.setParams({ reportId: 42 }).send();
```

### Upload with progress

```ts
const uploadAvatar = client.createRequest<{ response: { url: string }; payload: FormData }>()({
  endpoint: "/avatar",
  method: "POST",
});

const form = new FormData();
form.append("file", file);

await uploadAvatar.send({
  payload: form,
  onUploadProgress: ({ progress, loaded, total }) => setUpload({ progress, loaded, total }),
});
```

## 🧩 Hyper Fetch Ecosystem

One typed client for every backend. Swap the adapter and keep the same `createRequest()` everywhere.

<table align="center">
  <tr>
    <td align="center" width="110"><a href="https://github.com/BetterTyped/hyper-fetch/tree/main/packages/core"><img src="https://raw.githubusercontent.com/BetterTyped/hyper-fetch/main/documentation/static/img/integration-hyper-fetch.svg" width="36" height="36" alt="" /><br /><sub><b>Core</b></sub></a></td>
    <td align="center" width="110"><a href="https://github.com/BetterTyped/hyper-fetch/tree/main/packages/react"><img src="https://raw.githubusercontent.com/BetterTyped/hyper-fetch/main/documentation/static/img/integration-react.svg" width="36" height="36" alt="" /><br /><sub><b>React</b></sub></a></td>
    <td align="center" width="110"><a href="https://github.com/BetterTyped/hyper-fetch/tree/main/packages/sockets"><img src="https://raw.githubusercontent.com/BetterTyped/hyper-fetch/main/documentation/static/img/integration-sockets.svg" width="36" height="36" alt="" /><br /><sub><b>Sockets</b></sub></a></td>
    <td align="center" width="110"><a href="https://github.com/BetterTyped/hyper-fetch/tree/main/packages/db"><img src="https://raw.githubusercontent.com/BetterTyped/hyper-fetch/main/documentation/static/img/integration-hyper-fetch.svg" width="36" height="36" alt="" /><br /><sub><b>DB</b></sub></a></td>
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
