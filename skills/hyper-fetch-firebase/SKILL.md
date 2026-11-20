---
name: hyper-fetch-firebase
description:
  Firebase Web SDK adapters for HyperFetch (@hyper-fetch/firebase) - FirebaseAdapter for Firestore (getDoc, getDocs,
  addDoc, setDoc, updateDoc, deleteDoc) and Realtime Database (get, set, push, update, remove) requests,
  FirebaseSocketsAdapter for realtime onSnapshot / onValue listeners through @hyper-fetch/sockets, and typed query
  constraints ($where, $orderBy, $limit, $orderByChild, $limitToFirst, $limitToLast, $equalTo, $startAt, $endAt). Use
  when a browser or React app uses HyperFetch with firebase/firestore or firebase/database, when code imports
  @hyper-fetch/firebase, calls FirebaseAdapter, FirebaseSocketsAdapter, FirestoreQueryParams or RealtimeDBQueryParams,
  or the task is Firestore CRUD, Realtime Database reads and writes, filtering or ordering Firebase queries, live
  collection or document updates, groupByChangeType, onlyOnce, or using Firebase with useFetch, useSubmit or
  useListener. For server-side firebase-admin code use hyper-fetch-firebase-admin instead.
---

# HyperFetch Firebase (web)

`@hyper-fetch/firebase` plugs the Firebase **Web** SDK into HyperFetch. `FirebaseAdapter(db)` is a core **Adapter**: you
keep using `Client`, `createRequest`, `send()`, cache, queues and the React hooks, but requests run Firestore or
Realtime Database operations instead of HTTP. `FirebaseSocketsAdapter(db)` is a **SocketAdapter** for
`@hyper-fetch/sockets`: listeners map to `onSnapshot` (Firestore) or `onValue` (Realtime Database). The adapter picks
Firestore or Realtime Database from the instance you pass. The `method` of a request is the Firebase operation.

## Install and setup

```bash
npm install @hyper-fetch/core @hyper-fetch/sockets @hyper-fetch/firebase firebase
```

```ts
// firebase.ts
import { Client } from "@hyper-fetch/core";
import { FirebaseAdapter, FirebaseSocketsAdapter } from "@hyper-fetch/firebase";
import { createSocketClient } from "@hyper-fetch/sockets";
import { initializeApp } from "firebase/app";
import { getFirestore } from "firebase/firestore";

const app = initializeApp({ projectId: "my-project", apiKey: "public-web-api-key" });
export const db = getFirestore(app);

// url is a path prefix: `${client.url}${request.endpoint}` is the Firestore path
export const client = new Client({ url: "" }).setAdapter(FirebaseAdapter(db));
export const socket = createSocketClient({ url: "", adapter: FirebaseSocketsAdapter(db) });
```

For Realtime Database pass `getDatabase(app)` from `firebase/database` instead; the client and socket types switch to
the Realtime Database methods and options.

## Golden rules

1. **Pass an adapter instance, one per client or socket.** `setAdapter(FirebaseAdapter(db))`, not
   `setAdapter(() => FirebaseAdapter(db))` - `Client.setAdapter` takes an instance. Never share one
   `FirebaseSocketsAdapter(db)` between two sockets; the adapter binds to the socket it is initialized with.
2. **Set `method` for anything but a read.** Without it, Firestore requests use `"getDoc"` and Realtime Database
   requests use `"get"`. A method the database does not have (`"getDocs"` on Realtime Database) resolves with
   `status: "error"`.
3. **Path parity decides document vs collection.** The full path (`client.url + endpoint`, or `socket.url + topic`) with
   an even number of segments is a document (`teas/1`), odd is a collection (`teas`). `getDoc`/`setDoc`/`updateDoc`/
   `deleteDoc` need a document path, `getDocs`/`addDoc` a collection path. Mind the slash when concatenating:
   `url: "teas"` + `endpoint: ":id"` gives `teas1`; use `url: "teas/"` or `endpoint: "/:id"`.
