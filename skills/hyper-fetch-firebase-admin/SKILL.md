---
name: hyper-fetch-firebase-admin
description:
  Firebase Admin SDK adapters for HyperFetch (@hyper-fetch/firebase-admin) - FirebaseAdminAdapter for server-side
  Firestore (getDoc, getDocs, addDoc, setDoc, updateDoc, deleteDoc) and Realtime Database (get, set, push, update,
  remove) requests, FirebaseSocketsAdminAdapter for onSnapshot / on("value") listeners in Node, and the $where,
  $orderBy, $limit, $orderByChild, $limitToFirst query constraints. Use when server code (Node, Next.js route handlers
  or server actions, Cloud Functions, workers, scripts) uses HyperFetch with firebase-admin, imports
  @hyper-fetch/firebase-admin, calls FirebaseAdminAdapter or FirebaseSocketsAdminAdapter, or the task involves service
  account credentials, firebase-admin initialization, keeping admin credentials out of the client bundle, or differences
  between @hyper-fetch/firebase and @hyper-fetch/firebase-admin. For browser apps use hyper-fetch-firebase.
---

# HyperFetch Firebase Admin (server)

`@hyper-fetch/firebase-admin` is the server twin of `@hyper-fetch/firebase`. It runs the same HyperFetch request API
(`Client`, `createRequest`, `send()`) and the same `$`-constraints against the **Firebase Admin SDK**, and offers a
socket adapter for server-side realtime listeners. The Admin SDK authenticates with privileged credentials and
**bypasses Firebase security rules**, so everything here is server-only.

## Install and initialize

```bash
npm install @hyper-fetch/core @hyper-fetch/sockets @hyper-fetch/firebase-admin firebase-admin
```

```ts
// server/firebase.ts - imported only by server code
import { Client } from "@hyper-fetch/core";
import { FirebaseAdminAdapter, FirebaseSocketsAdminAdapter } from "@hyper-fetch/firebase-admin";
import { createSocketClient } from "@hyper-fetch/sockets";
import { applicationDefault, cert, getApps, initializeApp } from "firebase-admin/app";
import { getDatabase } from "firebase-admin/database";
import { getFirestore } from "firebase-admin/firestore";

const serviceAccount = process.env.FIREBASE_SERVICE_ACCOUNT; // JSON string from a secret manager, never committed

// Reuse the app on hot reload and in serverless warm starts
const app =
  getApps()[0] ??
  initializeApp({
    credential: serviceAccount ? cert(JSON.parse(serviceAccount)) : applicationDefault(),
    databaseURL: process.env.FIREBASE_DATABASE_URL,
  });

export const firestore = getFirestore(app);
export const rtdb = getDatabase(app);

export const adminClient = new Client({ url: "" }).setAdapter(FirebaseAdminAdapter(firestore));
export const rtdbClient = new Client({ url: "" }).setAdapter(FirebaseAdminAdapter(rtdb));
export const adminSocket = createSocketClient({ url: "", adapter: FirebaseSocketsAdminAdapter(firestore) });
```

## Golden rules

1. **Never ship admin credentials or this package to the client.** Keep the service account in a secret manager or
   environment variable read at runtime (`cert(...)`), or use `applicationDefault()` on Google Cloud. Never commit the
   JSON key, never put it in a `NEXT_PUBLIC_*` / `VITE_*` variable, never import `server/firebase.ts` from a client
   component. In Next.js add `import "server-only"` to that module.
2. **Initialize once.** Guard with `getApps()` and create the HyperFetch clients and sockets at module level.
3. **You are the security rules.** Admin reads and writes ignore Firebase rules. Verify the caller (for example
   `getAuth().verifyIdToken(token)` from `firebase-admin/auth`) and authorize every operation before sending.
4. **Validate path params.** Params are inserted into the Firestore / Realtime Database path. A user-supplied value with
   `/` changes the target (and the document vs collection parity). Reject anything that is not a plain id.
5. **Pass Admin SDK instances only.** The adapters detect Firestore with `instanceof` the `firebase-admin/firestore`
   class and treat anything else as Realtime Database. A Web SDK instance silently takes the wrong branch.
6. **Pass adapter instances, always set `method`.** `setAdapter(FirebaseAdminAdapter(db))` (not a factory). The default
   method is `"getDoc"`, which does not exist on Realtime Database: use `"get"`, `"set"`, `"push"`, `"update"`,
   `"remove"` there.
