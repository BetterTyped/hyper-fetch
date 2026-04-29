# 🔥 Hyper Fetch Firebase

<p align="center">
  <b>Type-safe Firebase/Firestore client built on HyperFetch. CRUD, realtime listeners, auth — all typed.</b>
</p>

<p align="center">
  <a href="https://github.com/BetterTyped/hyper-fetch">
    <img src="https://img.shields.io/github/stars/BetterTyped/hyper-fetch?style=flat" alt="GitHub stars" />
  </a>
  <a href="https://www.npmjs.com/package/@hyper-fetch/firebase">
    <img src="https://img.shields.io/npm/v/@hyper-fetch/firebase" alt="npm version" />
  </a>
  <a href="https://www.npmjs.com/package/@hyper-fetch/firebase">
    <img src="https://img.shields.io/npm/dm/@hyper-fetch/firebase" alt="npm downloads" />
  </a>
  <a href="https://bundlephobia.com/package/@hyper-fetch/firebase">
    <img src="https://img.shields.io/bundlephobia/minzip/@hyper-fetch/firebase" alt="bundle size" />
  </a>
  <a href="https://github.com/BetterTyped/hyper-fetch/blob/main/License.md">
    <img src="https://img.shields.io/github/license/BetterTyped/hyper-fetch" alt="License" />
  </a>
  <a href="https://github.com/BetterTyped/hyper-fetch">
    <img src="https://img.shields.io/badge/typescript-%23007ACC.svg?logo=typescript&logoColor=white" alt="TypeScript" />
  </a>
  <a href="https://github.com/BetterTyped/hyper-fetch">
    <img src="https://img.shields.io/badge/firebase-ffca28?logo=firebase&logoColor=black" alt="Firebase" />
  </a>
</p>

## 📖 About

This adapter brings HyperFetch's typed request system to Firebase. Use the same `createRequest` / `.send()` patterns for Firestore and Realtime Database operations with typed responses, caching, queuing, and React hooks — the same API you use for REST.

## 🎯 Key Capabilities

- 🔥 **Same API for Firebase** — Use `createRequest` / `.send()` for Firestore and Realtime Database, just like REST
- 🔮 **Typed CRUD** — `getDoc`, `addDoc`, `updateDoc`, `deleteDoc` with full TypeScript types on every field
- 📡 **Realtime subscriptions** — Listen to document and collection changes with typed data flowing in
- ⚛️ **React hooks for Firebase** — `useFetch` and `useSubmit` work with Firebase operations — same patterns, different backend
- 💾 **Cache and offline support** — HyperFetch's caching and offline queue work with Firebase out of the box

## 🚀 Quick Start

```bash
npm install @hyper-fetch/core @hyper-fetch/firebase firebase
```

```ts
import { createClient } from "@hyper-fetch/core";
import { FirebaseAdapter } from "@hyper-fetch/firebase";
import { getFirestore } from "firebase/firestore";

const db = getFirestore();
const client = createClient({ url: "" }).setAdapter(FirebaseAdapter(db));
```

## 📚 Documentation

- [Firebase Adapter Docs](https://hyperfetch.bettertyped.com/docs/integrations/adapter-firebase)
- [Getting Started](https://hyperfetch.bettertyped.com/docs/getting-started/quick-start)
- [API Reference](https://hyperfetch.bettertyped.com/api/)

## 💡 Examples

### Read a document

```ts
interface User {
  id: string;
  name: string;
  email: string;
}

const getUser = client.createRequest<{ response: User }>()({
  endpoint: "/users/:userId",
  method: "getDoc",
});

const { data } = await getUser.setParams({ userId: "abc123" }).send();
console.log(data.name, data.email);
```

### Write a document

```ts
const createUser = client.createRequest<{
  payload: { name: string; email: string };
  response: null;
}>()({
  endpoint: "/users",
  method: "addDoc",
});

await createUser.send({ data: { name: "Jane", email: "jane@example.com" } });
```

### List documents

```ts
const listUsers = client.createRequest<{ response: User[] }>()({
  endpoint: "/users",
  method: "getDocs",
});

const { data: users } = await listUsers.send();
users.forEach((user) => console.log(user.name));
```

### Use with React hooks

```tsx
import { useFetch } from "@hyper-fetch/react";

const UserProfile = ({ userId }: { userId: string }) => {
  const { data, loading } = useFetch(getUser.setParams({ userId }));

  if (loading) return <p>Loading...</p>;
  return <h1>{data?.name}</h1>;
};
```

## License

[MIT](https://github.com/BetterTyped/hyper-fetch/blob/main/License.md)
