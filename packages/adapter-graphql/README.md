# 🎡 Hyper Fetch GraphQL

<p align="center">
  <b>GraphQL adapter for HyperFetch. Typed queries, mutations, and subscriptions.</b>
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

This adapter connects HyperFetch to GraphQL APIs. You get typed queries, mutations, and subscriptions that work with
HyperFetch's caching, queuing, and React hooks — the same request patterns you use for REST, but with GraphQL
operations.

## 🎯 Key Capabilities

- 🎡 **GraphQL meets HyperFetch** — Typed queries, mutations, and subscriptions with cache and queue support
- 🔮 **End-to-end types** — Full TypeScript types for operations, variables, and responses
- 📡 **Any GraphQL server** — Compatible with Apollo, Yoga, Hasura, and any spec-compliant endpoint
- ⚛️ **React-ready** — Use `useFetch` and `useSubmit` for GraphQL operations in components
- 💾 **Smart caching included** — Cache and offline support work the same as REST — no extra config

## 🚀 Quick Start

```bash
npm install @hyper-fetch/core @hyper-fetch/graphql
```

```ts
import { createClient } from "@hyper-fetch/core";
import { GraphQLAdapter } from "@hyper-fetch/graphql";

const client = createClient({ url: "https://api.example.com/graphql" }).setAdapter(GraphQLAdapter());
```

## 📚 Documentation

- [GraphQL Adapter Docs](https://hyperfetch.bettertyped.com/docs/integrations/adapter-graphql)
- [Getting Started](https://hyperfetch.bettertyped.com/docs/getting-started/quick-start)
- [API Reference](https://hyperfetch.bettertyped.com/api/)

## 💡 Examples

### Query

```ts
interface UsersResponse {
  users: { id: string; name: string; email: string }[];
}

const getUsers = client.createRequest<{ response: UsersResponse }>()({
  endpoint: "",
  method: "POST",
});

const { data } = await getUsers
  .setData({
    query: `
      query GetUsers($limit: Int) {
        users(limit: $limit) {
          id
          name
          email
        }
      }
    `,
    variables: { limit: 10 },
  })
  .send();

console.log(data.users);
```

### Mutation

```ts
interface CreateUserResponse {
  createUser: { id: string; name: string };
}

const createUser = client.createRequest<{
  response: CreateUserResponse;
}>()({
  endpoint: "",
  method: "POST",
});

const { data } = await createUser
  .setData({
    query: `
      mutation CreateUser($name: String!, $email: String!) {
        createUser(name: $name, email: $email) {
          id
          name
        }
      }
    `,
    variables: { name: "Jane", email: "jane@example.com" },
  })
  .send();

console.log("Created:", data.createUser.name);
```

### With React hooks

```tsx
import { useFetch } from "@hyper-fetch/react";

const UserList = () => {
  const { data, loading } = useFetch(
    getUsers.setData({
      query: `{ users { id name } }`,
    }),
  );

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

## License

[MIT](https://github.com/BetterTyped/hyper-fetch/blob/main/License.md)
