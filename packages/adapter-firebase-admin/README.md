<p align="center">
  <a href="https://hyperfetch.bettertyped.com/docs/integrations/adapter-firebase-admin/overview"><img src="https://raw.githubusercontent.com/BetterTyped/hyper-fetch/main/.github/assets/packages/firebase-admin.png" alt="Hyper Fetch Firebase Admin. Firebase on the server. Same typed requests. The Admin SDK behind HyperFetch requests for route handlers, workers and scripts." /></a>
</p>

<p align="center">
  <a href="https://hyperfetch.bettertyped.com/docs/integrations/adapter-firebase-admin/overview"><b>Quick Start</b></a> ·
  <a href="https://hyperfetch.bettertyped.com/docs/integrations/adapter-firebase-admin/overview">Documentation</a> ·
  <a href="https://hyperfetch.bettertyped.com/docs/api/adapter-firebase-admin/Functions/FirebaseAdminAdapter">API Reference</a> ·
  <a href="https://github.com/BetterTyped/hyper-fetch">GitHub</a> ·
  <a href="https://discord.gg/7upC2kVmyM">Discord</a>
</p>

<p align="center">
  <a href="https://github.com/BetterTyped/hyper-fetch"><img src="https://img.shields.io/github/stars/BetterTyped/hyper-fetch?style=flat&logo=github&color=333" alt="GitHub stars" /></a>
  <a href="https://www.npmjs.com/package/@hyper-fetch/firebase-admin"><img src="https://img.shields.io/npm/v/@hyper-fetch/firebase-admin?logo=npm&color=e76f51" alt="npm version" /></a>
  <a href="https://www.npmjs.com/package/@hyper-fetch/firebase-admin"><img src="https://api.maciejpyrc.com/portfolio/npm/downloads.svg?packages=@hyper-fetch/firebase-admin&color=fbc646" alt="Monthly downloads" /></a>
  <a href="https://bundlejs.com/?q=@hyper-fetch/firebase-admin"><img src="https://api.maciejpyrc.com/portfolio/npm/size.svg?package=@hyper-fetch/firebase-admin&external=@hyper-fetch/core,@hyper-fetch/sockets,firebase,firebase-admin" alt="Bundle size" /></a>
  <a href="https://github.com/BetterTyped/hyper-fetch"><img src="https://img.shields.io/badge/TypeScript-strict-3178C6?logo=typescript&logoColor=white" alt="TypeScript" /></a>
  <a href="https://hyperfetch.bettertyped.com/docs/integrations/adapter-firebase-admin/overview"><img src="https://img.shields.io/badge/Firebase-admin-FFCA28?logo=firebase&logoColor=black" alt="Firebase" /></a>
  <a href="https://github.com/BetterTyped/hyper-fetch/blob/main/License.md"><img src="https://img.shields.io/github/license/BetterTyped/hyper-fetch?color=blue" alt="License" /></a>
</p>

## 📖 About

`@hyper-fetch/firebase-admin` runs Firestore and Realtime Database operations from server code as Hyper Fetch requests,
on top of the Firebase Admin SDK. Route handlers, workers and scripts get typed responses, retries and queues with the
same request API as `@hyper-fetch/firebase` in the browser.

## 🎯 Key Capabilities

- 🔮 **The same requests on server and client** - Methods, constraints and responses match `@hyper-fetch/firebase`
- 🔁 **Retries and queues for backend work** - Retry, deduplication and queueing on top of Admin SDK calls
- 🧭 **Typed queries** - `c.where("status", "==", "open").limit(50)` is checked against your document type
- 📡 **Server-side listeners** - React to Firestore and Realtime Database changes in workers through sockets
- 🗂️ **Change groups** - `groupByChangeType` splits a snapshot into `added`, `modified` and `removed`
- 🛡️ **Errors in the response** - Firebase errors arrive in `response.error`, and `send()` never throws

## 🚀 Quick Start

```bash
npm install @hyper-fetch/core @hyper-fetch/sockets @hyper-fetch/firebase-admin firebase-admin
```

```ts
import { Client } from "@hyper-fetch/core";
import { FirebaseAdminAdapter } from "@hyper-fetch/firebase-admin";
import { initializeApp } from "firebase-admin/app";
import { getFirestore } from "firebase-admin/firestore";

initializeApp();

const client = new Client({ url: "" }).setAdapter(FirebaseAdminAdapter(getFirestore()));

const getJobs = client.createRequest<{ response: Job[] }>()({ endpoint: "jobs", method: "getDocs" });

const { data, error } = await getJobs.send();
```

## 📚 Documentation

