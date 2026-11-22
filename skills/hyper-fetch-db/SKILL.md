---
name: hyper-fetch-db
description:
  Collections and live queries for HyperFetch (@hyper-fetch/db) - collection() with a Standard Schema or rowType(),
  loaders (load with rows, where, orderBy, cursor, page, limit, fixed, serverOnly, byKey, byKeys), resource() from an
  SDK, syncs from socket listeners (insert, update, delete, syncChanges), ingest of other responses, normalize of nested
  rows, createDb with links, queries (where/orderBy/select/limit/join/findOne/local/infinite,
  eq/gt/gte/lt/lte/inArray/and/or/not, op server-only operators), explain(), optimistic writes with mutate
  (insert/update/delete, onSuccess keep/refetch/sync), db.transaction with named mutationFn, dependsOn, offline outbox,
  persistence with codecs, tabs, dehydrate/state for server rendering, inspect/onChange for devtools, relayConnection
  for GraphQL, firestoreCollection from @hyper-fetch/firebase, and useLiveQuery, useLiveInfiniteQuery, DbProvider and
  useDb from @hyper-fetch/react. Use when code imports @hyper-fetch/db or calls collection, createDb, useLiveQuery, or
  when the task is normalized or shared client data, a list and detail that must stay in step, related records or joins,
  live updates from sockets or Firestore into lists, optimistic updates without rollback code, or offline writes.
---

# HyperFetch DB

`@hyper-fetch/db` keeps data in typed **collections** of complete rows, fed by HyperFetch requests (**loaders**), socket
listeners (**syncs**) and other responses (**ingest**). Components query collections, never endpoints. The db picks a
loader per query, sends what the backend can serve, runs the rest on the rows it holds and keeps the result live.

## Install and minimal setup

```bash
npm install @hyper-fetch/core @hyper-fetch/sockets @hyper-fetch/db
# React hook
npm install @hyper-fetch/react
```

```ts
import { collection, createDb, eq } from "@hyper-fetch/db";

const Post = collection(PostSchema, { key: "id", version: "updatedAt" })
  .load(getTeamPosts, { where: { teamId: { eq: (teamId) => ({ params: { teamId } }), required: true } } })
  .load(getPost, { byKey: (id) => ({ params: { postId: id } }) })
  .sync(onPostChanged, { type: "update" })
  .mutate({
    update: { request: updatePost, map: (key, changes) => ({ params: { postId: key }, payload: changes }) },
  });

export const db = createDb({ post: Post });
```

## Golden rules

- **Rows are complete.** A loader's rows must be exactly the schema's row. A list that returns summaries is its own
  collection (`postSummary`), never a partial `post`.
- **Mismatches show at `createDb`.** A loader, sync, ingest or mutate whose rows do not fit returns a `RowMismatch`, so
  chaining on it or passing it to `createDb` does not compile.
- **No schema?** Use `collection(rowType<Post>(), { key: "id" })`, not `collection<Post>(...)`: the key must be
  inferred.
- **Queries start at a collection**: `db.post.where(...)`, `db.post.findOne(id)`, `db.post.local()`.
- **Required filters** of a loader must be set as top-level `eq` conditions, or the query does not compile.
- **Paginated loaders** (with `cursor` or `limit`) must be able to send every condition and order of a query.
- **Writes never reject.** `await db.post.update(...)` resolves with `{ success, data, error }`.

## Core patterns

### Loaders

```ts
collection(PostSummarySchema, { key: "id" }).load(getTeamPosts, {
  rows: (response) => response.data.items,
  where: {
    teamId: { eq: (teamId) => ({ params: { teamId } }), required: true },
    likes: { gt: (likes) => ({ queryParams: { likes_gt: likes } }) },
    title: { eq: true }, // uses the db-wide notation from createDb options
  },
  orderBy: { createdAt: (direction) => ({ queryParams: { sort: `createdAt:${direction}` } }) },
  fixed: { archived: false },
  serverOnly: ["title"],
});
```

### Queries

