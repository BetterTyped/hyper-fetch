# Optimistic updates

Core implements optimistic updates for every way of sending (plain `send()`, hooks, SDK). You describe changes of cached
**target** requests; core applies them before the mutation is sent and settles them when it finishes.

## Describe the change

```ts
import { createClient, optimistic } from "@hyper-fetch/core";

type Todo = { id: number; title: string; done: boolean; likes: number };
type Feed = { cursor: string | null; items: Todo[]; total: number };

const client = createClient({ url: "https://api.example.com" });
const getTodos = client.createRequest<{ response: Todo[] }>()({ endpoint: "/todos" });
const getTodo = client.createRequest<{ response: Todo }>()({ endpoint: "/todos/:todoId" });
const getFeed = client.createRequest<{ response: Feed; queryParams?: { cursor?: string } }>()({ endpoint: "/feed" });

const toggleTodo = client
  .createRequest<{ response: Todo; payload: { done: boolean } }>()({ endpoint: "/todos/:todoId", method: "PATCH" })
  .setOptimistic(({ params, payload }) => [
    optimistic(getTodos).patch(params.todoId, payload), // list entry
    optimistic(getTodo.setParams({ todoId: params.todoId })).set((todo) => ({ ...todo, ...payload })), // detail entry
    optimistic.all(getFeed).list("items").patch(params.todoId, payload), // every cached feed page/filter
  ]);

await toggleTodo.send({ params: { todoId: 1 }, payload: { done: true } });
```

Targets:

- `optimistic(request)` - the entry of that exact request (its params and query params). A target with endpoint params
  must have them set (`setParams`), the types reject it otherwise.
- `optimistic.all(request)` - every cached variant with the same method and endpoint, whatever the query params
  (filters, pagination, infinite pages). With a custom `cacheKey`, entries whose key starts with it.

Helpers (all immutable, typed by the target's data):

| Data   | Helpers                                                                                                                   |
| ------ | ------------------------------------------------------------------------------------------------------------------------- |
| any    | `set(updater)` replaces the data                                                                                          |
| array  | `patch(match, fields)`, `insert(item, { at: "start" \| "end" \| index })`, `remove(match)`, `increment(match, field, by)` |
| object | `increment(field, by)`, `list("arrayField")` then the array helpers                                                       |

`match` is a predicate or a value compared with the item's `id` (or `{ key: "slug" }`); `"1"` matches `1` like route
params. Entries that are not cached yet are skipped: nothing to change, nothing to revert.

## Settlement

- **Success**: each operation's `.commit()` runs, `invalidate` targets of the object form are invalidated, and every
  target is refreshed (invalidated) once the last pending mutation on it settles, so server data replaces the guess.
- **Final failure, abort, or removal from the queue**: each operation's `.rollback()` runs in reverse order, then the
  object form's `rollback`; targets are refreshed. Retries and offline waiting do not settle: the change stays while the
  request will still be sent.
- Without `.rollback()` nothing is undone locally; the refresh restores server data.
- While a mutation on a key is pending, fetch responses for that key are not written to the cache (they could be older
  than the change); fetches started before settlement are treated as stale and the key is refreshed afterwards.
- Throwing helpers, commits or rollbacks are logged and rethrown outside the lifecycle; the request still settles and
  the affected key is refreshed. `.commit()` and `.rollback()` must be synchronous.

```ts
const addTodo = client
  .createRequest<{ response: Todo; payload: { title: string } }>()({ endpoint: "/todos", method: "POST" })
  .setOptimistic(({ payload, optimistic: typed }) => ({
    updates: [
      typed(getTodos)
        .insert({ id: -1, title: payload.title, done: false, likes: 0 }, { at: "start" })
        // `typed` is the same builder, typed with this mutation's response for commit/rollback
        .commit(({ data, response }) => data.map((todo) => (todo.id === -1 ? response.data : todo)))
        .rollback(({ data }) => data.filter((todo) => todo.id !== -1)),
    ],
    context: { tempId: -1 }, // available as `mutationContext` in send callbacks and hooks
    rollbackOnError: ({ response }) => response.status !== 409, // keep the change on conflicts
    revalidate: true, // refresh targets after settling (default)
    invalidate: [getFeed], // extra invalidation on success
  }));
```

Object form fields: `updates`, `context`, `rollback({ reason, response, request })` (runs once, also for hand-written
cache edits), `invalidate`, `rollbackOnError` (boolean or predicate, applies to final errors only; aborts and removals
always roll back), `revalidate`.

## Per call

```ts
await getTodos.send({ optimistic: [optimistic(getTodos).set((todos) => todos.slice(1))] });
await toggleTodo.send({
  params: { todoId: 2 },
  payload: { done: false },
  optimistic: ({ params }) => [optimistic(getTodos).remove(params.todoId)], // replaces the request's own callback
});
```

## Tips

- Prefer `optimistic()` over `client.cache.update` for mutations: it handles races, rollback and refresh.
- Target the entries the UI actually shows; `optimistic.all` for lists with filters or pages.
- Keep updates cheap; they run synchronously inside `send()` when the callback is synchronous.
- React hooks surface `mutationContext` and the same rollback rules; see `hyper-fetch-react`.
