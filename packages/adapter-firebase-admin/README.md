# 🔥 Hyper Fetch Firebase Admin

<p align="center">
  <b>Firestore and Realtime Database from server code as typed HyperFetch requests, on top of the Admin SDK.</b>
</p>

<p align="center">
  <a href="https://github.com/BetterTyped/hyper-fetch">
    <img src="https://img.shields.io/github/stars/BetterTyped/hyper-fetch?logo=github&color=118ab2" alt="GitHub stars" />
  </a>
  <a href="https://www.npmjs.com/package/@hyper-fetch/firebase-admin">
    <img src="https://img.shields.io/npm/v/@hyper-fetch/firebase-admin?logo=npm&color=e76f51" alt="npm version" />
  </a>
  <a href="https://www.npmjs.com/package/@hyper-fetch/firebase-admin">
    <img src="https://img.shields.io/npm/dm/@hyper-fetch/firebase-admin?logo=npm" alt="npm downloads" />
  </a>
  <a href="https://bundlephobia.com/package/@hyper-fetch/firebase-admin">
    <img src="https://img.shields.io/bundlephobia/minzip/@hyper-fetch/firebase-admin?color=64BC4B" alt="bundle size" />
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

`@hyper-fetch/firebase-admin` runs Firestore and Realtime Database operations from Node.js through HyperFetch requests,
using the Firebase Admin SDK. Route handlers, workers and scripts get typed responses, retries and queues with the same
request API as `@hyper-fetch/firebase` in the browser.

## 🎯 Key Capabilities

- 🔮 **The same requests on server and client** — Methods, constraints and responses match `@hyper-fetch/firebase`, so
  request code reads the same on both sides
- 🔁 **Retries and queues for backend work** — HyperFetch retry, deduplication and queueing on top of Admin SDK calls
- 🧭 **Typed queries** — `queryParams: (c) => c.where("status", "==", "open").limit(50)`, checked against your
  document type, for Firestore and Realtime Database
- 📡 **Server-side listeners** — React to Firestore and Realtime Database changes in workers through
  `@hyper-fetch/sockets`
- 🛡️ **Errors in the response** — Firebase errors arrive in `response.error`; `send()` never rejects

## 🚀 Quick Start

```bash
npm install @hyper-fetch/core @hyper-fetch/firebase-admin firebase-admin
```

```ts
import { Client } from "@hyper-fetch/core";
import { FirebaseAdminAdapter } from "@hyper-fetch/firebase-admin";
import { initializeApp } from "firebase-admin/app";
import { getFirestore } from "firebase-admin/firestore";

initializeApp();
const client = new Client({ url: "" }).setAdapter(FirebaseAdminAdapter(getFirestore()));
```

## 📚 Documentation

- [Firebase Admin Adapter](https://hyperfetch.bettertyped.com/docs/integrations/adapter-firebase-admin/overview)
- [Firestore](https://hyperfetch.bettertyped.com/docs/integrations/adapter-firebase-admin/firestore)
- [Realtime Database](https://hyperfetch.bettertyped.com/docs/integrations/adapter-firebase-admin/realtime)
- [Realtime listening](https://hyperfetch.bettertyped.com/docs/integrations/adapter-firebase-admin/realtime-queries)
- [API Reference](https://hyperfetch.bettertyped.com/api/adapter-firebase-admin/Functions/FirebaseAdminAdapter)

## 💡 Examples

### Server-side CRUD

```ts
type Message = { text: string; author: string; createdAt: number };

const addMessage = client.createRequest<{ response: Message & { __key: string }; payload: Message }>()({
  endpoint: "messages",
  method: "addDoc",
});

const updateMessage = client.createRequest<{ response: Partial<Message>; payload: Partial<Message> }>()({
  endpoint: "messages/:messageId",
  method: "updateDoc",
});

const deleteMessage = client.createRequest<{ response: null }>()({
  endpoint: "messages/:messageId",
  method: "deleteDoc",
});

const { data: created } = await addMessage.send({
  payload: { text: "Hello from the server", author: "system", createdAt: Date.now() },
});
await updateMessage.setParams({ messageId: created!.__key }).send({ payload: { text: "Updated" } });
await deleteMessage.setParams({ messageId: created!.__key }).send();
```

### Query with constraints

```ts
import type { FirestoreQueryParams } from "@hyper-fetch/firebase-admin";

const getMessages = client.createRequest<{ response: Message[]; queryParams?: FirestoreQueryParams<Message> }>()({
  endpoint: "messages",
  method: "getDocs",
});

const { data: recent } = await getMessages.send({
  queryParams: (c) => c.where("author", "==", "system").orderBy("createdAt", "desc").limit(50),
});
```

### Process changes in a worker

```ts
import { Socket } from "@hyper-fetch/sockets";
import { FirebaseSocketsAdminAdapter } from "@hyper-fetch/firebase-admin";

const socket = new Socket({ url: "", adapter: FirebaseSocketsAdminAdapter(getFirestore()) });

const onQueued = socket
  .createListener<Job[]>()({ topic: "jobs", options: { groupByChangeType: true } })
  .setQueryParams((c) => c.where("state", "==", "queued"));

const stop = onQueued.listen(({ extra }) => {
  extra.groupedResult?.added.forEach((job) => enqueue(job));
});
```

## License

[Apache-2.0](https://github.com/BetterTyped/hyper-fetch/blob/main/License.md)