```ts
import { and, eq, gt, or } from "@hyper-fetch/db";

const query = db.post
  .where((post) => and(eq(post.teamId, 1), gt(post.likes, 10)))
  .orderBy((post) => post.createdAt, "desc")
  .select((post) => ({ id: post.id, title: post.title }));

query.explain(); // { kind, loader, sent, local, answeredLocally, syncs }
const unsubscribe = query.subscribe(() => render(query.getSnapshot()));
const state = await query.get(); // first state that is not loading
```

State: `data`, `status` (`loading` | `ready` | `error` when a first load failed), `error`, `stale`, `isFetching`,
`hasNextPage`. Actions: `refetch()`, `fetchNextPage()`.

### React

```tsx
import { useLiveQuery } from "@hyper-fetch/react";

const { data, status, fetchNextPage } = useLiveQuery(db.post.where((post) => eq(post.teamId, teamId)));
```

No dependency array: a query is identified by its structure.

### List and detail

```ts
const header = useLiveQuery(db.postSummary.findOne(postId).local()); // list fields at once
const body = useLiveQuery(db.post.findOne(postId)); // loads the full post
```

### Related data

```ts
const db = createDb({ post: Post, postSummary: Summary, user: User }, { links: [["post", "postSummary"]] });

// A post's nested author goes to `user` on every server write
collection(PostSchema, { key: "id" }).normalize(User, (post) => (post.author ? [post.author] : []));

// Left join on the user's key: `author` is `User | undefined`, loaded in one `byKeys` batch
db.postSummary.where((post) => eq(post.teamId, 1)).join("author", db.user, (post) => post.authorId);
// Inner join, and one-to-many on a field of the joined collection (an array, loaded with one `inArray` request)
db.postSummary.join("author", db.user, { by: (post) => post.authorId, type: "inner" });
db.postSummary.join("comments", db.comment, { by: (post) => post.id, on: "postId" });
```

- A link changes the fields both collections have, optimistic layers included, but never creates rows.
- `normalize` needs complete target rows; `createDb` throws when the db lacks the target collection.
- A join's field type must fit the joined key. Without a key loader, a join reads rows the db holds; `local()` queries
  never load joined rows.
- Rows read by key (joins, `findOne`) join the scoped syncs their own fields select, and a sync with `byKey` gives one
  row its own listener.

### Syncs

```ts
const byTeam = { teamId: { eq: (teamId: number) => ({ params: { teamId } }) } };

collection(PostSummarySchema, { key: "id" })
  .sync(onPostCreated, { type: "insert", where: byTeam, row: ({ body, ...summary }) => summary })
  .sync(onPostChanged, { type: "update", where: byTeam, row: ({ body, ...changes }) => changes })
  .sync(onPostDeleted, { type: "delete", where: byTeam, key: (message) => message.id });
```

A listener whose event carries many changes, such as a snapshot, uses
`.syncChanges(listener, { changes: (event) => ({ upsert, delete, refetch }) })`, optionally with `notation` to send each
subset's conditions to the listener.

A message with fields the collection lacks needs a `row` mapping. `incomplete: "refetch"` loads unknown rows by key, and
`resumes: true` skips the refetch after a reconnect when the adapter resumes from the last event id.

### Writes

```ts
.mutate({
  insert: { request: createPost, map: (row, { id }) => ({ payload: { ...row, idempotencyKey: id } }) },
  delete: { request: deletePost, map: (key) => ({ params: { postId: key } }), onSuccess: "keep" },
})
```

`onSuccess` is required when the response is not the row: `"keep"` keeps the change, `"refetch"` reloads the subsets
that hold the row, `"sync"` waits for a sync event. An insert without a key gets a temporary one;
`db.post.renderKey(key)` stays stable when the server's key replaces it.

### Offline

```ts
const db = createDb(collections, {
  offline: { retryable: (response) => response.status !== 422 },
  persistence: { storage: localStorage, scope: userId, version: 1, networkTimeout: 5000 },
});
const post = db.post.insert(draft);
db.comment.insert(comment, { dependsOn: [post] });
```