4. **Filter with a `queryParams` callback, not in the endpoint.** `queryParams: (c) => c.where(...).limit(20)` receives
   a constraints chain; the adapter stores the constraints it collected, applied in order and part of the cache key.
   Type the request with `queryParams?: FirestoreQueryParams<Doc>` / `RealtimeDBQueryParams<Doc>` so field names and
   values are checked. The constraints array (`[$where(...), $limit(20)]`) is accepted too; the `{ constraints }` object
   is deprecated.
5. **Writes use `setPayload` (or `send({ payload })`).** There is no `setData`. `setDoc` merges only with
   `options: { merge: true }`.
6. **Errors come back in the response.** `send()` resolves with `{ data, error, status, success, extra }`; Firebase
   errors (permissions, invalid path) are in `error` with `status: "error"`. Missing data is `status: "emptyResource"`
   with `data: null` (single item) or `[]` (Firestore collection).
7. **Realtime goes through sockets, not requests.** There is no `onSnapshot` / `onValue` request method; create a
   listener on a `FirebaseSocketsAdapter` socket. Firebase sockets are receive-only: `emit()` throws.
8. **Treat each snapshot as the full current state.** Listener `data` is the whole document or result list; replace
   state with it, never append. Keep one listener per topic on a socket: listeners that share a topic also receive each
   other's snapshots.
9. **`socket.disconnect()` takes the whole Firebase instance offline** (`disableNetwork` for Firestore, `goOffline` for
   Realtime Database), including your `FirebaseAdapter` requests. To stop one subscription, call its remover.
10. **This package is for browsers and client apps.** It ships only the public Web SDK config. Server code with service
    accounts belongs to `@hyper-fetch/firebase-admin`, which must never be bundled into the client.

## Firestore requests

```ts
import type { FirestoreQueryParams } from "@hyper-fetch/firebase";

type Tea = { __key?: string; name: string; type: string; year: number };

export const getTeas = client.createRequest<{ response: Tea[]; queryParams?: FirestoreQueryParams<Tea> }>()({
  endpoint: "teas",
  method: "getDocs",
});

export const getTea = client.createRequest<{ response: Tea }>()({ endpoint: "teas/:teaId", method: "getDoc" });

export const addTea = client.createRequest<{ response: Tea; payload: Omit<Tea, "__key"> }>()({
  endpoint: "teas",
  method: "addDoc",
});

export const updateTea = client.createRequest<{ response: Partial<Tea>; payload: Partial<Tea> }>()({
  endpoint: "teas/:teaId",
  method: "updateDoc",
});

export const mergeTea = client.createRequest<{ response: Partial<Tea>; payload: Partial<Tea> }>()({
  endpoint: "teas/:teaId",
  method: "setDoc",
  options: { merge: true },
});

export const deleteTea = client.createRequest<{ response: null }>()({ endpoint: "teas/:teaId", method: "deleteDoc" });

const greens = await getTeas.send({
  queryParams: (c) => c.where("type", "==", "Green").orderBy("year", "desc").limit(10),
});
const one = await getTea.setParams({ teaId: "abc" }).send();
const created = await addTea.send({ payload: { name: "Sencha", type: "Green", year: 2024 } });
```

Results and `extra`:

| Method                | `data`                                                               | `extra`                                                 |
| --------------------- | -------------------------------------------------------------------- | ------------------------------------------------------- |
| `getDocs`             | array of documents, each with `__key` (document id); `[]` when empty | `ref` (CollectionReference), `snapshot` (QuerySnapshot) |
| `getDoc`              | document with `__key`, or `null`                                     | `ref`, `snapshot` (DocumentSnapshot)                    |
| `addDoc`              | the payload plus `__key` of the new document                         | `ref` (new DocumentReference)                           |
| `setDoc`, `updateDoc` | the payload you sent                                                 | `ref`                                                   |
| `deleteDoc`           | `null`                                                               | `ref`                                                   |

