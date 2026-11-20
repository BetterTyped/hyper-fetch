# 🔥 Hyper Fetch Firebase

<p align="center">
  <b>Firestore and Realtime Database as typed HyperFetch requests, with caching, React hooks and live listeners.</b>
</p>

<p align="center">
  <a href="https://github.com/BetterTyped/hyper-fetch">
    <img src="https://img.shields.io/github/stars/BetterTyped/hyper-fetch?logo=github&color=118ab2" alt="GitHub stars" />
  </a>
  <a href="https://www.npmjs.com/package/@hyper-fetch/firebase">
    <img src="https://img.shields.io/npm/v/@hyper-fetch/firebase?logo=npm&color=e76f51" alt="npm version" />
  </a>
  <a href="https://www.npmjs.com/package/@hyper-fetch/firebase">
    <img src="https://img.shields.io/npm/dm/@hyper-fetch/firebase?logo=npm" alt="npm downloads" />
  </a>
  <a href="https://bundlephobia.com/package/@hyper-fetch/firebase">
    <img src="https://img.shields.io/bundlephobia/minzip/@hyper-fetch/firebase?color=64BC4B" alt="bundle size" />
  </a>
  <a href="https://github.com/BetterTyped/hyper-fetch/blob/main/License.md">
    <img src="https://img.shields.io/github/license/BetterTyped/hyper-fetch?color=yellow" alt="license" />
  </a>
  <a href="https://github.com/BetterTyped/hyper-fetch">
    <img src="https://img.shields.io/badge/typescript-%23007ACC.svg?logo=typescript&logoColor=white" alt="TypeScript" />
  </a>
  <a href="https://firebase.google.com/">
    <img src="https://img.shields.io/badge/firebase-ffca28?logo=firebase&logoColor=black" alt="Firebase" />
  </a>
</p>

## 📖 About

`@hyper-fetch/firebase` runs Firestore and Realtime Database operations through HyperFetch requests in the browser. You
create them with `createRequest`, send them with `send()`, and get typed responses, caching, deduplication and React
hooks, the same API you use for HTTP. Live data comes through `@hyper-fetch/sockets` listeners.

## 🎯 Key Capabilities

- 🔥 **Firebase calls that look like the rest of your app** — `getDocs`, `addDoc`, `push`, `update` and friends are
  regular requests with `send()`, hooks and devtools
- 🔮 **Typed from path to payload** — Params, payloads, responses and the raw Firebase `extra` are typed per request
- 🧭 **Queries as plain arrays** — `queryParams: [$where("type", "==", "Green"), $limit(20)]`, part of the cache key so
  every filter is cached on its own
- 📡 **Live data without wiring** — `onSnapshot` and `onValue` become socket listeners and `useListener` state
- 🛡️ **Errors you can render** — Permission and index errors arrive in `response.error`; `send()` never rejects
- 🗂️ **Clean results** — Documents and list items carry their id as `__key`, and Realtime Database lists come back as
  ordered arrays

## 🚀 Quick Start

```bash
npm install @hyper-fetch/core @hyper-fetch/firebase firebase
```

```ts
import { Client } from "@hyper-fetch/core";
import { FirebaseAdapter } from "@hyper-fetch/firebase";
import { getFirestore } from "firebase/firestore";

const client = new Client({ url: "" }).setAdapter(FirebaseAdapter(getFirestore(app)));

const getTeas = client.createRequest<{ response: Tea[] }>()({ endpoint: "teas", method: "getDocs" });
const { data, error } = await getTeas.send();
```

## 📚 Documentation

- [Firebase Adapter](https://hyperfetch.bettertyped.com/docs/integrations/adapter-firebase/overview)
- [Firestore](https://hyperfetch.bettertyped.com/docs/integrations/adapter-firebase/firestore)
- [Realtime Database](https://hyperfetch.bettertyped.com/docs/integrations/adapter-firebase/realtime)
- [Realtime listening](https://hyperfetch.bettertyped.com/docs/integrations/adapter-firebase/realtime-queries)
- [API Reference](https://hyperfetch.bettertyped.com/api/adapter-firebase/Functions/FirebaseAdapter)

## 💡 Examples

### Read a document

```ts
type User = { __key: string; name: string; email: string };

const getUser = client.createRequest<{ response: User | null }>()({
  endpoint: "users/:userId",
  method: "getDoc",
});

const { data, status } = await getUser.setParams({ userId: "abc123" }).send();
// status is "emptyResource" and data is null when the document does not exist
```

### Query a collection

```ts
import { $limit, $orderBy, $where } from "@hyper-fetch/firebase";
import type { FirestoreQueryParams } from "@hyper-fetch/firebase";

const getUsers = client.createRequest<{ response: User[]; queryParams?: FirestoreQueryParams }>()({
  endpoint: "users",
  method: "getDocs",
});

const { data: admins } = await getUsers.send({
  queryParams: [$where("role", "==", "admin"), $orderBy("name"), $limit(20)],
});
```

### Write a document

```ts
const createUser = client.createRequest<{ response: User; payload: Omit<User, "__key"> }>()({
  endpoint: "users",
  method: "addDoc",
});

// data is the payload plus __key, the id of the new document
const { data: created, error } = await createUser.send({ payload: { name: "Jane", email: "jane@example.com" } });
```

### Listen to changes

```ts
import { Socket } from "@hyper-fetch/sockets";
import { FirebaseSocketsAdapter } from "@hyper-fetch/firebase";

const socket = new Socket({ url: "", adapter: FirebaseSocketsAdapter(getFirestore(app)) });

const onAdmins = socket.createListener<User[]>()({
  topic: "users",
  options: { constraints: [$where("role", "==", "admin")] },
});

const stop = onAdmins.listen(({ data }) => console.log(data.length, "admins"));
```

### Use with React

```tsx
import { useFetch, useListener } from "@hyper-fetch/react";

const UserProfile = ({ userId }: { userId: string }) => {
  const { data, loading } = useFetch(getUser.setParams({ userId }));

  if (loading) return <p>Loading...</p>;
  return <h1>{data?.name}</h1>;
};

const AdminCount = () => {
  const { data } = useListener(onAdmins);
  return <p>{data?.length ?? 0} admins</p>;
};
```

## License

[Apache-2.0](https://github.com/BetterTyped/hyper-fetch/blob/main/License.md)
