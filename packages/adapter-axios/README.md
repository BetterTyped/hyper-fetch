# 🏛️ Hyper Fetch Axios

<p align="center">
  <b>Use Axios as the HTTP engine for HyperFetch. Drop-in replacement with interceptors and all Axios features.</b>
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
  <a href="https://www.npmjs.com/package/@hyper-fetch/axios">
    <img src="https://custom-icon-badges.demolab.com/npm/v/@hyper-fetch/axios.svg?logo=npm&color=e76f51" />
  </a>
  <a href="https://www.npmjs.com/package/@hyper-fetch/axios">
    <img src="https://custom-icon-badges.demolab.com/npm/dm/@hyper-fetch/axios?logoColor=fff&logo=trending-up" />
  </a>
  <a href="https://github.com/BetterTyped/hyper-fetch">
    <img src="https://custom-icon-badges.demolab.com/badge/typescript-%23007ACC.svg?logo=typescript&logoColor=white" />
  </a>
  <a href="https://bundlephobia.com/package/@hyper-fetch/axios">
    <img src="https://custom-icon-badges.demolab.com/bundlephobia/minzip/@hyper-fetch/axios?color=64BC4B&logo=package" />
  </a>
</p>

## 📖 About

This adapter replaces HyperFetch's built-in HTTP engine with Axios. You get all of Axios's features — interceptors,
automatic JSON transforms, request/response transforms — while keeping HyperFetch's typed request system, caching,
queuing, and React hooks.

## 🎯 Key Capabilities

- 🔌 **One line to switch** — Replace the default HTTP engine with Axios without touching your requests
- 🎯 **Keep your interceptors** — Use existing Axios request/response interceptors and error transforms
- ✨ **All HyperFetch features stay** — Caching, queuing, types, offline support, React hooks — nothing lost
- 🔧 **Bring your own instance** — Pass a pre-configured Axios instance with custom defaults and auth headers

## 🚀 Quick Start

```bash
npm install @hyper-fetch/core @hyper-fetch/axios axios
```

```ts
import { createClient } from "@hyper-fetch/core";
import { AxiosAdapter } from "@hyper-fetch/axios";

const client = createClient({ url: "https://api.example.com" }).setAdapter(AxiosAdapter());
```

## 📚 Documentation

- [Axios Adapter Docs](https://hyperfetch.bettertyped.com/docs/integrations/adapter-axios)
- [Getting Started](https://hyperfetch.bettertyped.com/docs/getting-started/quick-start)
- [API Reference](https://hyperfetch.bettertyped.com/api/)

## 💡 Examples

### Use with Axios interceptors

```ts
import axios from "axios";
import { createClient } from "@hyper-fetch/core";
import { AxiosAdapter } from "@hyper-fetch/axios";

const axiosInstance = axios.create({ baseURL: "https://api.example.com" });

axiosInstance.interceptors.request.use((config) => {
  config.headers.Authorization = `Bearer ${getToken()}`;
  return config;
});

axiosInstance.interceptors.response.use(
  (response) => response,
  (error) => {
    if (error.response?.status === 401) refreshToken();
    return Promise.reject(error);
  },
);

const client = createClient({ url: "https://api.example.com" }).setAdapter(AxiosAdapter({ instance: axiosInstance }));
```

### Create typed requests (same as core)

```ts
const getUsers = client.createRequest<{ response: User[] }>()({
  endpoint: "/users",
  method: "GET",
});

const { data, error } = await getUsers.send();
```

## License

[MIT](https://github.com/BetterTyped/hyper-fetch/blob/main/License.md)