Firestore chain: `where(field, op, value)`, `orderBy(field, "asc" | "desc")`, `limit(n)`, and the cursors `startAt`,
`startAfter`, `endAt`, `endBefore`. With `FirestoreQueryParams<Doc>`, fields (dot paths for nested ones, never `__key`)
and values are typed, `"in"` takes an array, and cursors take one value per `orderBy`, in order
(`(c) => c.orderBy("year").orderBy("name").startAfter(2023, "Hong Yu")`). Firestore index rules still apply (a range
`where` plus `orderBy` on another field needs a composite index; the error arrives in `response.error`). The same
constraints as an array use `$where`, `$orderBy`, `$limit` and the `$`-cursors.

## Realtime Database requests

```ts
import { Client } from "@hyper-fetch/core";
import { FirebaseAdapter } from "@hyper-fetch/firebase";
import type { RealtimeDBQueryParams } from "@hyper-fetch/firebase";
import { getDatabase } from "firebase/database";

const rtdbClient = new Client({ url: "" }).setAdapter(FirebaseAdapter(getDatabase(app)));

type Message = { text: string; createdAt: number };

export const getMessages = rtdbClient.createRequest<{
  response: (Message & { __key: string })[] | null;
  queryParams?: RealtimeDBQueryParams<Message>;
}>()({ endpoint: "messages", method: "get" });

export const pushMessage = rtdbClient.createRequest<{ response: { text: string }; payload: { text: string } }>()({
  endpoint: "messages",
  method: "push",
});

await getMessages.send({ queryParams: (c) => c.orderByChild("createdAt").limitToFirst(20) });
await pushMessage.send({ payload: { text: "hi" } }); // data gets __key, extra.key is the new key
```

- Odd-segment paths (`messages`) return an array of children, each spread into an object with its `__key`, or `null`
  when there are none. Lists should hold objects: a primitive child comes back as `{ 0: "c", __key: "2" }`.
- Even-segment paths (`messages/abc`) return `snapshot.val()` as is.
- `set` replaces, `update` merges, `remove` deletes; `set` with a `null` payload also deletes.
- Realtime chain: `orderByChild(path)` (nested paths use `/`), `orderByKey()`, `orderByValue()`, `limitToFirst`,
  `limitToLast`, then `equalTo` and the cursors. One `orderBy*` per query, enforced by the types; `equalTo` and cursors
  exist only after it and take the ordered value plus an optional tie key (`.startAfter(2022, "lastKey")`).
  `orderByChild` needs an `.indexOn` rule, or the request resolves with an `Index not defined` error.

## Realtime listeners

```ts
declare function render(teas: Tea[] | null): void;

export const onGreenTeas = socket
  .createListener<Tea[]>()({ topic: "teas", options: { groupByChangeType: true } })
  .setQueryParams((c) => c.where("type", "==", "Green"));

export const onTea = socket.createListener<Tea | null>()({ topic: "teas/:teaId" });

const off = onGreenTeas.listen(({ data, extra }) => {
  render(data); // the full current list
  const changes = extra.groupedResult; // { added, modified, removed } or null when nothing changed
  if (changes) console.log(changes.added.length, "added");
});
off(); // stops this onSnapshot subscription
```

Listener constraints go in `setQueryParams((c) => ...)` (or `queryParams` in `createListener`), the same chain as
requests, without field typing. `options.constraints` still works and is deprecated.

| Listener `options`  | Database          | Effect                                                                     |
| ------------------- | ----------------- | -------------------------------------------------------------------------- |
| `groupByChangeType` | Firestore         | `extra.groupedResult` with `added` / `modified` / `removed` document data. |
| `onlyOnce`          | Realtime Database | `onValue` fires once.                                                      |

`extra` holds `ref` and `snapshot` (raw Firebase objects). Topic params work as in any listener
(`onTea.setParams({ teaId })`). The socket is connected from the start; `connect()` / `disconnect()` toggle the Firebase
network for the whole instance. `delivery` strategies (`latest`, `batch`) work on Firebase listeners too.

## Type safety

