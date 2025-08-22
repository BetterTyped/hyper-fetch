# 🔥 Hyper Fetch Firebase Admin

<p>
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
  <a href="https://github.com/BetterTyped/hyper-fetch">
    <img src="https://custom-icon-badges.demolab.com/badge/typescript-%23007ACC.svg?logo=typescript&logoColor=white" />
  </a>
  <a href="https://github.com/BetterTyped/hyper-fetch">
    <img src="https://custom-icon-badges.demolab.com/badge/-Firebase-E10098?logo=firebase&logoColor=white" />
  </a>
  <a href="https://www.npmjs.com/package/@hyper-fetch/firebase-admin">
    <img src="https://custom-icon-badges.demolab.com/bundlephobia/minzip/@hyper-fetch/firebase-admin?color=64BC4B&logo=package" />
  </a>
</p>

---

## Description

`@hyper-fetch/firebase-admin` is the **official Firebase Admin SDK adapter** for
[Hyper Fetch](https://hyperfetch.bettertyped.com). It brings the same declarative, type-safe API you use on the client
to your server or cloud functions.

---

:::tip Purpose

1. **One API – everywhere** – share request definitions between the browser and Node.js environments.
2. **First-class TypeScript** – strong typing for parameters, payloads and responses out of the box.
3. **Queue & Retry** – leverage Hyper Fetch queueing on top of Firebase Admin SDK.
4. **Unified tooling** – logging, events and interceptors identical on both sides.
5. **Works with Firestore _and_ Realtime Database** – pick the storage that fits your use-case.

:::

## Installation

```bash
npm install @hyper-fetch/core @hyper-fetch/firebase-admin firebase-admin
# or
yarn add @hyper-fetch/core @hyper-fetch/firebase-admin firebase-admin
```

> `firebase-admin` is a peer dependency and must be installed separately.

## Quick start

### 1. Initialize Firebase Admin SDK

```ts
import { initializeApp, applicationDefault } from "firebase-admin/app";
import { getFirestore } from "firebase-admin/firestore";

initializeApp({
  credential: applicationDefault(),
});

export const db = getFirestore();
```

### 2. Create Hyper Fetch client with the Firebase Admin adapter

```ts
import { createClient } from "@hyper-fetch/core";
import { FirebaseAdminAdapter } from "@hyper-fetch/firebase-admin";
import { db } from "./firebase";

export const client = createClient({ url: "" }).setAdapter(FirebaseAdminAdapter(db));
```

### 3. Server-side request example

```ts
interface MessagePayload {
  text: string;
}

export const addMessage = client.createRequest<{ payload: MessagePayload; response: null }>()({
  endpoint: "/messages",
  method: "addDoc",
});

await addMessage.send({ payload: { text: "Hello from the server!" } });
```

## Supported methods

| Firestore                | Realtime Database  |
| ------------------------ | ------------------ |
| `getDoc`, `getDocs`      | `get`              |
| `setDoc`, `addDoc`       | `set`, `push`      |
| `updateDoc`, `deleteDoc` | `update`, `remove` |

## Resources

- [Documentation](https://hyperfetch.bettertyped.com)
- [API Reference](https://hyperfetch.bettertyped.com/api/modules/firebase-admin)
- [Guides](https://hyperfetch.bettertyped.com/docs/guides)
- [NPM](https://www.npmjs.com/package/@hyper-fetch/firebase-admin)

## Contributing

We ❤️ contributions! Please read the [contributing guide](../../../CONTRIBUTING.md) and open an issue or pull request.

---

Made with ☕ by [BetterTyped](https://bettertyped.com)