- **[Firebase Admin Adapter](https://hyperfetch.bettertyped.com/docs/integrations/adapter-firebase-admin/overview)** - Setup on the server
- **[Firestore](https://hyperfetch.bettertyped.com/docs/integrations/adapter-firebase-admin/firestore)** - Methods, constraints and typed queries
- **[Realtime Database](https://hyperfetch.bettertyped.com/docs/integrations/adapter-firebase-admin/realtime)** - Methods, ordering and filters
- **[Realtime listening](https://hyperfetch.bettertyped.com/docs/integrations/adapter-firebase-admin/realtime-queries)** - Listeners in workers
- **[API Reference](https://hyperfetch.bettertyped.com/docs/api/adapter-firebase-admin/Functions/FirebaseAdminAdapter)** - Every adapter, method and type

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

if (created) {
  await updateMessage.setParams({ messageId: created.__key }).send({ payload: { text: "Updated" } });
  await deleteMessage.setParams({ messageId: created.__key }).send();
}
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

### Process new jobs in a worker

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

## 🧩 Hyper Fetch Ecosystem

One typed client for every backend. Swap the adapter and keep the same `createRequest()` everywhere.

<table align="center">
  <tr>
    <td align="center" width="110"><a href="https://github.com/BetterTyped/hyper-fetch/tree/main/packages/core"><img src="https://raw.githubusercontent.com/BetterTyped/hyper-fetch/main/documentation/static/img/integration-hyper-fetch.svg" width="36" height="36" alt="" /><br /><sub><b>Core</b></sub></a></td>
    <td align="center" width="110"><a href="https://github.com/BetterTyped/hyper-fetch/tree/main/packages/react"><img src="https://raw.githubusercontent.com/BetterTyped/hyper-fetch/main/documentation/static/img/integration-react.svg" width="36" height="36" alt="" /><br /><sub><b>React</b></sub></a></td>
    <td align="center" width="110"><a href="https://github.com/BetterTyped/hyper-fetch/tree/main/packages/sockets"><img src="https://raw.githubusercontent.com/BetterTyped/hyper-fetch/main/documentation/static/img/integration-sockets.svg" width="36" height="36" alt="" /><br /><sub><b>Sockets</b></sub></a></td>
    <td align="center" width="110"><a href="https://github.com/BetterTyped/hyper-fetch/tree/main/packages/db"><img src="https://raw.githubusercontent.com/BetterTyped/hyper-fetch/main/documentation/static/img/integration-hyper-fetch.svg" width="36" height="36" alt="" /><br /><sub><b>DB</b></sub></a></td>
    <td align="center" width="110"><a href="https://github.com/BetterTyped/hyper-fetch/tree/main/packages/cli"><img src="https://raw.githubusercontent.com/BetterTyped/hyper-fetch/main/documentation/static/img/integration-openapi.svg" width="36" height="36" alt="" /><br /><sub><b>OpenAPI CLI</b></sub></a></td>
    <td align="center" width="110"><a href="https://github.com/BetterTyped/hyper-fetch/tree/main/packages/adapter-graphql"><img src="https://raw.githubusercontent.com/BetterTyped/hyper-fetch/main/documentation/static/img/integration-graphql.svg" width="36" height="36" alt="" /><br /><sub><b>GraphQL</b></sub></a></td>
    <td align="center" width="110"><a href="https://github.com/BetterTyped/hyper-fetch/tree/main/packages/adapter-trpc"><img src="https://raw.githubusercontent.com/BetterTyped/hyper-fetch/main/documentation/static/img/integration-trpc.svg" width="36" height="36" alt="" /><br /><sub><b>tRPC</b></sub></a></td>
  </tr>
  <tr>
    <td align="center" width="110"><a href="https://github.com/BetterTyped/hyper-fetch/tree/main/packages/adapter-orpc"><picture><source media="(prefers-color-scheme: dark)" srcset="https://raw.githubusercontent.com/BetterTyped/hyper-fetch/main/documentation/static/img/integration-orpc-dark.svg" /><img src="https://raw.githubusercontent.com/BetterTyped/hyper-fetch/main/documentation/static/img/integration-orpc.svg" width="36" height="36" alt="" /></picture><br /><sub><b>oRPC</b></sub></a></td>
    <td align="center" width="110"><a href="https://github.com/BetterTyped/hyper-fetch/tree/main/packages/hono"><img src="https://raw.githubusercontent.com/BetterTyped/hyper-fetch/main/documentation/static/img/integration-hono.svg" width="36" height="36" alt="" /><br /><sub><b>Hono</b></sub></a></td>
    <td align="center" width="110"><a href="https://github.com/BetterTyped/hyper-fetch/tree/main/packages/elysia"><img src="https://raw.githubusercontent.com/BetterTyped/hyper-fetch/main/documentation/static/img/integration-elysia.svg" width="36" height="36" alt="" /><br /><sub><b>Elysia</b></sub></a></td>
    <td align="center" width="110"><a href="https://github.com/BetterTyped/hyper-fetch/tree/main/packages/adapter-firebase"><img src="https://raw.githubusercontent.com/BetterTyped/hyper-fetch/main/documentation/static/img/integration-firebase.svg" width="36" height="36" alt="" /><br /><sub><b>Firebase</b></sub></a></td>
    <td align="center" width="110"><a href="https://github.com/BetterTyped/hyper-fetch/tree/main/packages/adapter-axios"><img src="https://raw.githubusercontent.com/BetterTyped/hyper-fetch/main/documentation/static/img/integration-axios.svg" width="36" height="36" alt="" /><br /><sub><b>Axios</b></sub></a></td>
    <td align="center" width="110"><a href="https://github.com/BetterTyped/hyper-fetch/tree/main/packages/hyper-flow"><img src="https://raw.githubusercontent.com/BetterTyped/hyper-fetch/main/documentation/static/img/hyper-flow.svg" width="36" height="36" alt="" /><br /><sub><b>HyperFlow</b></sub></a></td>
  </tr>
</table>

## 💖 Sponsors

<p align="center">
  <a href="https://github.com/sponsors/prc5">
    <img src="https://raw.githubusercontent.com/prc5/sponsors/main/packages/other/sponsorkit/sponsors.svg?raw=true" alt="Sponsors" />
  </a>
</p>

## License

[Apache-2.0](https://github.com/BetterTyped/hyper-fetch/blob/main/License.md)
