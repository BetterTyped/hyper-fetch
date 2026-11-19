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
  <a href="https://www.npmjs.com/package/@hyper-fetch/core"><img src="https://img.shields.io/npm/dm/@hyper-fetch/core?color=fbc646" alt="npm downloads" /></a>
  <a href="https://bundlejs.com/?q=@hyper-fetch/core"><img src="https://img.shields.io/bundlejs/size/@hyper-fetch/core?label=size" alt="Bundle size" /></a>
  <a href="https://github.com/BetterTyped/hyper-fetch"><img src="https://img.shields.io/badge/TypeScript-strict-3178C6?logo=typescript&logoColor=white" alt="TypeScript" /></a>
  <a href="https://github.com/BetterTyped/hyper-fetch/blob/main/License.md"><img src="https://img.shields.io/github/license/BetterTyped/hyper-fetch?color=blue" alt="License" /></a>
  <a href="https://twitter.com/maciej_pyrc"><img src="https://img.shields.io/twitter/follow/maciej_pyrc" alt="Follow on Twitter" /></a>
</p>

## ⚡ One request shape on every backend

Pick the adapter for your backend. Everything after that is the same: `createRequest()`, `send()`, the React hooks,
the cache, retries, deduplication and offline replay.

```ts
import { createClient } from "@hyper-fetch/core";
import { GraphqlAdapter } from "@hyper-fetch/graphql";
import { FirebaseAdapter } from "@hyper-fetch/firebase";
import { AxiosAdapter } from "@hyper-fetch/axios";

const rest = createClient({ url: "https://api.example.com" });
const graphql = createClient({ url: "https://api.example.com/graphql" }).setAdapter(GraphqlAdapter());
const firestore = createClient({ url: "" }).setAdapter(FirebaseAdapter(getFirestore()));
const axios = createClient({ url: "https://api.example.com" }).setAdapter(AxiosAdapter);

// The request looks the same whichever client made it
const getUser = rest.createRequest<{ response: User }>()({ endpoint: "/users/:userId" });

// data, error and status are typed. send() never throws
const { data, error, status } = await getUser.setParams({ userId: 1 }).send();
```

Realtime uses the same typed model, over WebSockets or Server-Sent Events:

```ts
import { Socket } from "@hyper-fetch/sockets";

const socket = new Socket({ url: "wss://api.example.com" });
const onMessage = socket.createListener<{ response: Message }>()({ endpoint: "chat-message" });

onMessage.listen({ callback: ({ data }) => console.log(data.text) });
```

## 🔌 Works with

<table align="center">
  <tr>
    <td align="center" width="120"><a href="https://hyperfetch.bettertyped.com/docs/core/overview"><img src="./documentation/static/img/integration-rest.svg" width="40" height="40" alt="" /><br /><b>REST</b></a><br /><sub>core</sub></td>
    <td align="center" width="120"><a href="https://hyperfetch.bettertyped.com/docs/cli/commands/generate"><img src="./documentation/static/img/integration-openapi.svg" width="40" height="40" alt="" /><br /><b>OpenAPI</b></a><br /><sub>cli</sub></td>
    <td align="center" width="120"><a href="https://hyperfetch.bettertyped.com/docs/integrations/adapter-graphql/overview"><img src="./documentation/static/img/integration-graphql.svg" width="40" height="40" alt="" /><br /><b>GraphQL</b></a><br /><sub>graphql</sub></td>
    <td align="center" width="120"><img src="./documentation/static/img/integration-trpc.svg" width="40" height="40" alt="" /><br /><b>tRPC</b><br /><sub>coming soon</sub></td>
    <td align="center" width="120"><img src="./documentation/static/img/integration-orpc.svg" width="40" height="40" alt="" /><br /><b>oRPC</b><br /><sub>coming soon</sub></td>
    <td align="center" width="120"><a href="https://hyperfetch.bettertyped.com/docs/integrations/hono/overview"><img src="./documentation/static/img/integration-hono.svg" width="40" height="40" alt="" /><br /><b>Hono</b></a><br /><sub>hono</sub></td>
  </tr>
  <tr>
    <td align="center" width="120"><a href="https://hyperfetch.bettertyped.com/docs/integrations/adapter-firebase/overview"><img src="./documentation/static/img/integration-firebase.svg" width="40" height="40" alt="" /><br /><b>Firebase</b></a><br /><sub>firebase</sub></td>
    <td align="center" width="120"><a href="https://hyperfetch.bettertyped.com/docs/integrations/adapter-firebase-admin/overview"><img src="./documentation/static/img/integration-firebase.svg" width="40" height="40" alt="" /><br /><b>Firebase Admin</b></a><br /><sub>firebase-admin</sub></td>
    <td align="center" width="120"><a href="https://hyperfetch.bettertyped.com/docs/integrations/adapter-axios/overview"><img src="./documentation/static/img/integration-axios.svg" width="40" height="40" alt="" /><br /><b>Axios</b></a><br /><sub>axios</sub></td>
    <td align="center" width="120"><a href="https://hyperfetch.bettertyped.com/docs/sockets/overview"><img src="./documentation/static/img/integration-sockets.svg" width="40" height="40" alt="" /><br /><b>Realtime</b></a><br /><sub>WebSockets, SSE</sub></td>
    <td align="center" width="120"><a href="https://hyperfetch.bettertyped.com/docs/react/overview"><img src="./documentation/static/img/integration-react.svg" width="40" height="40" alt="" /><br /><b>React</b></a><br /><sub>react</sub></td>
  </tr>
