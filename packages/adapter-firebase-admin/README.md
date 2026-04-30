# 🔥 Hyper Fetch Firebase Admin

<p align="center">
  <b>Type-safe Firebase Admin SDK adapter for HyperFetch. Server-side Firestore and Realtime Database — fully typed.</b>
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
  <a href="https://www.npmjs.com/package/@hyper-fetch/firebase-admin">
    <img src="https://custom-icon-badges.demolab.com/npm/v/@hyper-fetch/firebase-admin.svg?logo=npm&color=e76f51" />
  </a>
  <a href="https://www.npmjs.com/package/@hyper-fetch/firebase-admin">
    <img src="https://custom-icon-badges.demolab.com/npm/dm/@hyper-fetch/firebase-admin?logoColor=fff&logo=trending-up" />
  </a>
  <a href="https://github.com/BetterTyped/hyper-fetch">
    <img src="https://custom-icon-badges.demolab.com/badge/typescript-%23007ACC.svg?logo=typescript&logoColor=white" />
  </a>
  <a href="https://bundlephobia.com/package/@hyper-fetch/firebase-admin">
    <img src="https://custom-icon-badges.demolab.com/bundlephobia/minzip/@hyper-fetch/firebase-admin?color=64BC4B&logo=package" />
  </a>
  <a href="https://github.com/BetterTyped/hyper-fetch">
    <img src="https://img.shields.io/badge/firebase-ffca28?logo=firebase&logoColor=black" alt="Firebase" />
  </a>
</p>

## 📖 About

This adapter brings HyperFetch to server-side Firebase. Share request patterns between browser and Node.js, use the same
typed API for Firestore and Realtime Database, and leverage HyperFetch's queuing and retry capabilities on top of the
Firebase Admin SDK.

## 🎯 Key Capabilities

- 🔮 **Same code, server-side** — Identical HyperFetch patterns for server and client Firebase operations
- 🔥 **Firestore & Realtime Database** — Both engines through one typed adapter
- 🔁 **Server-side retry and queuing** — Automatic retries with backoff for flaky Firebase calls in backend services
- ✨ **Full TypeScript types** — Parameters, payloads, and responses typed for every database operation

## 🚀 Quick Start

```bash
npm install @hyper-fetch/core @hyper-fetch/firebase-admin firebase-admin
```

```ts
import { createClient } from "@hyper-fetch/core";
import { FirebaseAdminAdapter } from "@hyper-fetch/firebase-admin";
import { getFirestore } from "firebase-admin/firestore";

const db = getFirestore();
const client = createClient({ url: "" }).setAdapter(FirebaseAdminAdapter(db));
```

## 📚 Documentation

- [Firebase Admin Adapter Docs](https://hyperfetch.bettertyped.com/docs/integrations/adapter-firebase-admin)
- [Getting Started](https://hyperfetch.bettertyped.com/docs/getting-started/quick-start)
- [API Reference](https://hyperfetch.bettertyped.com/api/)

## 💡 Examples

### Server-side CRUD

```ts
interface Message {
  text: string;
  author: string;
  createdAt: number;
}

const addMessage = client.createRequest<{ payload: Message; response: null }>()({
  endpoint: "/messages",
  method: "addDoc",
});

const getMessages = client.createRequest<{ response: Message[] }>()({
  endpoint: "/messages",
  method: "getDocs",
});

await addMessage.send({
  data: { text: "Hello from server!", author: "system", createdAt: Date.now() },
});

const { data: messages } = await getMessages.send();
messages.forEach((msg) => console.log(`${msg.author}: ${msg.text}`));
```

### Update and delete

```ts
const updateMessage = client.createRequest<{ payload: Partial<Message>; response: null }>()({
  endpoint: "/messages/:messageId",
  method: "updateDoc",
});

const deleteMessage = client.createRequest<{ response: null }>()({
  endpoint: "/messages/:messageId",
  method: "deleteDoc",
});

await updateMessage.setParams({ messageId: "abc" }).send({ data: { text: "Updated!" } });
await deleteMessage.setParams({ messageId: "abc" }).send();
```

## License

[MIT](https://github.com/BetterTyped/hyper-fetch/blob/main/License.md)