The database instance you pass picks the adapter type: `FirebaseAdapter(getFirestore())` gives a client whose `method`
is `"getDoc" | "getDocs" | "setDoc" | "updateDoc" | "addDoc" | "deleteDoc"`, `FirebaseAdapter(getDatabase())` gives
`"get" | "push" | "set" | "update" | "remove"`. The same switch happens for `FirebaseSocketsAdapter` listener options.

Type documents and collections in the request generic, exactly like HTTP requests (`hyper-fetch-core`):

```ts
import { $orderByChild } from "@hyper-fetch/firebase";

type TeaDoc = { __key?: string; name: string; type: "Green" | "Black"; year: number };

const listTeas = client.createRequest<{ response: TeaDoc[]; queryParams?: FirestoreQueryParams<TeaDoc> }>()({
  endpoint: "teas",
  method: "getDocs",
});
const createTea = client.createRequest<{ response: TeaDoc; payload: Omit<TeaDoc, "__key"> }>()({
  endpoint: "teas",
  method: "addDoc",
});

// @ts-expect-error - "get" is a Realtime Database method, this client is Firestore
client.createRequest<{ response: TeaDoc }>()({ endpoint: "teas", method: "get" });
// @ts-expect-error - Realtime Database constraint in a Firestore query
listTeas.send({ queryParams: [$orderByChild("year")] });
// @ts-expect-error - unknown field, and year is a number
listTeas.send({ queryParams: (c) => c.where("yaer", "==", "2024") });
// @ts-expect-error - two orderBy, so a cursor takes at most two values
listTeas.send({ queryParams: (c) => c.orderBy("year").orderBy("name").startAfter(2024, "a", "b") });
// @ts-expect-error - payload shape is checked
createTea.send({ payload: { name: 1, type: "Green", year: 2024 } });
// @ts-expect-error - Firestore where operators are checked
$where("type", "===", "Green");
// @ts-expect-error - request options accept only { merge }
client.createRequest<{ response: TeaDoc[] }>()({ endpoint: "teas", method: "getDocs", options: { foo: true } });
```

What the types enforce:

| Checked                                                                                                                                                       | Not checked (runtime only)                                              |
| ------------------------------------------------------------------------------------------------------------------------------------------------------------- | ----------------------------------------------------------------------- |
| `method` belongs to the database the adapter was created with                                                                                                 | that `response` matches what the method returns (`getDoc` vs `getDocs`) |
| constraints are Firestore helpers for Firestore, Realtime helpers for Realtime Database (with `queryParams?: FirestoreQueryParams` / `RealtimeDBQueryParams`) | that the path parity fits the method (document vs collection)           |
| with `FirestoreQueryParams<Doc>` / `RealtimeDBQueryParams<Doc>`: callback field names, values, cursor arity, one Realtime `orderBy*`                          | field names in the `$`-helper array form and in listener query params   |
| `$where` operator (`WhereFilterOp`), `$orderBy` direction                                                                                                     | Firestore composite indexes and Realtime `.indexOn` rules               |
| `payload` and `params` shapes you declared                                                                                                                    | that Firestore actually stores that shape (no runtime validation)       |
| request `options`: only `merge`                                                                                                                               |                                                                         |

- Declare `__key?: string` on document types; every returned document carries it.
- `response.extra` is a union of the method extras (`ref`, `snapshot`); narrow before reading `snapshot`.
- `response.status` is typed as `string | null`; compare to `"success"`, `"emptyResource"`, `"error"`.

Realtime listeners: the generic is the delivered data, `extra` and `options` come from the adapter.

```ts
const onTeasLive = socket
  .createListener<TeaDoc[]>()({ topic: "teas", options: { groupByChangeType: true } })
  .setQueryParams((c) => c.where("type", "==", "Green"));
onTeasLive.listen(({ data, extra }) => {
  data; // TeaDoc[] (the generic you declared; collections can arrive as [] or null at runtime)
  extra.groupedResult?.added; // Firestore extra: ref, snapshot, unsubscribe, groupedResult, status
  extra.status; // "success" | "emptyResource" | "error"
});

// @ts-expect-error - onlyOnce is a Realtime Database listener option
socket.createListener<TeaDoc[]>()({ topic: "teas", options: { onlyOnce: true } });
```

