# 0002 - `@hyper-fetch/db`: collections, loaders and live queries

- Status: proposed
- Date: 2026-11-21
- Area: new package `@hyper-fetch/db`, hooks in `@hyper-fetch/react`

API names in this record are working names. The rules behind them are the decision.

## Context

The **Cache** stores one response per `cacheKey`. When the same object appears in several responses, for example post 1
in the list and in the detail view, every response holds its own copy, in its own format.

Keeping those copies current with REST and a socket costs every app the same hand-written work:

- A socket handler has to find each cached response that holds the post, in each response's format, and patch it. The
  response it forgets shows stale data.
- A new post has to be placed in the right lists, at the right position, inside the loaded pages. Most apps invalidate
  and refetch every list instead.
- A list response that was in flight during a socket event arrives later and overwrites the newer value.
- After a reconnect nobody knows which events were missed, so everything refetches.

The GraphQL adapter needs normalized data, because one document returns many related types, mutations return updated
objects and subscriptions push changes. The Firebase adapter needs the same, because Firestore snapshots stream
document-level inserts, updates and removals.

We looked at two references:

- **Apollo Client** normalizes responses into an entity store and updates every view of an entity when it changes. It
  only works for GraphQL. Its type policies have no types, and adding or removing list items needs hand-written
  `cache.modify` calls with field names as strings.
- **TanStack DB** keeps data in typed collections that queries read directly. Live queries update incrementally through
  differential dataflow, and server rows and optimistic changes are kept apart. Every row in a collection is complete,
  so its types stay simple and honest. Each collection's author writes the code that turns a query into a request.

Four earlier ideas were rejected while designing this:

1. **Normalizing the core Cache.** Requests would keep reading through the Cache, and entities would be stored
   underneath. Reading an entity directly (`useEntity(Post, id)`) then became a second read path. It had no fetching and
   no freshness rules of its own, so the same post could be fresh in one place and stale in another.
2. **Relations declared with strings** (`.fields({ author: "User" })`). Renaming or removing a collection did not break
   them at compile time.
3. **Queries that name an endpoint** (`db.post.$list`). Rows were typed by the endpoint that loaded them, so every query
   had to name one. Reads looked like `useFetch` with extra steps, and changing an endpoint changed every component.
4. **Partial rows.** One row would hold a list's summary fields and a detail's extra fields, with freshness tracked per
   field and missing fields loaded on demand. The types and the runtime grew a lot, for a case that a second collection
   covers.

## Decision

Build a separate package, `@hyper-fetch/db`. **Collections** are the source of truth, and components query collections,
never endpoints. Every row in a collection is complete. Each collection declares how its backend loads rows, keeps them
live and changes them. The db plans every query from those declarations: it answers from the rows it holds when it can,
asks the backend for the rest and keeps the result live. The core Cache does not change, and apps that never install
`/db` are not affected.

### Collections

```ts
const Post = collection(PostSchema, { key: "id", version: "updatedAt" });
const PostSummary = collection(PostSummarySchema, { key: "id", version: "updatedAt" });

const db = createDb({ post: Post, postSummary: PostSummary, user: User });
```

