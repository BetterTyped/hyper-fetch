<h1 align="center">

<img src="./.github/assets/readme.png" alt="Hyper Fetch" />

</h1>

<div align="center">

# Hyper Fetch

**One SDK. Any API. Fully typed.**

The type-safe API layer for TypeScript apps. Connect to REST, GraphQL, Firebase, WebSockets, SSE — all with one
consistent interface and the best type safety in the ecosystem.

**[Documentation](https://hyperfetch.bettertyped.com/) |
[Quick Start](https://hyperfetch.bettertyped.com/docs/getting-started/quick-start) |
[Guides](https://hyperfetch.bettertyped.com/docs/guides/Basic/Setup)**

</div>

<div align="center">
  <a href="https://bettertyped.com/">
    <img src="https://custom-icon-badges.demolab.com/static/v1?label=&message=BetterTyped&color=333&logo=BT" />
  </a>
  <a href="https://github.com/BetterTyped/hyper-fetch">
    <img src="https://custom-icon-badges.demolab.com/github/stars/BetterTyped/hyper-fetch?logo=star&style=flat" />
  </a>
  <a href="https://github.com/BetterTyped/hyper-fetch/blob/main/License.md">
    <img src="https://custom-icon-badges.demolab.com/github/license/BetterTyped/hyper-fetch?logo=law&color=blue" />
  </a>
  <a href="https://github.com/semantic-release/semantic-release">
    <img src="https://custom-icon-badges.demolab.com/badge/semver-commitzen-e10079?logo=semantic-release&color=9146ff" />
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
</div>

<br />

## Quick Start

### Define requests manually

```ts
import { createClient } from "@hyper-fetch/core";

// Create a client — this is the single entry point for all your API calls
const client = createClient({ url: "https://api.example.com" });

// Define a typed request — response shape is inferred everywhere from here
const getUsers = client.createRequest<{ response: { id: number; name: string }[] }>()({
  endpoint: "/users",
  method: "GET",
});

// Send it — data, error, and status are fully typed
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

## Why HyperFetch?

- 🔮 **Zero guesswork** — End-to-end TypeScript types from schema to response, full autocompletion, zero `any`
- 📡 **One interface for everything** — REST, GraphQL, Firebase, WebSockets, SSE — stop learning a new library for each
  API
- 💾 **Data management built in** — Caching, queuing, offline support, retries, and deduplication out of the box
- ⚡ **Works everywhere** — React, Next.js, Remix, Astro, Node.js, Bun — same API, every environment

---

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
| [@hyper-fetch/axios](https://github.com/BetterTyped/hyper-fetch/tree/main/packages/adapter-axios)                   | [![npm](https://img.shields.io/npm/v/@hyper-fetch/axios)](https://www.npmjs.com/package/@hyper-fetch/axios)                     | [![downloads](https://img.shields.io/npm/dm/@hyper-fetch/axios)](https://www.npmjs.com/package/@hyper-fetch/axios)                     | [![size](https://badgen.net/bundlephobia/minzip/@hyper-fetch/axios)](https://bundlephobia.com/package/@hyper-fetch/axios)                     |
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
// Send and destructure — all return values are typed
const { data, error, status } = await getUsers.send();
```

### Mutation with params and payload

```ts
// Params go in the URL, data goes in the body — both fully typed
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

[MIT](https://github.com/BetterTyped/hyper-fetch/blob/main/License.md)
