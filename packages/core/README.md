# ⚡ Hyper Fetch

<p align="center">
  <b>One SDK for every API. The type-safe API layer for TypeScript apps — REST, GraphQL, WebSockets, SSE, Firebase, and more.</b>
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
  <a href="https://www.npmjs.com/package/@hyper-fetch/core">
    <img src="https://custom-icon-badges.demolab.com/npm/v/@hyper-fetch/core.svg?logo=npm&color=e76f51" />
  </a>
  <a href="https://www.npmjs.com/package/@hyper-fetch/core">
    <img src="https://custom-icon-badges.demolab.com/npm/dm/@hyper-fetch/core?logoColor=fff&logo=trending-up" />
  </a>
  <a href="https://github.com/BetterTyped/hyper-fetch">
    <img src="https://custom-icon-badges.demolab.com/badge/typescript-%23007ACC.svg?logo=typescript&logoColor=white" />
  </a>
  <a href="https://bundlephobia.com/package/@hyper-fetch/core">
    <img src="https://custom-icon-badges.demolab.com/bundlephobia/minzip/@hyper-fetch/core?color=64BC4B&logo=package" />
  </a>
</p>

## 📖 About

HyperFetch Core is the foundation of the HyperFetch ecosystem. Every API call is a typed, immutable request object with
built-in caching, queuing, retries, and offline support. It works in any JavaScript environment — browser, server, or
edge — and connects to any API through pluggable adapters.

## 🎯 Key Capabilities

- 🔮 **Zero guesswork** — Full autocompletion for every request, response, param, and error. Never cast to `any` again
- 📡 **One interface for everything** — REST, GraphQL, Firebase, WebSockets, SSE — switch APIs without rewriting a line
- 💾 **Stop re-fetching what you already have** — Smart cache with TTL and invalidation out of the box
- 🔁 **Failed requests retry themselves** — Configurable retry with backoff so users never see random failures
- 📴 **Works without internet** — Queues requests offline and replays them when connection returns
- 🚫 **No duplicate requests** — Concurrent identical calls are deduplicated automatically
- ⏱️ **Know exactly what's happening** — Upload and download progress with time estimates for every request
- 🎯 **Cancel anything, anytime** — Kill pending requests individually or by group with one call
- 🔌 **Swap engines without touching your code** — Switch between Axios, GraphQL, Firebase adapters in one line
- 🪄 **Generate your SDK** — Point CLI at an OpenAPI schema and get a fully typed client instantly

## 🚀 Quick Start

```bash
npm install @hyper-fetch/core
```

```ts
import { createClient } from "@hyper-fetch/core";

// Single entry point — all requests inherit this base URL
const client = createClient({ url: "https://api.example.com" });

// Define a request with typed response — :userId becomes a required param
const getUser = client.createRequest<{ response: { id: number; name: string } }>()({
  endpoint: "/users/:userId",
  method: "GET",
});

// setParams is typed from the endpoint string, send() returns typed data
const { data, error } = await getUser.setParams({ userId: 1 }).send();
```

## 📚 Documentation

- [Getting Started](https://hyperfetch.bettertyped.com/docs/getting-started/quick-start)
- [Core Overview](https://hyperfetch.bettertyped.com/docs/core/overview)
- [API Reference](https://hyperfetch.bettertyped.com/api/)

## 💡 Examples

### Typed requests with params, payload, and query params

```ts
interface User {
  id: number;
  name: string;
  email: string;
}

// GET request — only response type needed, params inferred from :userId
const getUser = client.createRequest<{ response: User }>()({
  endpoint: "/users/:userId",
  method: "GET",
});

// POST request — define both response and payload types
const createUser = client.createRequest<{
  response: User;
  payload: { name: string; email: string };
}>()({
  endpoint: "/users",
  method: "POST",
});

// Params are type-checked: { userId: number } required here
const { data } = await getUser.setParams({ userId: 1 }).send();

// Payload is type-checked: { name, email } required here
const { data: newUser } = await createUser.send({
  data: { name: "Jane", email: "jane@example.com" },
});
```

### Dynamic data with query params

```ts
// Define allowed query params — all are optional and type-checked
const listUsers = client.createRequest<{
  response: User[];
  queryParams: { page?: number; limit?: number; search?: string };
}>()({
  endpoint: "/users",
  method: "GET",
});

// Query params are appended to the URL: /users?page=1&limit=20&search=john
const { data } = await listUsers.setQueryParams({ page: 1, limit: 20, search: "john" }).send();
```

### Lifecycle callbacks

```ts
// Hook into the request lifecycle — track progress, log events, handle responses
const { data } = await getUser.setParams({ userId: 1 }).send({
  onStart: ({ requestId }) => console.log(`Request ${requestId} started`),
  onResponse: ({ response }) => console.log("Got data:", response.data),
  onUploadProgress: ({ progress }) => console.log(`Upload: ${progress}%`),
  onDownloadProgress: ({ progress }) => console.log(`Download: ${progress}%`),
});
```

### Response mapping

```ts
// Transform the response before it reaches your code
const getUser = client
  .createRequest<{ response: User }>()({
    endpoint: "/users/:userId",
    method: "GET",
  })
  .setResponseMapper((response) => ({
    ...response,
    data: { ...response.data, name: response.data.name.toUpperCase() },
  }));
```

## License

[MIT](https://github.com/BetterTyped/hyper-fetch/blob/main/License.md)