- A collection is defined by a [Standard Schema](https://standardschema.dev), so Zod, Valibot, ArkType and any other
  compatible library work without an adapter for each. Without a schema, `collection(rowType<Post>(), { key: "id" })`
  takes the row type from a type argument and does not validate writes. A row type passed straight to `collection<Post>`
  would leave the key field to be inferred, which TypeScript cannot do next to an explicit type argument.
- **Every row is complete:** it has every field of the schema. A query can select, filter and sort by any of them.
- When a list returns summaries and a detail returns more, they are two collections, such as `postSummary` and `post`.
  Collections are per resource shape, never per filter, order or page.
- Schemas are not introspected. Standard Schema exposes types and `validate()`, but not structure, and reading the
  structure would need code specific to each library.
- The schema has an input type and an output type. Inserts and updates accept the input type. Queries, storage and
  mutation requests use the output type. A transform such as `string` to `Date` is typed in both directions.
- `key` accepts only fields whose values are strings or numbers.
- `version` is optional. It names a field whose values are numbers, strings or dates and grow with every change on the
  server (see Merging and ordering).
- By default, validation runs on client writes only, and validation of data from the server can be turned on. Firestore
  collections are the exception and validate incoming data by default (see Adapters).
- A collection is immutable, like a Request. `.load()`, `.sync()`, `.ingest()` and `.mutate()` return a new collection,
  so a collection is defined in one chain. The snippets below show parts of that chain.
- `createDb` takes the collections and returns the `db` that queries and writes go through. The names given to it are
  the names on `db`, as in `db.post`. Requests carry their Client and listeners carry their Socket, so `createDb` needs
  neither.

### Loaders

A collection loads rows through **loaders**, each built on an existing request:

```ts
collection(PostSummarySchema, { key: "id", version: "updatedAt" })
  .load(getTeamPosts, {
    rows: (response) => response.data.items.map(({ author, ...post }) => ({ ...post, authorId: author.id })),
    cursor: (response) => response.meta.next,
    where: {
      teamId: { eq: (teamId) => ({ params: { teamId } }), required: true },
      likes: { gt: (likes) => ({ queryParams: { likes_gt: likes } }) },
    },
    orderBy: { createdAt: (direction) => ({ queryParams: { sort: `createdAt:${direction}` } }) },
  })
  .load(getPostSummariesByIds, { byKeys: (ids) => ({ queryParams: { ids } }), rows: (response) => response.posts });

collection(PostSchema, { key: "id", version: "updatedAt" }).load(getPost, {
  byKey: (id) => ({ params: { postId: id } }),
});
```

- A loader is a request plus the way to read rows from its response. `rows` maps a response to complete rows, for
  example from a wrapped response such as `{ data: { items }, meta }`, reshaping each item on the way. Without it, the
  response is the list of rows, or the row.
- A loader returns complete rows. The type `rows` returns, or the response's item type when there is no `rows`, has to
  be the schema's output type: a missing field, an extra field or a field of another type does not compile.
- The check is in the return type, because a check among the arguments stops TypeScript from inferring the callbacks'
  types. A loader with mismatched rows returns a `RowMismatch` instead of a collection, so the next call in the chain
  and `createDb` do not compile.
- `where` lists the operators the endpoint can serve for each field, and `orderBy` the fields it can sort by. Each one
  maps to request params, query params or a payload (see Operators and backend notation). A filter the endpoint cannot
  work without, such as `teamId` in `/teams/:teamId/posts`, is marked `required`.
- The db evaluates the same operators on the client. That is how it can tell which loaded subsets a new or changed row
  belongs to without asking the server.
- An endpoint with conditions the query cannot see, such as a list that leaves out archived posts, declares them as
  fixed filters, as in `fixed: { archived: false }`. The db applies them to the rows it holds, so a row archived by a
  socket event leaves the list. An undeclared condition lets rows loaded elsewhere appear in the list (see Reads).
- A loader that declares `cursor` or `limit` is **paginated**: it returns one range of the matching rows, not all of
  them.
- `byKey` and `byKeys` loaders read rows by key, for `findOne` and for loading several keys at once. With `byKeys`, the
  keys that all mounted queries need in one tick go out as one request. Deduplication in the dispatcher already merges
  identical requests. Batching merges requests for different keys.
- A loader without filters and pagination loads every row at once. A collection with such a loader is **eager**, and all
  its queries run on the rows it holds.
- Requests run by loaders skip the core Cache, so data is stored once. Deduplication and retries still come from the
  dispatcher. Offline writes go through the outbox, not the dispatcher's `offline` queue (see Offline and persistence).
- Loaders are plain requests, so mocks set with `setMock()`, plugins, authentication and mappers apply to them
  unchanged.

### Resources from the SDK

```ts
const Post = collection(PostSchema, { key: "id" }).resource(sdk.posts, {
  item: "$postId",
  list: { rows: (response) => response.data.items, cursor: (response) => response.meta.next, where: ["status"] },
});
```

- `.resource()` derives loaders and mutations from REST conventions in an SDK schema. `GET /posts` lists,
  `GET /posts/:postId` reads by key, `POST` inserts, `PATCH` or `PUT` updates, and `DELETE` deletes.
- It uses only endpoints that return complete rows. When the list returns summaries, `list: false` leaves it out, and
  the list becomes a loader of the summary collection.
- `item` names the segment that reads one row, such as `"$postId"`. An SDK accepts any `$param` segment at runtime, so
  the name is stated, and the types offer only segments that have a `$get`.
- A path param of the list endpoint, such as `teamId` in `/teams/:teamId/posts`, becomes a required `eq` filter. Path
  params are read from the endpoint, at runtime and in the types.
- Query params cannot be read at runtime, so `list.where` names the ones sent as `eq` filters. The types offer only
  query params that are row fields of the same name and type.
- `update.method` picks `$put` instead of the default `$patch`.
- Options override any part of what was derived, such as `rows` for a wrapped list. Endpoints that do not follow the
  conventions are added with `.load()` and `.mutate()`.
- Hono, Elysia and oRPC apps produce SDK schemas, so their collections are derived the same way.

### Syncs

Listeners keep collections current:

```ts
const byTeam = { teamId: { eq: (teamId) => ({ params: { teamId } }) } };

collection(PostSummarySchema, { key: "id" })
  // ...loaders
  .sync(onPostCreated, { type: "insert", where: byTeam })
  .sync(onPostChanged, { type: "update", where: byTeam })
  .sync(onPostDeleted, { type: "delete", where: byTeam, key: (message) => message.id });
```

- The three event types match the three mutations:
  - `insert` carries a complete row. It creates the row, or replaces one that exists.
  - `update` carries the key and any subset of the schema's fields. It changes a row the collection holds, and the other
    fields stay as they are.
  - `delete` carries the key.
- `row` reshapes a message into a row, or into the key and changed fields for `update`.
- One listener can sync several collections. `onPostChanged` on both `post` and `postSummary` changes both. The db does
  not read schemas, so it cannot drop fields a collection does not have: a message with such a field needs a `row`
  mapping, as in `row: ({ body, ...changes }) => changes`, or the sync does not compile.
- A sync covers only the filters it declares. `where` maps a query's filters to listener params or to a subscription
  payload, the same way a loader maps them to request params, so `onPostChanged` for team X does not cover team Y. A
  sync without `where` covers the whole collection.
- An `update` for a row the collection does not hold is ignored. When an event is incomplete but its row should still
  appear, for example a row that moved into a loaded subset, `incomplete: "refetch"` loads the row by key.
- A subset subscribes to its syncs before it sends its request, and buffers the events that arrive while the request is
  in flight. Once the response is written, the buffered events are applied after it under the ordering rules, so an
  `update` for a row that only the response brings is not lost. Only then does the subset count as loaded.
- With adapters that confirm subscriptions, the subset counts as live once the server has started the subscription.
- GraphQL subscriptions use the same three event types. GraphQL has no standard delete event, so deletes are mapped per
  subscription.
- A listener whose events carry several changes at once, such as a Firestore snapshot, uses `syncChanges`. Its `changes`
  callback reads the complete rows to write, the keys to delete and the keys to load again. With `notation`, one such
  sync covers every subset, because it sends the subset's conditions to the listener the way a loader sends them to its
  request.

### Ingesting other responses

```ts
collection(PostSummarySchema, { key: "id" })
  // ...loaders and syncs
  .ingest(searchPosts, { rows: (response) => response.results })
  .ingest(publishPost, { type: "update" });
```

- Responses of other requests write their rows into the collection, through the same `rows` mapping as loaders. Examples
  are a search endpoint, or a `useSubmit` whose response is the changed post.
- By default an ingested response carries complete rows, like an `insert`. With `type: "update"` it carries some fields
  and changes only rows the collection holds, so a full post can update its summary.
- An ingested request does not become a loader. Queries never send it, and its rows join no loaded subset.
- The request's own Cache entry is not updated by later changes. Reads that must stay current go through the db.

### Linked collections

```ts
const db = createDb({ post: Post, postSummary: Summary }, { links: [["post", "postSummary"]] });
```

- A link declares that two collections hold the same records in different shapes. A write or delete to one changes the
  fields the other has, for the same key, and so does an optimistic layer, which is dropped from both together.
- A link never creates rows. An insert into `post` adds no summary, because a summary belongs to the lists that load it,
  and a row the other collection does not hold is left alone.
- Fields one collection lacks are never copied into it, so a summary never gains `body`.
- Links name collections of the db, so a typo does not compile.

### Normalizing nested rows

```ts
collection(PostSchema, { key: "id" }).normalize(User, (post) => (post.author ? [post.author] : []));
```

- `normalize` writes the rows nested in a collection's rows into another collection, for example the author of a post
  into `user`, or the teams, posts and authors of one GraphQL document.
- It runs on every complete write from the server: loads, inserts, ingested responses and mutation responses. The nested
  rows must be complete rows of the target, or the collection does not compile.
- The target is the collection itself, not a name, so renaming or removing it breaks the build. `createDb` throws when
  the db does not hold the target.
- The nested data stays a field of the row too. Reading the current author goes through the `user` collection, with a
  join.

### Joins

```ts
db.postSummary.where((post) => eq(post.teamId, teamId)).join("author", db.user, (post) => post.authorId);
```

- A join is a left join on the joined collection's key by default. Each result holds the joined row under the given
  name, or `undefined` while it is not loaded or when there is none, and the type says so. With options, the field goes
  in `by`: with `{ by: (post) => post.authorId, type: "inner" }`, results without a joined row are left out, also while
  it loads, and the joined row is typed as present.
- A join can also match a field of the joined collection that is not its key, with `on`, as in
  `db.post.join("comments", db.comment, { by: (post) => post.id, on: "postId" })`. Such a join is one-to-many: each
  result holds an array of joined rows. The joined rows load through a list loader of the joined collection that can
  send `inArray` on that field, one request for the keys of the whole result. A collection without such a loader joins
  the rows it holds.
- The foreign key's type must fit the joined collection's key, or the query does not compile.
- The joined rows are loaded through the joined collection's key loader, so the authors of one list arrive in one
  `byKeys` request, and each stays loaded while a result points at it. A collection without a key loader joins the rows
  it holds. A `local()` query never loads joined rows.
- A change to a joined row updates every result that points at it, and a result that leaves the query releases its
  joined row.
- A sync with `byKey` keeps one row live through a listener of its own, such as a listener on one Firestore document.
  Without `byKey`, a sync with a notation covers list subsets only, so one row never opens a listener on the whole
  collection.
- A row loaded by key, through a join or `findOne`, is kept live by the syncs whose `where` its own field values fill:
  once `post` 1 with `teamId: 1` is held, it joins the subscription of `onPostChanged` for team 1. When the row moves to
  another team, it moves to that team's subscription. Subscriptions are shared, so this opens no extra listener when a
  list of the same team is mounted.
- Right and full joins are not supported, because a UI lists the rows of one collection.

### Reads

```ts
const { data, status, error } = useLiveQuery(
  db.postSummary
    .where((post) => and(eq(post.teamId, teamId), gt(post.likes, 10)))
    .orderBy((post) => post.createdAt, "desc")
    .select((post) => ({ id: post.id, title: post.title })),
);
```

A query is an immutable description, like a Request, and each method returns a new one. Callbacks receive field
references and run when the query is built, never once per row. `useLiveQuery` identifies a query by its structure, the
way `useFetch` identifies a request, so it takes no dependency array.

The db plans each query in four steps:

1. **Answer locally.** When a fresh loaded subset contains the query, the query is answered from the rows the db holds,
   with no request. For example, `teamId = 1 and likes > 10` falls inside a fresh `teamId = 1` subset. An eager
   collection answers every query this way.
2. **Pick a loader.** Among the loaders whose required filters the query sets, the db picks the one that can send the
   most of the query's conditions. Ties go to the loader declared first, so the same query always gets the same plan.
   The `where` is split at its top-level `and`: the conditions the loader declares are sent, and the rest run on the
   returned rows.
3. **Keep it live.** The subset subscribes to the syncs that cover it before its request is sent.
4. **Share.** Queries that need the same subset share it and its request.

`query.explain()` returns the plan: the loader, what is sent, what runs locally and which syncs keep the result live.
Devtools show the same plan.

What a query returns:

- `data` is `undefined` until the subset has loaded, then holds the selected fields of every row. Rows are complete, so
  every selected field is there.
- A query that is not paginated shows every row the collection holds that matches its conditions and its loader's
  `fixed` filters, whichever subset loaded it. A row that an `update` moves into the conditions joins the result, and
  one moved out leaves it.
- A paginated query shows the rows its loaded pages returned, plus inserted rows that sort inside them. Rows held from
  elsewhere do not join a page, because the db cannot tell which page they belong to.
- `findOne` shows any row the collection holds with that key.
- Results without `orderBy` keep the order the loader returned, and inserted rows go to the end. Every order ends with
  the key as a tiebreaker, so cursor pages stay stable.
- `status` tells a first load that failed, when there is nothing to show, from a refresh that failed, when the rows stay
  and `error` is set. `stale` is true while the result's subsets are stale or their syncs are disconnected.
- `.local()` makes a query read only the rows the collection holds. It never sends a request, so it compiles on a
  collection without a matching loader, and its `data` is `undefined` when no row matches.
- The result is kept current incrementally. One write costs work in proportion to the queries it affects, not to the
  number of rows or of mounted queries.
- Writes that arrive together are applied as one transaction, and every query updates once.
- Rows and results that did not change keep their references, so components that did not change do not re-render.
- A failed request leaves the rows as they are and puts the error on the query. Like `send()`, a query never throws for
  a failed request.
- A query does not need React. It can be subscribed to or read once from any code.
- A query read before anything subscribes, such as on a component's first render, shows the rows of a loaded subset that
  would serve it, so a screen the db already holds renders without a loading state.
- An insert of a key the db holds, and an update that changes a row's key, resolve with an error and send nothing.
- The first version supports `where`, `orderBy`, `select`, `limit`, `join`, cursor pagination, infinite queries,
  `findOne` and `local`.

#### Infinite lists

```ts
const { data, pages, hasNextPage, fetchNextPage, isFetchingNextPage } = useLiveInfiniteQuery(
  db.post.where((post) => eq(post.teamId, teamId)).orderBy((post) => post.createdAt, "desc"),
  { pageSize: 20 },
);
```

- An infinite query is a window over an ordered live query: the first `pageSize` times the number of pages rows of its
  result. `pages` splits `data` into pages of `pageSize`. The query must have `orderBy`, so a page never shifts between
  renders. The key breaks ties.
- `fetchNextPage()` widens the window by one page. When the db already holds enough rows, the next page shows at once
  with no request. Otherwise the subset loads more from its loader until it holds one row past the window, or the
  backend has no more:
  - a cursor loader loads its next backend pages, whatever their size, so UI pages and backend pages are independent;
  - a loader with `limit` and no cursor is sent the window size plus one;
  - a loader that is not paginated has already loaded every row, and the window only limits what is shown.
- `hasNextPage` is true while the db holds rows past the window, or the loader reports more.
- The window stays live. An insert inside it pushes the last row to the next page, and a delete pulls the next held row
  in. When a delete leaves the window short and the loader has more, the next backend page loads.
- The window belongs to the subscriber, not the query, so two components showing the same query share its live query and
  its subset, and each keeps its own number of pages. The subset loads enough rows for the widest window.
- `useLiveInfiniteQuery` wraps `query.infinite({ pageSize })`, which works without React like any query. Pages load for
  subscribers only, as queries do.

#### From a list to a detail

```ts
const summary = useLiveQuery(db.postSummary.findOne(postId).local());
const post = useLiveQuery(db.post.findOne(postId));
```

- The header renders from `summary` at once when the list loaded the post, and the body waits for `post`.
- On a link opened directly, `summary` has no row, and the page renders from `post` alone.
- Each query is complete or empty, and each is typed by its own collection. No field is typed as present while it is
  missing.
- `onPostChanged` syncs both collections and `publishPost` is ingested into both, so the header and the body show the
  same title.

### Freshness

- A loaded subset is fresh while connected syncs cover its filters with `insert`, `update` and `delete` events.
  Otherwise it is fresh until its loader's `staleTime` has passed.
- When a query mounts, the window regains focus or the connection returns, the db refetches the stale subsets of the
  mounted queries. A refetch replaces the subset's rows and their order. A paginated subset refetches every page it has
  loaded, in order from the first, following each new cursor, and counts as fresh once the last one is back.
- After a reconnect, every subset the reconnected socket's syncs covered counts as stale, unless the subscription
  resumed from its last event id, because the server then sends the missed events.

### Loaded subsets and garbage collection

- A query loads a **loaded subset**: the conditions sent to the backend, an order and a range, served by one loader.
  Loaded subsets own the rows they returned.
- A complete response that no longer returns a row releases it from that subset. The row stays in the collection while
  another subset owns it. Only a delete mutation or a delete event removes a row as deleted.
- A failed response releases nothing.
- A paginated subset is always a prefix of its ordered result: pages 1 to n from the first page. It records no set of
  ranges. A refetch reloads pages 1 to n and releases every row none of them returned, so a row deleted on the server
  leaves the list even when no delete event arrived. Rows stay on screen until the refetch has finished, so the list
  does not jump while it reloads. When a page fails, the refetch stops, its rows stay, and the query reports the error.
- A new row joins a paginated subset only when it sorts before the last loaded row, or anywhere once the backend has no
  more pages.
- When the last query using a subset unmounts, a `gcTime` timer starts. When it fires, the subset is released, and rows
  no subset owns are removed. The default matches the core `cacheTime` default. Rows touched by pending mutations are
  kept until those mutations finish.

### Merging and ordering

- Loader responses, `insert` events and complete ingested rows replace the stored row, so a field a complete row leaves
  out is gone, unless a newer write set it. `update` events, `update` ingests and mutation results change only the
  fields they carry. `null` clears a field, and `undefined` is no value: an update leaves the field as it is.
- Stored rows are frozen. They are shared by every query and component, so changing one in place fails instead of
  corrupting them.
- A nested object or array is one value, replaced whole and never merged into. Merging would mix two objects when the
  nested object itself changes, for example the name of a new author with the avatar of the old one.
- Writes are ordered per field, because a partial update and a complete response can race:
  - With `version`, a write changes only the fields whose stored version is not newer than its own. At an equal version
    the write made later wins, so a stale response never undoes a kept write.
  - Without `version`, or for a write that does not carry the version field, a response changes only the fields that
    were last written before its request was sent. A response never overwrites a socket event or a mutation result that
    arrived while it was in flight.
  - Every write is ordered by one counter the db advances when a request is sent or a write lands, never by the clock,
    so two writes within one millisecond are still ordered. An ingested request counts from when it was sent, which the
    db sees through the client's request events; one sent before the db existed counts from its response.
- A delete counts as a write. The db remembers a deleted key until the requests sent before the delete have settled, so
  a late response cannot bring the row back. The newest delete wins, and a row written after a delete stays.
- A refetch that starts while a mutation is in flight waits for that mutation to finish. A write's own
  `onSuccess: "refetch"` does not wait for the writes queued behind it, which wait for it.
- A complete reload releases the rows it no longer returns, but never a row written after it was sent, by a write, an
  event or another response: the load cannot know about it.
- A refetch asked while a next page loads runs after that page, from the first page.

### Operators and backend notation

- Operators are one fixed vocabulary for every backend: `eq`, `gt`, `gte`, `lt`, `lte`, `inArray`, `and`, `or` and
  `not`. They only build an expression. They hold no backend notation and cannot be configured.
- Each operator has one meaning on the client. The db uses it to filter rows it holds and to decide which subsets a row
  belongs to. A backend filter the client cannot evaluate the same way, such as full-text search, is a server-only
  operator (below).
- Notation belongs to the loader. The same `gt(post.likes, 10)` becomes `likes_gt=10` for one REST API,
  `{ likes: { _gt: 10 } }` in a GraphQL variable and `where("likes", ">", 10)` in Firestore.
- Notation is set at three levels, and the most specific one wins:
  - An adapter can ship its notation. Firestore collections map every operator to Firestore query constraints and
    declare no mapping.
  - A db can set a default notation for an API that follows one convention. Loaders then only list which operators each
    field supports, as in `likes: { gt: true }`.
  - A loader maps an operator itself, as in the snippet under Loaders.
- `or` and `not` run on the client. A notation could send them later for backends that support them, such as Firestore's
  `or()` queries.
- A subset contains a query when every condition the subset sent is also a top-level condition the query sends, and
  their `fixed` filters match, so the query only narrows the subset. A paginated subset contains nothing, and `or`,
  `not` and server-only operators never make a containing subset. Containment is checked on the expression, never by
  reasoning about ranges, so it cannot be wrong for values the client compares differently.
- A loader can declare server-only operators, such as `search`, which have no meaning on the client:
  `db.post.where((post) => op("search", post.title, "tea"))`, mapped like any operator as
  `title: { search: (text) => ({ queryParams: { q: text } }) }`. A query that uses one must send it, or it does not
  compile. Its subset is never used to answer other queries locally, and it places no new rows: an insert or update that
  may concern it marks it stale instead.
- Answering locally and placing new rows rely on the client comparing values the way the server does. Comparisons are
  exact: strings by code point, dates by instant. A field the backend compares differently, for example
  case-insensitively or by locale, is marked `serverOnly` on the loader. Queries that filter or sort by it are never
  answered locally, and their subsets refetch instead of placing new rows.

```ts
const gt = (field, value) => ({ queryParams: { [`${field}_gt`]: value } });

const db = createDb({ post: Post, user: User }, { where: { gt } });
```

### Strict typing

Types are strict. Readable error messages are not a goal: a plain TypeScript error is enough.

- A loader, `insert` sync or ingested request that does not produce the schema's output type does not compile. An
  `update` sync or ingest carries the key plus schema fields of the same types.
- A query result has exactly the fields it selects. Selecting, filtering on or sorting by a field the schema lacks is
  the usual "property does not exist" error.
- A query that sets the required filters of no loader does not compile, unless it is `local()`.
- A query with `limit` or a cursor has to be served completely by one paginated loader: every condition and order sent
  to the backend. Filtering or sorting one page on the client gives wrong results, so anything else does not compile.
- An operator takes a field reference and a value of that field's type. `gt(post.title, 10)` does not compile.
- A field that is optional in the schema is typed `T | undefined` in the result.
- No `any` reaches a row, a result or a mutation input.

### Mutations and optimistic changes

```ts
collection(PostSchema, { key: "id" })
  // ...loaders and syncs
  .mutate({
    insert: { request: createPost, map: (row) => ({ payload: row }) },
    update: { request: updatePost, map: (key, changes) => ({ params: { postId: key }, payload: changes }) },
    delete: { request: deletePost, map: (key) => ({ params: { postId: key } }), onSuccess: "keep" },
  });

db.post.update(1, { title: "B" });
```

- `.resource()` derives these mappings from the SDK. Each operation maps its arguments to the request, the same way
  loaders map filters. `db.post.update` accepts only changes that the request's payload type can carry.
- A write applies an optimistic layer at once, then sends the mapped request.
- Writes to the same row are sent one at a time, in order, because a later write is built on the earlier ones. When one
  fails, the writes queued after it on that row are dropped with it, and the error names them.
- On success, a response whose type is the row, or some of its fields with the key, is written into the collection
  through `row`, and the layer is dropped in the same step. Users do not write that step by hand.
- A response that does not fit the row, such as an empty `204` or a different shape, needs `onSuccess`. Leaving it out
  for such a response does not compile:
  - `"keep"` keeps the optimistic change as the server state.
  - `"refetch"` refetches the loaded subsets that hold the row, and keeps the layer until the refetch has written its
    rows, so the old value never flashes back.
  - `"sync"` keeps the layer until a sync event for the row arrives. After a timeout the subsets refetch instead.
- On failure or abort, the layer is dropped and every query reverts. No hand-written rollback is needed, because the
  layer records exactly what the write changed.
- An optimistic change to `post` shows in `postSummary` only when the two collections are linked. Otherwise it reaches
  the summary with the response or a sync event.
- An insert can leave the key to the server. The optimistic row gets a temporary key, and when the response arrives the
  server's row replaces it in one step. Writes to a row whose insert is still in flight wait for it and then use the
  server's key.
- Every row has a render key that stays the same when a temporary key is swapped for the server's, so components keyed
  by it do not remount.
- Backends with their own local writes keep them. Firestore applies writes locally and marks snapshots with
  `hasPendingWrites`, so a Firestore collection uses those pending writes and adds no layer of its own. Applying both
  would apply the write twice.

### Transactions

```ts
const db = createDb(collections, {
  transactions: {
    publish: ({ mutations, id }) => publishRequest.setPayload({ mutations, idempotencyKey: id }),
  },
});

const result = await db.transaction("publish", (tx) => {
  tx.post.update(postId, { status: "published" });
  tx.notification.insert({ id: crypto.randomUUID(), postId });
});
```

- A transaction groups writes to several rows and collections into one optimistic layer, which is kept or dropped as a
  whole.
- A named transaction sends every write through one `mutationFn` declared in `createDb`, which receives the writes and
  the transaction id as an idempotency key, and returns a request to send. The collections' `mutate` mappings are not
  used. The name, not the function, is stored in the outbox, so a transaction can be replayed after a restart, and the
  names are typed.
- On success, the changes become the server state and the layer is dropped. With `onSuccess: "refetch"` on the named
  transaction, the subsets holding the changed rows reload first. On failure, every write of the transaction reverts.
- An insert in a transaction needs its key, such as a UUID made on the client, because the writes of one request cannot
  be matched to keys the server assigns.
- `db.transaction((tx) => ...)` without a name sends each write through its collection's `mutate`, in order. REST has no
  atomic batch, so when one write fails, the layers of the writes not yet sent are dropped, and the subsets holding rows
  already written refetch.
- Like every write, `db.transaction` resolves with `{ success, data, error }` and never rejects.

### Offline and persistence

- Collections can persist their server rows and loaded subsets, so an app starts with data. Restored rows show at once,
  but their subsets count as stale and refetch when online. A query whose restore found no rows waits for the network,
  up to a timeout, before it reports an empty result.
- Persisted data is stored under a scope, such as the user or tenant id, so one user's rows are never restored for
  another. `db.clear()` removes the rows, the loaded subsets and the outbox of the current scope, for example on
  sign-out, in every tab. Loads and writes in flight belong to the previous user: they resolve as failed, and their
  responses are never written.
- Pending writes are persisted as an **outbox** of plain transactions, such as
  `{ id, collection: "post", op: "update", key: 1, changes: { title: "B" } }`, not as requests. Requests hold functions
  that cannot be serialized.
- On restart, the optimistic layers are rebuilt from the outbox, so offline edits show at once. Each transaction is then
  replayed through the collection's `mutate` mapping, which rebuilds its request.
- Replay keeps the original order across the whole db, not per collection. A comment written offline may refer to a post
  written offline just before it.
- Every transaction has an id that `map` receives as an idempotency key. A transaction is marked as sent before its
  request goes out, and one marked sent is sent again after a restart, so without the key the server may apply it twice.
  The documentation presents sending the key as the default.
- Replay tells permanent failures from temporary ones. By default a 4xx response other than 408 and 429 is permanent,
  and `retryable(response)` overrides that.
  - A temporary failure keeps the transaction at its position and retries it with backoff. The transactions after it
    wait, because they may depend on it.
  - A permanent failure drops the transaction and its layer and emits an error event.
- A dropped transaction takes with it the later transactions on the same row, and those that name it in `dependsOn`. A
  comment written offline can name its post's insert, so a rejected post does not leave an orphan comment.
- Rows created offline need keys generated on the client, such as UUIDs. An insert that leaves the key to the server
  fails with an error while offline. Remapping temporary keys across queued transactions is out of scope.
- One tab, elected with Web Locks, replays the outbox and writes the persisted rows. Without Web Locks, each tab treats
  itself as the leader. Only the leader writes the shared outbox, so two tabs never write over each other's writes.
  Other tabs send their transactions and row writes to the leader over a `BroadcastChannel`, and learn each
  transaction's outcome there, with the key the server gave an insert, where they drop or keep their layers to match.
- A tab that becomes the leader adopts the outbox the previous leader persisted, so no write is lost when a tab closes,
  and asks the other tabs for the writes they still wait for. A tab destroyed while it waits for the lock never leads.
- An outbox this version cannot read, corrupt or of another format, is reported and never written over, because it
  may hold the only copy of writes another version of the app can replay.
- The outbox has its own storage and is the only place a pending write is kept. Requests replayed from it run with
  `offline: false`, so the dispatcher's offline queue never holds a second copy that would be sent again after a
  restart.
- Backends with their own offline writes, such as Firestore, skip the outbox.
- Persisted rows and the outbox are stored as type-tagged JSON, so `Date`, `bigint`, `Map`, `Set`, `NaN` and the
  infinities come back as they were. Values of other types need a codec in the db's `codecs` option. Restored rows are
  not validated again, because they were validated when they arrived.
- Persisted rows carry the db version, and a version change clears them, because the server holds a copy. The outbox has
  its own format version and is never cleared with them, because it holds the only copy of unsent writes. An entry whose
  collection or operation no longer exists is reported through an error event, never dropped silently.

### Server rendering

```tsx
// Server, per request
const db = createDb(collections);
await db.post.where((post) => eq(post.teamId, 1)).get();
const state = db.dehydrate();

// Client
const db = createDb(collections, { state });
<DbProvider db={db}>
  <App />
</DbProvider>;

// Component
const db = useDb<AppDb>(); // type AppDb = ReturnType<typeof createAppDb>
const { data } = useLiveQuery(db.post.where((post) => eq(post.teamId, 1)));
```

- A db in a module-level variable would share one user's rows with another user's render, so on the server a db is
  created per request. Collections are definitions, not instances, so the same definitions serve every request.
- Components read the db from `DbProvider` with `useDb()`. A client-only app may keep a module-level db.
- `query.get()` on the server loads a query before rendering. `db.dehydrate()` returns the server rows and the loaded
  subsets with their load times, as type-tagged JSON. Optimistic layers, the outbox and syncs are never included.
- `createDb(collections, { state })` hydrates them. Hydrated subsets answer queries at once, count as stale, refetch
  when they are mounted and open their syncs, so the first client render matches the server's.

### React

Hooks such as `useLiveQuery`, `useLiveInfiniteQuery` and `useDb` are exported from the main entry of
`@hyper-fetch/react`, the same way the socket hooks are, with `@hyper-fetch/db` as an optional peer dependency like
`@hyper-fetch/sockets`. Tree shaking removes them from apps that do not use them. The hooks expose state and actions
only, such as `fetchNextPage`.

### Devtools

`db.inspect()` describes what the db holds: each collection's rows, loaded subsets with their freshness and pending
layers, every live query with its `explain()` plan, and the outbox. `db.onChange()` tells when that changed. The
`DevtoolsPlugin` takes dbs in its `dbs` option and sends HyperFlow one snapshot per tick in which a db changed, and one
whenever HyperFlow connects. HyperFlow shows them on an application's DB page. The plugin reads dbs by their shape, so
it does not depend on `@hyper-fetch/db`.

### Adapters

Every backend fills in the same declarations, so the planner treats them alike:

| Declaration  | REST                        | GraphQL                     | Firestore                  |
| ------------ | --------------------------- | --------------------------- | -------------------------- |
| Identity     | `key` field                 | the key field               | the document id            |
| Filters sent | a few declared per endpoint | declared arguments          | almost all, within indexes |
| Rows         | one collection per shape    | one fragment per collection | the whole document         |
| Order, pages | declared                    | declared arguments          | native                     |
| Live updates | syncs on socket listeners   | syncs on subscriptions      | the loader, `onSnapshot`   |
| Writes       | `mutate` or `.resource()`   | mutations through `mutate`  | native, pending writes     |

- **Firestore:** `firestoreCollection(PostSchema, { client, socket, path, key })` from `@hyper-fetch/firebase` declares
  everything at once. Every operator maps to Firestore constraints, `onSnapshot` keeps every subset live through one
  `syncChanges` sync, a document is read by key with `getDoc` and kept live by a listener on that document, and writes
  go through `setDoc`, `updateDoc` and `deleteDoc`. Writes use Firestore's own pending writes and offline queue instead
  of an optimistic layer and the outbox. A query that falls inside a live subset is answered from its rows instead of
  opening another listener, because every listener is billed. Whether a composite index exists can only be checked at
  runtime, so a query that needs a missing index fails with Firestore's error, which names the index. Firestore is
  schemaless, so Firestore collections validate every incoming document.
- **GraphQL:** a collection's row is a fragment. Every document a loader uses spreads that fragment, so its rows are
  complete, and the field set comes from the fragment's type. The db never writes selection sets. Arguments are mapped
  like REST filters, a document that returns several types fills their collections with `normalize`, and
  `relayConnection()` unwraps the rows and cursors of Relay connections (`edges` / `node`).
- **`firebase-admin`:** out of scope, because a server has no live views.

### Deferred

- **Realtime Database.** It fits with weaker queries, one `orderBy` and one filter, so more conditions would run on the
  client over a broader loaded subset. No preset ships yet.
- **Joins on conditions other than equality,** and right or full joins.
- **Aggregates,** such as counts and sums over a query.

## Consequences

### Positive

- There is one source of truth per resource shape. Queries read collections, and nothing else serves the same data.
- A mutation, socket event or Firestore snapshot writes one row, and every query that shows it updates. Nobody patches
  responses or invalidates keys by hand.
- A new row joins every loaded list whose filters it matches, at its sorted position, without refetching the lists.
- A slow response cannot overwrite newer data, and a reconnect refetches only what its socket covered.
- Rows are complete, so a query can use any field of its collection and its types never claim a missing field.
- Components never name endpoints. Changing an endpoint, or the backend, changes the collection and not the components.
- A REST resource from the SDK, or a Firestore collection, needs almost no configuration.

### Negative

- HyperFetch gets a second way to work with data next to `useFetch`. The db pays off when the same data shows in several
  views, changes from several places such as mutations, sockets and other users, or has to work offline. For screens
  that each show their own data, `useFetch` is simpler, and the documentation has to say so. A request used by both
  keeps two copies of its data, one in the Cache and one in a collection, and they do not update each other.
- A list that returns summaries needs its own collection, so the same post lives in two collections. Syncs, ingested
  responses and a link keep both current, but the two collections still load separately.
- The planner picks the loader, so adding a loader can change which one serves an existing query. The plan is
  deterministic and `explain()` shows it, but it is not visible in the component's code.
- Without `version`, write ordering relies on syncs delivering every event. A missed event can leave a field stale until
  the next refetch, so `version` is recommended for every collection with syncs.
- Answering locally relies on the client comparing values like the server. Fields that compare differently have to be
  marked `serverOnly`, and a missing mark returns wrong rows without a request to correct them.
- The type layer is the biggest risk. Inferred resource filters and query checks can slow `tsc`, so a type benchmark
  with a budget runs in CI.
- The planner and the incremental query engine are a large piece of work. The first version keeps them to filtering,
  sorting and joins, and aggregates come later.
- Offline replay adds new failure modes: a change rejected long after the user made it, a tab closed during replay, and
  the persisted format changing between versions.

## Rejected alternatives

- **Normalizing the core Cache with a read API for entities.** It created two sources of truth with separate freshness.
- **Queries that name an endpoint** (`db.post.$list`). Rows typed by their endpoint forced every query to name one, and
  reads gained little over `useFetch`.
- **Partial rows,** with freshness per field and missing fields loaded on demand. A detail opened from a list could show
  the list's fields at once in one query, but the types needed a pending state for each field, and the runtime had to
  track the source and age of every field. Two collections and two queries give the same screen with plain types.
- **A translation function written per collection,** as TanStack DB's `queryFn` does. Every collection would repeat the
  planning by hand, and the types could not tell which queries a collection can serve.
- **Introspecting Zod, Valibot or ArkType schemas** to find relations. Each library would need its own code, and that
  code would break on their major releases.
- **Relations declared with strings.** They did not break when a collection was renamed or removed.
- **Error messages encoded as types.** They are slower to compile and add nothing to correctness.
- **Persisting requests for offline replay.** Requests hold functions that cannot be serialized.
- **Merging nested objects field by field.** It mixes the fields of two different objects when the nested object is
  replaced.
- **Hooks under a `@hyper-fetch/react/db` subpath.** The socket hooks already ship from the main entry with an optional
  peer dependency, and tree shaking covers apps that do not use them.
- **`from({ post: collection })` with aliased callbacks.** It adds a wrapper and an alias to every query for the sake of
  joins, which most queries do not have.
- **Joins on any equality condition** (`join({ author: db.user }, (post, author) => eq(post.authorId, author.id))`). Its
  types cannot check the two fields against each other, and the db could not tell which loader loads the joined rows. A
  join names the field that holds the key, and `on` names the joined field.
- **Sets of loaded ranges per paginated subset.** Recording which ranges are loaded would let a refetch reload one page,
  but cursors are opaque, so the db cannot tell where a page starts after rows move. A prefix from the first page is
  what cursor and offset APIs both serve.
- **Dropping subset containment,** as TanStack DB did. Answering narrower queries from a fresh subset is what makes
  navigation instant and saves Firestore listeners, and checking containment on the expression keeps it sound.
- **Ambient transactions** (`createTransaction` and `tx.mutate(callback)` capturing writes made inside it). A callback
  that receives `tx` makes the writes that belong to the transaction visible in the code and in the types.
- **Backend notation inside the operators.** A query could then run against one backend only, and the client could not
  evaluate the same condition on its rows.
- **A dependency array on `useLiveQuery`.** A query is data, so its structure identifies it, and a forgotten dependency
  cannot leave a stale query on screen.

## Plan

Status of the plan: every phase is implemented. `packages/db` holds the db, with `.resource()`, `relayConnection()`,
links, `normalize` and joins, `useLiveQuery` ships from `@hyper-fetch/react`, and `firestoreCollection` from
`@hyper-fetch/firebase`, tested against the Firestore emulator. Unit, integration and end-to-end specs cover every
statement and branch of `packages/db`. GraphQL documents work as loaders with their arguments mapped like REST filters.
A benchmark of one update over 10,000 rows and 1,000 live queries took 0.3 ms at the median. Not built: a Realtime
Database preset (see Deferred).

A review against TanStack DB on 2026-11-21 added phase 8, which is implemented too, with test cases ported from TanStack
DB's suites. Porting them found weak spots, each fixed with its spec: a refetch of a paginated list reloaded only its
first page and kept deleted rows, `NaN` sorted inconsistently, a row deleted and inserted again within one millisecond
stayed deleted, a confirmed insert the server no longer returned stayed in its list, a server-only operator no loader
declared compiled, an insert of a key the db holds and an update of a key were sent, a document read by key opened a
Firestore listener on the whole collection, and a query read before it was subscribed showed `loading` even when a
loaded subset held its rows.

An audit on 2026-11-22 compared the db with the test suites of Apollo Client, urql Graphcache, Relay, Replicache,
RxDB, Dexie, PowerSync and Electric, and added model tests that check live queries, races and infinite lists against a
naive oracle over hundreds of fixed seeds. It fixed: tabs that wrote over each other's outbox, a new leader that lost
the previous leader's writes, a destroyed tab that could lead, sign-out that let responses of the previous user back
and did not reach other tabs, a mapping or `mutationFn` that threw and left loads or the outbox pending for good, two
writes to one row deadlocking when the first refetched, `dependsOn` ignored for writes sent without the outbox, a write
dropped because an earlier write to its row had failed, an infinite query looping after its next page was asked, a
linked store crashing during a pending delete, tombstones and equal versions that let older data win, a reload that
dropped rows written after it was sent, a refetch lost during a next page, temporary keys ignored after the swap, a
keyless insert with a non-row response kept under its temporary key, re-renders when only unselected fields changed,
`undefined` clearing fields, a throwing listener stopping the others, rows changed in place, queries kept forever,
timers left after `destroy`, hydrated rows hidden while persistence restored, and query keys that confused `NaN`,
`null` and `bigint`.

1. **Type spike.** Collections, complete rows through `rows`, `.resource()` with filters inferred from SDK types, query
   results, the required filter and pagination rules, `local()`, syncs, ingests and `mutate`, written as a strictness
   suite with an `@ts-expect-error` case and an `expectTypeOf` check for every rule. Measure compile time with
   `tsc --extendedDiagnostics`. If the types do not hold, revise this record before going further.
2. **Core runtime.** REST loaders and syncs, the planner with local answers and loader choice, `explain()`, freshness
   per subset, per-field ordering, optimistic layers, garbage collection and `useLiveQuery`.
3. **Offline.** Persisted rows and subsets under a scope, the outbox with failure classes and `dependsOn`, and replay by
   an elected tab.
4. **Firestore.** `firestoreCollection`, query translation, pending writes and subset containment.
5. **GraphQL.** Fragment collections, document loaders and connections.
6. **Linked collections and normalizing on ingest.**
7. **Joins.**
8. **Second round.** Refetching every loaded page, infinite queries and `useLiveInfiniteQuery`, rows loaded by key in
   scoped syncs, type-tagged persistence, transactions, inner and one-to-many joins, server-only operators, server
   rendering with `DbProvider`, devtools events, a type benchmark, and test cases ported from TanStack DB's suites.

## Performance target

Measure with a benchmark before the first release. Targets to confirm: with 10,000 rows in a collection and 1,000 live
queries mounted, one socket update to a row that 10 of those queries show updates all 10 in under 1 ms. A query answered
locally returns its first result in the same frame it mounts. Type-checking the db's type suite stays under a budget
that CI enforces.

## Open questions

- **Misleading names in `.resource()`.** A query param named like a row field may not filter by that field. Inference
  needs a way to turn it off per param, and the spike checks how often names mislead in real APIs.
- **Typing the default notation.** A db-wide mapping such as `${field}_gt` has to be checked against each request's
  query params type. The spike decides whether template literal types are enough, or whether each loader has to confirm
  the mapping.
- **Final API names:** `collection`, `createDb`, `load`, `resource`, `sync`, `syncChanges`, `ingest`, `normalize`,
  `mutate`, `links`, `join`, `findOne`, `local`, `explain`, `fixed`, `serverOnly`, `dependsOn`, `transaction`, `op`,
  `infinite`, `dehydrate`, `useLiveQuery`, `useLiveInfiniteQuery`, `useDb`, `DbProvider` and the operator names.

## References

- [Apollo Client caching](https://www.apollographql.com/docs/react/caching/overview)
- [TanStack DB](https://tanstack.com/db/latest/docs/overview)
- [Standard Schema](https://standardschema.dev)