For Realtime Database sockets `options` is `{ onlyOnce? }` and `extra` is `{ ref, snapshot, status }`
(`DatabaseReference`, `DataSnapshot`). Declare the listener data as `T | null` for single documents. `useListener`
returns `data: T | null` from the same generic (see `hyper-fetch-sockets`, `references/type-safety.md`).

## React

```tsx
import { useFetch, useListener, useSubmit } from "@hyper-fetch/react";

export function TeaList() {
  const { data, loading, error } = useFetch(getTeas.setQueryParams((c) => c.limit(20)));
  const { submit, submitting } = useSubmit(addTea);
  const live = useListener(onGreenTeas); // live.data: Tea[] | null, replaced on every snapshot

  if (loading) return <p>Loading...</p>;
  if (error) return <p>Could not load teas</p>;
  return (
    <>
      <button
        type="button"
        disabled={submitting}
        onClick={() => submit({ payload: { name: "New", type: "Green", year: 2025 } })}
      >
        Add
      </button>
      <ul>
        {(live.data ?? data ?? []).map((tea) => (
          <li key={tea.__key}>{tea.name}</li>
        ))}
      </ul>
    </>
  );
}
```

Use `useFetch` for reads (cached, deduplicated), `useSubmit` for writes, `useListener` for live data. After a write you
can rely on a live listener, or invalidate: `client.cache.invalidate(getTeas)`. See `hyper-fetch-react` and
`hyper-fetch-sockets` (`references/react-hooks.md`).

## Pitfalls

| Wrong                                                                       | Right                                                |
| --------------------------------------------------------------------------- | ---------------------------------------------------- |
| `.setAdapter(() => FirebaseAdapter(db))`                                    | `.setAdapter(FirebaseAdapter(db))`                   |
| A Firestore method (`"getDocs"`) on a Realtime Database client              | `"get"`, `"set"`, `"push"`, `"update"` or `"remove"` |
| `getDoc` on `teas` / `getDocs` on `teas/1`                                  | document paths have an even number of segments       |
| `queryParams: { constraints: [...] }` (deprecated)                          | `queryParams: (c) => c.where(...)`                   |
| listener `options: { constraints: [...] }` (deprecated)                     | `listener.setQueryParams((c) => c.where(...))`       |
| `.setData(payload)`                                                         | `.setPayload(payload)` or `send({ payload })`        |
| `listener.listen({ callback })`                                             | `listener.listen(({ data, extra }) => ...)`          |
| Appending snapshot data to state                                            | replace state with `data`                            |
| `socket.disconnect()` to stop one listener                                  | call the function returned by `listen()`             |
| One `FirebaseSocketsAdapter` instance for two sockets                       | create the adapter inline per socket                 |
| `try { await req.send() } catch` for Firebase errors                        | check `response.error` / `response.status`           |
| Importing from `@hyper-fetch/firebase` in server code with service accounts | `@hyper-fetch/firebase-admin`                        |

## Testing

Run the Firebase emulators (`connectFirestoreEmulator`, `connectDatabaseEmulator`) and point the adapters at the
emulated instances; HyperFetch adds nothing that needs mocking. For component tests, mock at the request level with
`request.setMock(...)` (see `hyper-fetch-testing`).

## Docs

- https://hyperfetch.bettertyped.com/docs/integrations/adapter-firebase/overview
- https://hyperfetch.bettertyped.com/docs/integrations/adapter-firebase/firestore
- https://hyperfetch.bettertyped.com/docs/integrations/adapter-firebase/realtime
- https://hyperfetch.bettertyped.com/docs/integrations/adapter-firebase/realtime-queries

Related skills: `hyper-fetch-core`, `hyper-fetch-sockets`, `hyper-fetch-react`, `hyper-fetch-firebase-admin`.