7. **Path parity decides document vs collection** exactly like the web package: even segments is a document, odd is a
   collection (`client.url + endpoint`, `socket.url + topic`).
8. **Errors are in the response.** `send()` resolves; check `error` / `status` (`"success"`, `"error"`,
   `"emptyResource"`).
9. **Clean up listeners in long-lived processes.** Every `listen()` holds an open Firebase subscription until its
   remover runs.

## Requests

```ts
import { $limit, $orderBy, $where } from "@hyper-fetch/firebase-admin";
import type { FirestoreQueryParams } from "@hyper-fetch/firebase-admin";

type Order = { __key?: string; userId: string; total: number; status: "open" | "paid" };

export const getOrders = adminClient.createRequest<{ response: Order[]; queryParams?: FirestoreQueryParams }>()({
  endpoint: "orders",
  method: "getDocs",
});

export const markPaid = adminClient.createRequest<{ response: Partial<Order>; payload: Partial<Order> }>()({
  endpoint: "orders/:orderId",
  method: "updateDoc",
});

const isPlainId = (value: string) => /^[A-Za-z0-9_-]{1,128}$/.test(value);

export const payOrder = async (orderId: string) => {
  if (!isPlainId(orderId)) return { ok: false as const, reason: "invalid id" };
  const { error } = await markPaid.setParams({ orderId }).send({ payload: { status: "paid" } });
  return error ? { ok: false as const, reason: "write failed" } : { ok: true as const };
};

const { data: open } = await getOrders.send({
  queryParams: [$where("status", "==", "open"), $orderBy("total", "desc"), $limit(50)],
});
```

Methods, `queryParams` constraints and the `__key` id field are the same as in `@hyper-fetch/firebase` (see that skill).
Realtime Database requests work the same way with `RealtimeDBQueryParams` and `$orderByChild`, `$orderByKey`,
`$orderByValue`, `$limitToFirst`, `$limitToLast`, `$equalTo`, `$startAt`, `$endAt`, ...

## Type safety

Typing works like the web package: the Admin SDK instance picks the method union and option types, and you declare
document shapes in the request generic.

| Passed instance                                  | Request `method`                                                              | Socket listener `options`              | Socket `extra`                                     |
| ------------------------------------------------ | ----------------------------------------------------------------------------- | -------------------------------------- | -------------------------------------------------- |
| `getFirestore()` from `firebase-admin/firestore` | `"getDoc" \| "getDocs" \| "setDoc" \| "updateDoc" \| "addDoc" \| "deleteDoc"` | `{ constraints?, groupByChangeType? }` | `{ ref?, snapshot?, unsubscribe?, groupedResult }` |
| `getDatabase()` from `firebase-admin/database`   | `"get" \| "push" \| "set" \| "update" \| "remove"`                            | `{ constraints?, onlyOnce? }`          | `any` - type it at the call site                   |

```ts
import type { RealtimeDBQueryParams } from "@hyper-fetch/firebase-admin";
import { $limitToFirst } from "@hyper-fetch/firebase-admin";

type Session = { __key: string; userId: string; expiresAt: number };

const listSessions = rtdbClient.createRequest<{ response: Session[] | null; queryParams?: RealtimeDBQueryParams }>()({
  endpoint: "sessions",
  method: "get",
});
await listSessions.send({ queryParams: [$limitToFirst(100)] });

// @ts-expect-error - "get" is not a Firestore method
adminClient.createRequest<{ response: Order[] }>()({ endpoint: "orders", method: "get" });
// @ts-expect-error - "getDocs" is not a Realtime Database method
rtdbClient.createRequest<{ response: Session[] }>()({ endpoint: "sessions", method: "getDocs" });
// @ts-expect-error - payload is checked against the declared Order fields
markPaid.send({ payload: { status: "refunded" } });
// @ts-expect-error - Firestore constraint in a Realtime Database query
listSessions.send({ queryParams: [$where("userId", "==", "u1")] });
// @ts-expect-error - onlyOnce is a Realtime Database listener option
adminSocket.createListener<Order[]>()({ topic: "orders", options: { onlyOnce: true } });
```

Not checked by types: that the declared `response` matches the method (`setDoc` returns a `WriteResult` here), that path
parity fits the method, that constraint field names exist, and that stored data has the declared shape. Validate
untrusted input with your schema library before writing; the Admin SDK will store whatever you send.

## Differences from `@hyper-fetch/firebase`

