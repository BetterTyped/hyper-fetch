<p align="center">
  <img src="./.github/assets/readme.png" alt="Hyper Fetch. From REST to realtime. Fully typed. Works with OpenAPI, GraphQL, tRPC, oRPC, Hono, Firebase, Axios, WebSockets and React." />
</p>

<p align="center">
  <a href="https://hyperfetch.bettertyped.com/docs/getting-started/quick-start"><b>Quick Start</b></a> ·
  <a href="https://hyperfetch.bettertyped.com/">Documentation</a> ·
  <a href="https://hyperfetch.bettertyped.com/docs/guides/Basic/Setup">Guides</a> ·
  <a href="https://discord.gg/7upC2kVmyM">Discord</a>
</p>

<p align="center">
  <a href="https://github.com/BetterTyped/hyper-fetch"><img src="https://img.shields.io/github/stars/BetterTyped/hyper-fetch?style=flat&logo=github&color=333" alt="GitHub stars" /></a>
  <a href="https://www.npmjs.com/package/@hyper-fetch/core"><img src="https://img.shields.io/npm/v/@hyper-fetch/core?logo=npm&color=e76f51" alt="npm version" /></a>
  <a href="https://www.npmjs.com/org/hyper-fetch"><img src="https://api.maciejpyrc.com/portfolio/npm/downloads.svg?packages=@hyper-fetch/core,@hyper-fetch/react,@hyper-fetch/sockets,@hyper-fetch/cli,@hyper-fetch/graphql,@hyper-fetch/trpc,@hyper-fetch/orpc,@hyper-fetch/hono,@hyper-fetch/firebase,@hyper-fetch/firebase-admin,@hyper-fetch/axios,@hyper-fetch/plugin-devtools,eslint-plugin-hyper-fetch&color=fbc646" alt="Monthly downloads of all packages" /></a>
  <a href="https://bundlejs.com/?q=@hyper-fetch/core"><img src="https://api.maciejpyrc.com/portfolio/npm/size.svg?package=@hyper-fetch/core" alt="Bundle size of @hyper-fetch/core" /></a>
  <a href="https://github.com/BetterTyped/hyper-fetch"><img src="https://img.shields.io/badge/TypeScript-strict-3178C6?logo=typescript&logoColor=white" alt="TypeScript" /></a>
  <a href="https://github.com/BetterTyped/hyper-fetch/blob/main/License.md"><img src="https://img.shields.io/github/license/BetterTyped/hyper-fetch?color=blue" alt="License" /></a>
  <a href="https://twitter.com/maciej_pyrc"><img src="https://img.shields.io/twitter/follow/maciej_pyrc" alt="Follow on Twitter" /></a>
</p>

## 🚀 Quick Start

```bash
npm install @hyper-fetch/core
```

### Define requests manually

```ts
import { createClient } from "@hyper-fetch/core";

// Create a client. It is the single entry point for all your API calls
const client = createClient({ url: "https://api.example.com" });

// Define a typed request. The response shape is inferred everywhere from here
const getUsers = client.createRequest<{ response: { id: number; name: string }[] }>()({
  endpoint: "/users",
  method: "GET",
});

// Send it. data, error and status are fully typed
const { data, error, status } = await getUsers.send();
```

### Or generate from OpenAPI

```bash
npx @hyper-fetch/cli generate --url https://api.example.com/openapi.json
```

```ts
import { sdk } from "./generated";

// Every endpoint from your schema is available as a typed method
const { data } = await sdk.users.list.send();
```

## 💥 Why HyperFetch?

A typical app glues together a fetch wrapper, a query cache, a socket client, a codegen step and a mocking library. Each
one brings its own types, its own retry logic and its own bugs. Hyper Fetch is one typed layer for all of it.

| You usually combine         | With Hyper Fetch you get                               |
| --------------------------- | ------------------------------------------------------ |
| `fetch` or an Axios wrapper | `createClient()` with swappable adapters               |
| TanStack Query or SWR       | Cache, deduplication, retries and React hooks built in |
| A socket client             | Typed `Socket` listeners and emitters                  |
| OpenAPI codegen             | `npx @hyper-fetch/cli generate`                        |
| A tRPC, oRPC or Hono client | `createSdk` typed from your router                     |
| MSW and hand-written mocks  | `setMock()` on any request                             |

