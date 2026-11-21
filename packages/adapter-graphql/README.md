# 🎡 Hyper Fetch GraphQL

<p align="center">
  <b>GraphQL adapters for HyperFetch. Typed queries and mutations over HTTP, subscriptions over WebSocket.</b>
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
  <a href="https://www.npmjs.com/package/@hyper-fetch/graphql">
    <img src="https://custom-icon-badges.demolab.com/npm/v/@hyper-fetch/graphql.svg?logo=npm&color=e76f51" />
  </a>
  <a href="https://www.npmjs.com/package/@hyper-fetch/graphql">
    <img src="https://custom-icon-badges.demolab.com/npm/dm/@hyper-fetch/graphql?logoColor=fff&logo=trending-up" />
  </a>
  <a href="https://github.com/BetterTyped/hyper-fetch">
    <img src="https://custom-icon-badges.demolab.com/badge/typescript-%23007ACC.svg?logo=typescript&logoColor=white" />
  </a>
  <a href="https://bundlephobia.com/package/@hyper-fetch/graphql">
    <img src="https://custom-icon-badges.demolab.com/bundlephobia/minzip/@hyper-fetch/graphql?color=64BC4B&logo=package" />
  </a>
  <a href="https://github.com/BetterTyped/hyper-fetch">
    <img src="https://img.shields.io/badge/graphql-e10098?logo=graphql&logoColor=white" alt="GraphQL" />
  </a>
</p>

## 📖 About

This package connects HyperFetch to GraphQL APIs. `GraphqlAdapter` sends typed queries and mutations over HTTP that work
with HyperFetch's caching, queuing, and React hooks — the same request patterns you use for REST, but with GraphQL
operations. `GraphqlWsAdapter` listens to subscriptions over WebSocket with the `graphql-transport-ws` protocol of
`graphql-ws`.

## 🎯 Key Capabilities

- 🎡 **GraphQL meets HyperFetch** — Typed queries and mutations with cache and queue support
- 🔮 **End-to-end types** — Full TypeScript types for operations, variables, and responses
- 📡 **Any GraphQL server** — Compatible with Apollo, Yoga, Hasura, and any spec-compliant endpoint
- 🔴 **Subscriptions** — `graphql-transport-ws` over WebSocket, with reconnecting, shared subscriptions and lazy
  connections
- ⚛️ **React-ready** — Use `useFetch`, `useSubmit` and `useListener` for GraphQL operations in components
- 💾 **Smart caching included** — Cache and offline support work the same as REST — no extra config

## 🚀 Quick Start

```bash
npm install @hyper-fetch/core @hyper-fetch/graphql graphql-tag
```

```ts
import { createClient } from "@hyper-fetch/core";
import { GraphqlAdapter } from "@hyper-fetch/graphql";

const client = createClient({ url: "https://api.example.com/graphql" }).setAdapter(GraphqlAdapter());
```

## 📚 Documentation

- [GraphQL Adapter Docs](https://hyperfetch.bettertyped.com/docs/integrations/adapter-graphql/overview)
- [GraphQL Subscriptions](https://hyperfetch.bettertyped.com/docs/integrations/adapter-graphql/subscriptions)
- [Getting Started](https://hyperfetch.bettertyped.com/docs/getting-started/quick-start)
- [API Reference](https://hyperfetch.bettertyped.com/api/)

## 💡 Examples

### Query

The query goes in `endpoint` as a `gql` document.

```ts
import gql from "graphql-tag";

interface UsersResponse {
  users: { id: string; name: string; email: string }[];
}

const getUsers = client.createRequest<{ response: UsersResponse; payload: { limit: number } }>()({
  endpoint: gql`
    query GetUsers($limit: Int) {
      users(limit: $limit) {
        id
        name
        email
      }
    }
  `,
});

// The payload is sent as the GraphQL variables
const { data } = await getUsers.send({ payload: { limit: 10 } });

console.log(data?.users);
```

### Mutation

```ts
interface CreateUserResponse {
  createUser: { id: string; name: string };
}

const createUser = client.createRequest<{
  response: CreateUserResponse;
  payload: { name: string; email: string };
}>()({
  endpoint: gql`
    mutation CreateUser($name: String!, $email: String!) {
      createUser(name: $name, email: $email) {
        id
        name
      }
    }
  `,
});

const { data } = await createUser.send({
  payload: { name: "Jane", email: "jane@example.com" },
});

console.log("Created:", data?.createUser.name);
```

### With React hooks

```tsx
import { useFetch } from "@hyper-fetch/react";

const UserList = () => {
  const { data, loading } = useFetch(getUsers.setPayload({ limit: 10 }));

  if (loading) return <p>Loading...</p>;
  return (
    <ul>
      {data?.users.map((u) => (
        <li key={u.id}>{u.name}</li>
      ))}
    </ul>
  );
};
```

### Subscription

Subscriptions need `@hyper-fetch/sockets`. A typed document from graphql-codegen or gql.tada types the data and the
variables.

```ts
import { Socket } from "@hyper-fetch/sockets";
import { GraphqlWsAdapter } from "@hyper-fetch/graphql";

const socket = new Socket({
  url: "wss://api.example.com/graphql",
  adapter: GraphqlWsAdapter(),
  adapterOptions: { connectionParams: async () => ({ token: await getToken() }) },
});

const onMessage = socket.createListener()({ topic: "OnMessage", options: { document: OnMessageDocument } });

onMessage.setPayload({ room: "general" }).listen(({ data }) => {
  console.log(data.onMessage.text);
});
```

## License

[Apache-2.0](https://github.com/BetterTyped/hyper-fetch/blob/main/License.md)