### Infinite lists

```tsx
const { pages, hasNextPage, fetchNextPage, isFetchingNextPage } = useLiveInfiniteQuery(
  db.post.where((post) => eq(post.teamId, teamId)).orderBy((post) => post.createdAt, "desc"),
  { pageSize: 20 },
);
```

Needs `orderBy`. UI pages are independent of backend pages: held rows show at once, a cursor loader loads more backend
pages, a `limit`-only loader is sent window + 1. Outside React: `query.infinite({ pageSize })`. A refetch of a paginated
list reloads every loaded page from the first.

### Transactions

```ts
const db = createDb(collections, {
  transactions: { publish: { mutationFn: ({ id, mutations }) => publish.setPayload({ mutations, key: id }) } },
});
await db.transaction("publish", (tx) => {
  tx.post.update(1, { status: "published" });
  tx.notification.insert({ id: crypto.randomUUID(), postId: 1 });
});
await db.transaction((tx) => tx.post.update(1, { title: "A" })); // through each collection's mutate, in order
```

One optimistic layer, kept or reverted together. Inserts need their key. Named transactions replay from the outbox by
name. `onSuccess: "refetch"` on a named transaction reloads the lists holding its rows.

### Server-only operators

```ts
collection(PostSchema, { key: "id" }).load(searchPosts, {
  rows: (response) => response.results,
  where: { title: { search: (text: string) => ({ queryParams: { q: text } }) } },
});
db.post.where((post) => op("search", post.title, "tea"));
```

The loader must declare it, or the query does not compile. Its subset never answers other queries; inserts mark it
stale.

### Server rendering and devtools

```tsx
const db = createAppDb(); // per request on the server
await db.post.where((post) => eq(post.teamId, 1)).get();
const state = db.dehydrate();
const clientDb = createAppDb({ state }); // on the client
<DbProvider db={clientDb}>
  <App />
</DbProvider>; // components: const db = useDb<AppDb>()
DevtoolsPlugin({ appName: "App", dbs: [db] }); // HyperFlow DB page, from db.inspect() / db.onChange()
```

Persistence and `dehydrate` store type-tagged JSON (Date, bigint, Map, Set survive); other types need `codecs`.

### Firestore

```ts
import { firestoreCollection } from "@hyper-fetch/firebase";

const Post = firestoreCollection(PostSchema, { client, socket, path: "posts", key: "id" });
```

`client` uses `FirebaseAdapter`, `socket` uses `FirebaseSocketsAdapter`, and `key` is a string field holding the
document id. Every operator except `or`/`not` and every `orderBy` is sent as a Firestore constraint, `onSnapshot` keeps
subsets live, and writes use `setDoc`/`updateDoc`/`deleteDoc` with Firestore's own local writes (no optimistic layer, no
outbox). Inserts need the key.

### REST resources and GraphQL

```ts
collection(PostSchema, { key: "id" }).resource(sdk.posts, { item: "$postId", list: { where: ["teamId"] } });

collection(PostSchema, { key: "id" }).load(getPosts, {
  ...relayConnection((response: PostsResponse) => response.posts),
  page: (after) => ({ payload: { after } }),
});
```

## Pitfalls

- A request used by both `useFetch` and a collection keeps two copies that do not update each other.
- `.local()` queries never load and never start syncs.
- Without `orderBy`, a new row never joins a paginated list that has more pages.
- `insert` of a key the db holds and `update` that changes the key resolve with an error and send nothing.
- Rows are frozen; copy before changing. `undefined` in an update leaves a field, `null` clears it.
- `findOne(key)` takes no `where`, `orderBy` or `limit`. Inserts in a transaction need their key.
- Failures go to `db.onError` with `type` `mutation`, `validation`, `load`, `sync`, `outbox`, `persistence` or
  `subscriber`; nothing throws.
- `db.clear()` clears every tab; responses to requests sent before it are never written.

## Testing

Mock requests with `request.setMock()` or at the network level. Collections run real requests, so any mock that answers
the loader's request works.