### 🔮 Types you never write twice

- **Zero guesswork** - Params, payload, query params, response and error are typed on every request. No `any`
- **URL params checked at compile time** - `/users/:userId` makes `userId` required. Typos fail the build
- **Typed from your schema** - Point the CLI at OpenAPI and every endpoint becomes a typed request
- **Typed from your server** - tRPC, oRPC and Hono routers type `createSdk` directly. No codegen step
- **One request, every layer** - The type you declare once flows into `send()`, hooks, cache and devtools

### 💾 Server state handled for you

- **Cache with stale time** - Fresh data comes from cache. Stale data revalidates in the background
- **Persisted cache** - Plug in `lazyStorage` and the cache survives reloads
- **No duplicate calls** - Identical requests in flight share one response
- **Optimistic updates** - Show the result now. `optimistic()` rolls it back if the request fails
- **Pagination and streams** - `useInfiniteFetch` for endless lists, `useStream` for streamed responses

### 📴 Built for bad networks

- **Retries** - Set attempts and delay per request with `setRetry()` and `setRetryTime()`
- **Offline queue** - Requests sent offline wait and replay when the connection returns
- **Cancel anything** - Abort one request or a whole group by its abort key
- **Progress** - Upload and download progress events with time estimates

### 📡 Realtime on the same model

- **WebSockets and SSE, one API** - Typed listeners and emitters for both protocols
- **Reconnects on its own** - Configurable reconnect attempts and timing
- **No render floods** - Batch messages or keep only the latest one before they reach React

### 🧪 Tooling included

- **Devtools** - HyperFlow shows every request, the cache and the queue live
- **Mocking** - `setMock()` on any request returns your data and status with no network call
- **ESLint plugin** - Catches empty and misspelled generic types on requests and clients
- **Works everywhere** - React, Next.js, Remix, Astro, Node.js and Bun. SSR hydration included

## 🔌 Works with

<table align="center">
  <tr>
    <td align="center" width="120"><a href="https://hyperfetch.bettertyped.com/docs/core/overview"><img src="./documentation/static/img/integration-rest.svg" width="40" height="40" alt="" /><br /><b>REST</b></a></td>
    <td align="center" width="120"><a href="https://hyperfetch.bettertyped.com/docs/cli/commands/generate"><img src="./documentation/static/img/integration-openapi.svg" width="40" height="40" alt="" /><br /><b>OpenAPI</b></a></td>
    <td align="center" width="120"><a href="https://hyperfetch.bettertyped.com/docs/integrations/adapter-graphql/overview"><img src="./documentation/static/img/integration-graphql.svg" width="40" height="40" alt="" /><br /><b>GraphQL</b></a></td>
    <td align="center" width="120"><a href="https://hyperfetch.bettertyped.com/docs/integrations/adapter-trpc/overview"><img src="./documentation/static/img/integration-trpc.svg" width="40" height="40" alt="" /><br /><b>tRPC</b></a></td>
    <td align="center" width="120"><a href="https://hyperfetch.bettertyped.com/docs/integrations/adapter-orpc/overview"><picture><source media="(prefers-color-scheme: dark)" srcset="./documentation/static/img/integration-orpc-dark.svg" /><img src="./documentation/static/img/integration-orpc.svg" width="40" height="40" alt="" /></picture><br /><b>oRPC</b></a></td>
    <td align="center" width="120"><a href="https://hyperfetch.bettertyped.com/docs/integrations/hono/overview"><img src="./documentation/static/img/integration-hono.svg" width="40" height="40" alt="" /><br /><b>Hono</b></a></td>
  </tr>
  <tr>
    <td align="center" width="120"><a href="https://hyperfetch.bettertyped.com/docs/integrations/adapter-firebase/overview"><img src="./documentation/static/img/integration-firebase.svg" width="40" height="40" alt="" /><br /><b>Firebase</b></a></td>
    <td align="center" width="120"><a href="https://hyperfetch.bettertyped.com/docs/integrations/adapter-firebase-admin/overview"><img src="./documentation/static/img/integration-firebase.svg" width="40" height="40" alt="" /><br /><b>Firebase Admin</b></a></td>
    <td align="center" width="120"><a href="https://hyperfetch.bettertyped.com/docs/integrations/adapter-axios/overview"><img src="./documentation/static/img/integration-axios.svg" width="40" height="40" alt="" /><br /><b>Axios</b></a></td>
    <td align="center" width="120"><a href="https://hyperfetch.bettertyped.com/docs/sockets/overview"><img src="./documentation/static/img/integration-sockets.svg" width="40" height="40" alt="" /><br /><b>Sockets &amp; SSE</b></a></td>
    <td align="center" width="120"><a href="https://hyperfetch.bettertyped.com/docs/react/overview"><img src="./documentation/static/img/integration-react.svg" width="40" height="40" alt="" /><br /><b>React</b></a></td>
  </tr>