</table>

## 🚀 Quick Start

```bash
npm install @hyper-fetch/core @hyper-fetch/react
```

### Define requests by hand

```ts
import { createClient } from "@hyper-fetch/core";

const client = createClient({ url: "https://api.example.com" });

// The response type follows this request into send(), hooks and the cache
const getUsers = client.createRequest<{ response: { id: number; name: string }[] }>()({
  endpoint: "/users",
  method: "GET",
});

const { data, error, status } = await getUsers.send();
```

### Or generate them from OpenAPI

```bash
npx @hyper-fetch/cli generate --url https://api.example.com/openapi.json
```

```ts
import { sdk } from "./generated";

// Every endpoint in your schema becomes a typed request
const { data } = await sdk.users.list.send();
```

## Why HyperFetch?

- 🔮 **Zero guesswork** - Types flow from your schema to the response. Full autocompletion and no `any`
- 📡 **One model for every transport** - REST, GraphQL, Firebase, WebSockets and SSE share one request API
- 💾 **Data management built in** - Caching, queuing, offline replay, retries and deduplication out of the box
- ⚡ **Works everywhere** - React, Next.js, Remix, Astro, Node.js and Bun run the same code

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

## Packages

| Package                                                                                                             | Version                                                                                                                         | Downloads                                                                                                                              | Size                                                                                                                                          |
| ------------------------------------------------------------------------------------------------------------------- | ------------------------------------------------------------------------------------------------------------------------------- | -------------------------------------------------------------------------------------------------------------------------------------- | --------------------------------------------------------------------------------------------------------------------------------------------- |
| [@hyper-fetch/core](https://github.com/BetterTyped/hyper-fetch/tree/main/packages/core)                             | [![npm](https://img.shields.io/npm/v/@hyper-fetch/core)](https://www.npmjs.com/package/@hyper-fetch/core)                       | [![downloads](https://img.shields.io/npm/dm/@hyper-fetch/core)](https://www.npmjs.com/package/@hyper-fetch/core)                       | [![size](https://badgen.net/bundlephobia/minzip/@hyper-fetch/core)](https://bundlephobia.com/package/@hyper-fetch/core)                       |
| [@hyper-fetch/react](https://github.com/BetterTyped/hyper-fetch/tree/main/packages/react)                           | [![npm](https://img.shields.io/npm/v/@hyper-fetch/react)](https://www.npmjs.com/package/@hyper-fetch/react)                     | [![downloads](https://img.shields.io/npm/dm/@hyper-fetch/react)](https://www.npmjs.com/package/@hyper-fetch/react)                     | [![size](https://badgen.net/bundlephobia/minzip/@hyper-fetch/react)](https://bundlephobia.com/package/@hyper-fetch/react)                     |
| [@hyper-fetch/sockets](https://github.com/BetterTyped/hyper-fetch/tree/main/packages/sockets)                       | [![npm](https://img.shields.io/npm/v/@hyper-fetch/sockets)](https://www.npmjs.com/package/@hyper-fetch/sockets)                 | [![downloads](https://img.shields.io/npm/dm/@hyper-fetch/sockets)](https://www.npmjs.com/package/@hyper-fetch/sockets)                 | [![size](https://badgen.net/bundlephobia/minzip/@hyper-fetch/sockets)](https://bundlephobia.com/package/@hyper-fetch/sockets)                 |
| [@hyper-fetch/cli](https://github.com/BetterTyped/hyper-fetch/tree/main/packages/cli)                               | [![npm](https://img.shields.io/npm/v/@hyper-fetch/cli)](https://www.npmjs.com/package/@hyper-fetch/cli)                         | [![downloads](https://img.shields.io/npm/dm/@hyper-fetch/cli)](https://www.npmjs.com/package/@hyper-fetch/cli)                         | [![size](https://badgen.net/bundlephobia/minzip/@hyper-fetch/cli)](https://bundlephobia.com/package/@hyper-fetch/cli)                         |
| [@hyper-fetch/firebase](https://github.com/BetterTyped/hyper-fetch/tree/main/packages/adapter-firebase)             | [![npm](https://img.shields.io/npm/v/@hyper-fetch/firebase)](https://www.npmjs.com/package/@hyper-fetch/firebase)               | [![downloads](https://img.shields.io/npm/dm/@hyper-fetch/firebase)](https://www.npmjs.com/package/@hyper-fetch/firebase)               | [![size](https://badgen.net/bundlephobia/minzip/@hyper-fetch/firebase)](https://bundlephobia.com/package/@hyper-fetch/firebase)               |
| [@hyper-fetch/firebase-admin](https://github.com/BetterTyped/hyper-fetch/tree/main/packages/adapter-firebase-admin) | [![npm](https://img.shields.io/npm/v/@hyper-fetch/firebase-admin)](https://www.npmjs.com/package/@hyper-fetch/firebase-admin)   | [![downloads](https://img.shields.io/npm/dm/@hyper-fetch/firebase-admin)](https://www.npmjs.com/package/@hyper-fetch/firebase-admin)   | [![size](https://badgen.net/bundlephobia/minzip/@hyper-fetch/firebase-admin)](https://bundlephobia.com/package/@hyper-fetch/firebase-admin)   |
| [@hyper-fetch/graphql](https://github.com/BetterTyped/hyper-fetch/tree/main/packages/adapter-graphql)               | [![npm](https://img.shields.io/npm/v/@hyper-fetch/graphql)](https://www.npmjs.com/package/@hyper-fetch/graphql)                 | [![downloads](https://img.shields.io/npm/dm/@hyper-fetch/graphql)](https://www.npmjs.com/package/@hyper-fetch/graphql)                 | [![size](https://badgen.net/bundlephobia/minzip/@hyper-fetch/graphql)](https://bundlephobia.com/package/@hyper-fetch/graphql)                 |
| [@hyper-fetch/orpc](https://github.com/BetterTyped/hyper-fetch/tree/main/packages/adapter-orpc)                     | [![npm](https://img.shields.io/npm/v/@hyper-fetch/orpc)](https://www.npmjs.com/package/@hyper-fetch/orpc)                       | [![downloads](https://img.shields.io/npm/dm/@hyper-fetch/orpc)](https://www.npmjs.com/package/@hyper-fetch/orpc)                       | [![size](https://badgen.net/bundlephobia/minzip/@hyper-fetch/orpc)](https://bundlephobia.com/package/@hyper-fetch/orpc)                       |
| [@hyper-fetch/trpc](https://github.com/BetterTyped/hyper-fetch/tree/main/packages/adapter-trpc)               | [![npm](https://img.shields.io/npm/v/@hyper-fetch/trpc)](https://www.npmjs.com/package/@hyper-fetch/trpc)                 | [![downloads](https://img.shields.io/npm/dm/@hyper-fetch/trpc)](https://www.npmjs.com/package/@hyper-fetch/trpc)                 | [![size](https://badgen.net/bundlephobia/minzip/@hyper-fetch/trpc)](https://bundlephobia.com/package/@hyper-fetch/trpc)                 |
| [@hyper-fetch/axios](https://github.com/BetterTyped/hyper-fetch/tree/main/packages/adapter-axios)                   | [![npm](https://img.shields.io/npm/v/@hyper-fetch/axios)](https://www.npmjs.com/package/@hyper-fetch/axios)                     | [![downloads](https://img.shields.io/npm/dm/@hyper-fetch/axios)](https://www.npmjs.com/package/@hyper-fetch/axios)                     | [![size](https://badgen.net/bundlephobia/minzip/@hyper-fetch/axios)](https://bundlephobia.com/package/@hyper-fetch/axios)                     |
| [@hyper-fetch/hono](https://github.com/BetterTyped/hyper-fetch/tree/main/packages/hono)                             | [![npm](https://img.shields.io/npm/v/@hyper-fetch/hono)](https://www.npmjs.com/package/@hyper-fetch/hono)                       | [![downloads](https://img.shields.io/npm/dm/@hyper-fetch/hono)](https://www.npmjs.com/package/@hyper-fetch/hono)                       | [![size](https://badgen.net/bundlephobia/minzip/@hyper-fetch/hono)](https://bundlephobia.com/package/@hyper-fetch/hono)                       |
| [@hyper-fetch/plugin-devtools](https://github.com/BetterTyped/hyper-fetch/tree/main/packages/plugin-devtools)       | [![npm](https://img.shields.io/npm/v/@hyper-fetch/plugin-devtools)](https://www.npmjs.com/package/@hyper-fetch/plugin-devtools) | [![downloads](https://img.shields.io/npm/dm/@hyper-fetch/plugin-devtools)](https://www.npmjs.com/package/@hyper-fetch/plugin-devtools) | [![size](https://badgen.net/bundlephobia/minzip/@hyper-fetch/plugin-devtools)](https://bundlephobia.com/package/@hyper-fetch/plugin-devtools) |

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
// Params go in the URL and data goes in the body. Both are typed
const { data, error, status } = await createUser.send({
  params: { teamId: 1 },
  data: { name: "Jane", email: "jane@example.com" },
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
  return <ul>{data?.map((u) => <li key={u.id}>{u.name}</li>)}</ul>;
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