| Topic                                                   | `@hyper-fetch/firebase` (web)             | `@hyper-fetch/firebase-admin` (server)            |
| ------------------------------------------------------- | ----------------------------------------- | ------------------------------------------------- |
| Request adapter                                         | `FirebaseAdapter`                         | `FirebaseAdminAdapter`                            |
| Socket adapter                                          | `FirebaseSocketsAdapter`                  | `FirebaseSocketsAdminAdapter`                     |
| Security rules                                          | enforced for the signed-in user           | bypassed - authorize yourself                     |
| Credentials                                             | public web config                         | service account / application default credentials |
| `setDoc` response `data`                                | the payload you sent                      | the Admin SDK `WriteResult`                       |
| Firestore socket `connect` / `disconnect` / `reconnect` | toggle `enableNetwork` / `disableNetwork` | throw - never call them                           |
| Realtime socket `connect` / `disconnect`                | `goOnline` / `goOffline`                  | `database.goOnline()` / `database.goOffline()`    |
| Realtime document listener `data`                       | `snapshot.val()`                          | object value plus `__key` (expects object values) |

## Server-side realtime listeners

```ts
type Job = { __key?: string; state: "queued" | "running" | "done" };

const onQueuedJobs = adminSocket.createListener<Job[]>()({
  topic: "jobs",
  options: { constraints: [$where("state", "==", "queued")], groupByChangeType: true },
});

const stop = onQueuedJobs.listen(({ data, extra }) => {
  const added = extra.groupedResult?.added ?? [];
  console.log(`${data.length} queued, ${added.length} new`);
});

// On shutdown
process.on("SIGTERM", () => {
  stop();
});
```

- Listener options: Firestore `constraints`, `groupByChangeType`; Realtime Database `constraints`, `onlyOnce` (uses
  `once("value")`).
- Firebase sockets are receive-only: `emit()` throws.
- Listener `data` is the full current result: replace, do not append. Every snapshot includes items you already handled,
  so make side effects (job processing, sending mail) idempotent, for example with a transaction or a status check.
- Keep one listener per topic on a socket: listeners that share a topic also receive each other's snapshots.
- To shut down Firebase entirely, delete the app (`app.delete()` from `firebase-admin/app`), not the socket.

## Performance and process notes

- Reuse the module-level client; creating clients or apps per request leaks connections.
- The client cache keeps responses in memory for `cacheTime` (5 minutes by default) and is shared by every incoming
  request in the process. For large or user-specific reads set `cache: false` on the request.
- Batch independent reads with `Promise.all` over `send()` calls.

## Pitfalls

| Wrong                                                                    | Right                                                                 |
| ------------------------------------------------------------------------ | --------------------------------------------------------------------- |
| `require("./serviceAccountKey.json")` committed to the repo              | secret manager / env var parsed at runtime, or `applicationDefault()` |
| Importing the admin client from a React client component                 | server-only module, call it from route handlers / server actions      |
| `new Socket({ adapter: FirebaseSocketsAdminAdapter(db) })` without `url` | `url` is required (use `""` or a path prefix)                         |
| `listener.listen({ callback })`                                          | `listener.listen(({ data, extra }) => ...)`                           |
| `.setData(payload)`                                                      | `.setPayload(payload)` or `send({ payload })`                         |
| `adminSocket.disconnect()` on a Firestore socket                         | call each listener's remover; `app.delete()` to shut down             |
| Trusting `req.params.id` in an endpoint param                            | validate it as a plain id first                                       |
| Using `data` from `setDoc` as the saved document                         | it is a `WriteResult`; re-read with `getDoc` if you need the document |

## Testing

Run against the Firebase emulators (`FIRESTORE_EMULATOR_HOST`, `FIREBASE_DATABASE_EMULATOR_HOST`) with a demo project
id; no credentials are needed there. Unit-test callers by mocking requests with `request.setMock(...)` (see
`hyper-fetch-testing`).

## Docs

- https://hyperfetch.bettertyped.com/docs/integrations/adapter-firebase-admin/overview
- https://hyperfetch.bettertyped.com/docs/integrations/adapter-firebase-admin/firestore
- https://hyperfetch.bettertyped.com/docs/integrations/adapter-firebase-admin/realtime
- https://hyperfetch.bettertyped.com/docs/integrations/adapter-firebase-admin/realtime-queries

Related skills: `hyper-fetch-firebase`, `hyper-fetch-core`, `hyper-fetch-sockets`, `hyper-fetch-testing`.