</table>

---

## Try other BetterTyped projects

Hyper Fetch is the data layer inside Hype Stack, the full-stack template I build alongside it.

<p align="center">
  <a href="https://hype-stack.dev">
    <img src="./.github/assets/banner-hype-stack.png" alt="Build your SaaS on Hype Stack" />
  </a>
</p>

<p align="center">
	<a href="https://github.com/sponsors/prc5?tier=Platinum">
		<picture>
			<img width="830" src="https://raw.githubusercontent.com/prc5/sponsors/main/assets/Platinum.png" alt="Platinum sponsor banner"/>
		</picture>
	</a>
</p>

<p align="center">
	<a href="https://github.com/sponsors/prc5?tier=Platinum">
		<picture>
			<img width="830" src="https://raw.githubusercontent.com/prc5/sponsors/main/packages/platinum/sponsorkit/sponsors.svg" alt="Platinum sponsors"/>
		</picture>
	</a>
</p>

## 📦 Packages

| Package                                                                                                                                                                               | Version                                                                                                                                      | Downloads                                                                                                                                                                             | Size                                                                                                                                                                                                                          |
| ------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------- | -------------------------------------------------------------------------------------------------------------------------------------------- | ------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------- | ----------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------- |
| [`@hyper-fetch/core`](https://github.com/BetterTyped/hyper-fetch/tree/main/packages/core)<br /><sub>The client, requests, cache, queues, retries and offline support</sub>            | [![npm](https://img.shields.io/npm/v/@hyper-fetch/core?color=e76f51)](https://www.npmjs.com/package/@hyper-fetch/core)                       | [![downloads](https://api.maciejpyrc.com/portfolio/npm/downloads.svg?packages=@hyper-fetch/core&color=fbc646)](https://www.npmjs.com/package/@hyper-fetch/core)                       | [![size](https://api.maciejpyrc.com/portfolio/npm/size.svg?package=@hyper-fetch/core)](https://bundlejs.com/?q=@hyper-fetch/core)                                                                                             |
| [`@hyper-fetch/react`](https://github.com/BetterTyped/hyper-fetch/tree/main/packages/react)<br /><sub>`useFetch`, `useSubmit`, `useListener` and the rest of the React hooks</sub>    | [![npm](https://img.shields.io/npm/v/@hyper-fetch/react?color=e76f51)](https://www.npmjs.com/package/@hyper-fetch/react)                     | [![downloads](https://api.maciejpyrc.com/portfolio/npm/downloads.svg?packages=@hyper-fetch/react&color=fbc646)](https://www.npmjs.com/package/@hyper-fetch/react)                     | [![size](https://api.maciejpyrc.com/portfolio/npm/size.svg?package=@hyper-fetch/react&external=@hyper-fetch/core,@hyper-fetch/sockets,react)](https://bundlejs.com/?q=@hyper-fetch/react)                                     |
| [`@hyper-fetch/sockets`](https://github.com/BetterTyped/hyper-fetch/tree/main/packages/sockets)<br /><sub>Typed WebSocket and Server-Sent Events listeners and emitters</sub>         | [![npm](https://img.shields.io/npm/v/@hyper-fetch/sockets?color=e76f51)](https://www.npmjs.com/package/@hyper-fetch/sockets)                 | [![downloads](https://api.maciejpyrc.com/portfolio/npm/downloads.svg?packages=@hyper-fetch/sockets&color=fbc646)](https://www.npmjs.com/package/@hyper-fetch/sockets)                 | [![size](https://api.maciejpyrc.com/portfolio/npm/size.svg?package=@hyper-fetch/sockets&external=@hyper-fetch/core)](https://bundlejs.com/?q=@hyper-fetch/sockets)                                                            |
| [`@hyper-fetch/cli`](https://github.com/BetterTyped/hyper-fetch/tree/main/packages/cli)<br /><sub>Generates a typed SDK from an OpenAPI schema</sub>                                  | [![npm](https://img.shields.io/npm/v/@hyper-fetch/cli?color=e76f51)](https://www.npmjs.com/package/@hyper-fetch/cli)                         | [![downloads](https://api.maciejpyrc.com/portfolio/npm/downloads.svg?packages=@hyper-fetch/cli&color=fbc646)](https://www.npmjs.com/package/@hyper-fetch/cli)                         | [![size](https://img.shields.io/badge/size-runs%20with%20npx-007ec6)](https://hyperfetch.bettertyped.com/docs/cli/commands/generate)                                                                                          |
| [`@hyper-fetch/graphql`](https://github.com/BetterTyped/hyper-fetch/tree/main/packages/adapter-graphql)<br /><sub>GraphQL queries and mutations with `gql` documents</sub>            | [![npm](https://img.shields.io/npm/v/@hyper-fetch/graphql?color=e76f51)](https://www.npmjs.com/package/@hyper-fetch/graphql)                 | [![downloads](https://api.maciejpyrc.com/portfolio/npm/downloads.svg?packages=@hyper-fetch/graphql&color=fbc646)](https://www.npmjs.com/package/@hyper-fetch/graphql)                 | [![size](https://api.maciejpyrc.com/portfolio/npm/size.svg?package=@hyper-fetch/graphql&external=@hyper-fetch/core,graphql)](https://bundlejs.com/?q=@hyper-fetch/graphql)                                                    |
| [`@hyper-fetch/trpc`](https://github.com/BetterTyped/hyper-fetch/tree/main/packages/adapter-trpc)<br /><sub>tRPC procedures as typed requests, inferred from your router</sub>        | [![npm](https://img.shields.io/npm/v/@hyper-fetch/trpc?color=e76f51)](https://www.npmjs.com/package/@hyper-fetch/trpc)                       | [![downloads](https://api.maciejpyrc.com/portfolio/npm/downloads.svg?packages=@hyper-fetch/trpc&color=fbc646)](https://www.npmjs.com/package/@hyper-fetch/trpc)                       | [![size](https://api.maciejpyrc.com/portfolio/npm/size.svg?package=@hyper-fetch/trpc&external=@hyper-fetch/core,@trpc/server,@trpc/client)](https://bundlejs.com/?q=@hyper-fetch/trpc)                                        |
| [`@hyper-fetch/orpc`](https://github.com/BetterTyped/hyper-fetch/tree/main/packages/adapter-orpc)<br /><sub>oRPC procedures as typed requests, inferred from your router</sub>        | [![npm](https://img.shields.io/npm/v/@hyper-fetch/orpc?color=e76f51)](https://www.npmjs.com/package/@hyper-fetch/orpc)                       | [![downloads](https://api.maciejpyrc.com/portfolio/npm/downloads.svg?packages=@hyper-fetch/orpc&color=fbc646)](https://www.npmjs.com/package/@hyper-fetch/orpc)                       | [![size](https://api.maciejpyrc.com/portfolio/npm/size.svg?package=@hyper-fetch/orpc&external=@hyper-fetch/core,@orpc/client,@orpc/server)](https://bundlejs.com/?q=@hyper-fetch/orpc)                                        |
| [`@hyper-fetch/hono`](https://github.com/BetterTyped/hyper-fetch/tree/main/packages/hono)<br /><sub>A typed SDK from your Hono app type. Types only, no server code</sub>             | [![npm](https://img.shields.io/npm/v/@hyper-fetch/hono?color=e76f51)](https://www.npmjs.com/package/@hyper-fetch/hono)                       | [![downloads](https://api.maciejpyrc.com/portfolio/npm/downloads.svg?packages=@hyper-fetch/hono&color=fbc646)](https://www.npmjs.com/package/@hyper-fetch/hono)                       | [![size](https://api.maciejpyrc.com/portfolio/npm/size.svg?package=@hyper-fetch/hono&external=@hyper-fetch/core,hono)](https://bundlejs.com/?q=@hyper-fetch/hono)                                                             |
| [`@hyper-fetch/firebase`](https://github.com/BetterTyped/hyper-fetch/tree/main/packages/adapter-firebase)<br /><sub>Firestore and Realtime Database from the browser</sub>            | [![npm](https://img.shields.io/npm/v/@hyper-fetch/firebase?color=e76f51)](https://www.npmjs.com/package/@hyper-fetch/firebase)               | [![downloads](https://api.maciejpyrc.com/portfolio/npm/downloads.svg?packages=@hyper-fetch/firebase&color=fbc646)](https://www.npmjs.com/package/@hyper-fetch/firebase)               | [![size](https://api.maciejpyrc.com/portfolio/npm/size.svg?package=@hyper-fetch/firebase&external=@hyper-fetch/core,@hyper-fetch/sockets,firebase)](https://bundlejs.com/?q=@hyper-fetch/firebase)                            |
| [`@hyper-fetch/firebase-admin`](https://github.com/BetterTyped/hyper-fetch/tree/main/packages/adapter-firebase-admin)<br /><sub>Firestore and Realtime Database from the server</sub> | [![npm](https://img.shields.io/npm/v/@hyper-fetch/firebase-admin?color=e76f51)](https://www.npmjs.com/package/@hyper-fetch/firebase-admin)   | [![downloads](https://api.maciejpyrc.com/portfolio/npm/downloads.svg?packages=@hyper-fetch/firebase-admin&color=fbc646)](https://www.npmjs.com/package/@hyper-fetch/firebase-admin)   | [![size](https://api.maciejpyrc.com/portfolio/npm/size.svg?package=@hyper-fetch/firebase-admin&external=@hyper-fetch/core,@hyper-fetch/sockets,firebase,firebase-admin)](https://bundlejs.com/?q=@hyper-fetch/firebase-admin) |
| [`@hyper-fetch/axios`](https://github.com/BetterTyped/hyper-fetch/tree/main/packages/adapter-axios)<br /><sub>Runs every request through Axios</sub>                                  | [![npm](https://img.shields.io/npm/v/@hyper-fetch/axios?color=e76f51)](https://www.npmjs.com/package/@hyper-fetch/axios)                     | [![downloads](https://api.maciejpyrc.com/portfolio/npm/downloads.svg?packages=@hyper-fetch/axios&color=fbc646)](https://www.npmjs.com/package/@hyper-fetch/axios)                     | [![size](https://api.maciejpyrc.com/portfolio/npm/size.svg?package=@hyper-fetch/axios&external=@hyper-fetch/core,axios)](https://bundlejs.com/?q=@hyper-fetch/axios)                                                          |
| [`@hyper-fetch/plugin-devtools`](https://github.com/BetterTyped/hyper-fetch/tree/main/packages/plugin-devtools)<br /><sub>Connects your app to the HyperFlow devtools</sub>           | [![npm](https://img.shields.io/npm/v/@hyper-fetch/plugin-devtools?color=e76f51)](https://www.npmjs.com/package/@hyper-fetch/plugin-devtools) | [![downloads](https://api.maciejpyrc.com/portfolio/npm/downloads.svg?packages=@hyper-fetch/plugin-devtools&color=fbc646)](https://www.npmjs.com/package/@hyper-fetch/plugin-devtools) | [![size](https://api.maciejpyrc.com/portfolio/npm/size.svg?package=@hyper-fetch/plugin-devtools&external=@hyper-fetch/core,@hyper-fetch/sockets)](https://bundlejs.com/?q=@hyper-fetch/plugin-devtools)                       |
| [`eslint-plugin-hyper-fetch`](https://github.com/BetterTyped/hyper-fetch/tree/main/packages/plugin-eslint)<br /><sub>Lint rules for request and client generic types</sub>            | [![npm](https://img.shields.io/npm/v/eslint-plugin-hyper-fetch?color=e76f51)](https://www.npmjs.com/package/eslint-plugin-hyper-fetch)       | [![downloads](https://api.maciejpyrc.com/portfolio/npm/downloads.svg?packages=eslint-plugin-hyper-fetch&color=fbc646)](https://www.npmjs.com/package/eslint-plugin-hyper-fetch)       | [![size](https://api.maciejpyrc.com/portfolio/npm/size.svg?package=eslint-plugin-hyper-fetch&external=eslint,@typescript-eslint/utils)](https://bundlejs.com/?q=eslint-plugin-hyper-fetch)                                    |
| [`oxlint-plugin-hyper-fetch`](https://github.com/BetterTyped/hyper-fetch/tree/main/packages/plugin-oxlint)<br /><sub>The same rules on Oxlint, the Rust linter</sub>                  | [![npm](https://img.shields.io/npm/v/oxlint-plugin-hyper-fetch?color=e76f51)](https://www.npmjs.com/package/oxlint-plugin-hyper-fetch)       | [![downloads](https://api.maciejpyrc.com/portfolio/npm/downloads.svg?packages=oxlint-plugin-hyper-fetch&color=fbc646)](https://www.npmjs.com/package/oxlint-plugin-hyper-fetch)       | [![size](https://api.maciejpyrc.com/portfolio/npm/size.svg?package=oxlint-plugin-hyper-fetch&external=oxlint,@oxlint/plugins)](https://bundlejs.com/?q=oxlint-plugin-hyper-fetch)                                             |

<p align="center">
	<a href="https://github.com/sponsors/prc5?tier=Gold">
		<picture>
			<img width="830" src="https://raw.githubusercontent.com/prc5/sponsors/main/assets/Gold.png" alt="Gold sponsor banner"/>
		</picture>
	</a>
</p>

<p align="center">
	<a href="https://github.com/sponsors/prc5?tier=Gold">
		<picture>
			<img width="830" src="https://raw.githubusercontent.com/prc5/sponsors/main/packages/gold/sponsorkit/sponsors.svg" alt="Gold sponsors"/>
		</picture>
	</a>
</p>

## Examples

### Fetching data

```ts
// Every value you get back is typed
const { data, error, status } = await getUsers.send();
```

### Mutation with params and payload

```ts
// Params go in the URL and the payload goes in the body. Both are typed
const { data, error, status } = await createUser.send({
  params: { teamId: 1 },
  payload: { name: "Jane", email: "jane@example.com" },
});
```

### React hooks

```tsx
import { useFetch } from "@hyper-fetch/react";

const UserList = () => {
  // useFetch triggers the request on mount and returns typed state
  const { data, loading, error } = useFetch(getUsers);

  if (loading) return <p>Loading...</p>;
  if (error) return <p>Error loading users</p>;
  return (
    <ul>
      {data?.map((u) => (
        <li key={u.id}>{u.name}</li>
      ))}
    </ul>
  );
};
```

## Documentation

- [Getting Started](https://hyperfetch.bettertyped.com/docs/getting-started/quick-start)
- [Core Concepts](https://hyperfetch.bettertyped.com/docs/core/overview)
- [React Integration](https://hyperfetch.bettertyped.com/docs/react/overview)
- [CLI & SDK Generation](https://hyperfetch.bettertyped.com/docs/cli/commands/generate)
- [API Reference](https://hyperfetch.bettertyped.com/api/)
- [Guides](https://hyperfetch.bettertyped.com/docs/guides/Basic/Setup)

<p align="center">
	<a href="https://github.com/sponsors/prc5?tier=Silver">
		<picture>
			<img width="830" src="https://raw.githubusercontent.com/prc5/sponsors/main/assets/Silver.png" alt="Silver sponsor banner"/>
		</picture>
	</a>
</p>

<p align="center">
	<a href="https://github.com/sponsors/prc5?tier=Silver">
		<picture>
			<img width="830" src="https://raw.githubusercontent.com/prc5/sponsors/main/packages/silver/sponsorkit/sponsors.svg" alt="Silver sponsors"/>
		</picture>
	</a>
</p>

## Our sponsors

<p align="center">
	<a href="https://github.com/sponsors/prc5">
		<img src="https://raw.githubusercontent.com/prc5/sponsors/main/packages/other/sponsorkit/sponsors.svg?raw=true" alt="Sponsors" />
	</a>
</p>

## License

[Apache-2.0](https://github.com/BetterTyped/hyper-fetch/blob/main/License.md)
