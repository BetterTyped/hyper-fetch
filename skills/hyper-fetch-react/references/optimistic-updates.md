# Optimistic updates

Optimistic changes are declared on the mutation request (core), not in components. Core applies them before the request
is sent, runs `.commit()` on success or `.rollback()` on failure, protects them from stale fetch responses and refreshes
the targets afterwards, even when the submitting component has unmounted. `useFetch` hooks reading the targets just
re-render. API: `request.setOptimistic(callback)` and `optimistic` from `@hyper-fetch/core`.

## Basic: patch an item in a list

```ts
import { optimistic } from "@hyper-fetch/core";

export const getTodos = client.createRequest<{ response: Todo[] }>()({ endpoint: "/todos" });

export const toggleTodo = client
  .createRequest<{ response: Todo; payload: { completed: boolean } }>()({
    endpoint: "/todos/:todoId",
    method: "PATCH",
  })
  .setOptimistic(({ params, payload }) => [
    optimistic(getTodos)
      .patch(params.todoId, payload)
      .rollback(({ data, previous }) => {
        const before = previous.find((todo) => todo.id === Number(params.todoId));
        return data.map((todo) => (todo.id === Number(params.todoId) && before ? before : todo));
      }),
  ]);
```

```tsx
function TodoList() {
  const { data: todos } = useFetch(getTodos);
  const { submit } = useSubmit(toggleTodo);

  return todos?.map((todo) => (
    <Checkbox
      key={todo.id}
      checked={todo.completed}
      onChange={() => submit({ params: { todoId: todo.id }, payload: { completed: !todo.completed } })}
    />
  ));
}
```

A synchronous `setOptimistic` callback changes the cache inside the `submit()` call, so the list re-renders in the same
tick. The callback receives `{ request, client, payload, params, queryParams, optimistic }`.

## Helpers

`optimistic(target)` returns a builder typed by the target's response:

| Helper                                                 | Use                                                     |
| ------------------------------------------------------ | ------------------------------------------------------- |
| `set(updater)`                                         | Any change: `(data) => newData`                         |
| `patch(match, fields)`                                 | Merge fields into matching list items                   |
| `insert(item, { at })`                                 | Add an item at `"end"` (default), `"start"` or an index |
| `remove(match)`                                        | Remove matching items                                   |
| `increment(field, by)` / `increment(match, field, by)` | Counter on an object, or on matching list items         |
| `.list("field")`                                       | List helpers for an array inside an object response     |

- `match` is a predicate or a plain value compared with the item's `id`. Numbers and strings match each other, so a
  route param `"1"` matches id `1`. Other field: `remove(params.slug, { key: "slug" })`.
- Targets: `optimistic(getUser.setParams({ userId }))` - one entry (a target with unset params is a compile error).
  `optimistic.all(getTodos)` - every cached variant whatever the query params: all filters and every page of an infinite
  list.
- A target with no cached data is skipped (its rollback does not run) but is still refreshed.

## Rollback and commit

`.rollback(({ data, previous, reason, response, request }) => next)`:

- `data` - the target now (after other mutations); `previous` - the target just before this change. Build the result
  from `data`, look old values up in `previous`. Returning `previous` whole would wipe concurrent changes.
- `reason` - `"error"`, `"abort"` or `"removed"` (from the queue; `abort()` from `useSubmit` removes the request, so it
  reports `"removed"`).
- Return the new data; return nothing to leave it. Must be synchronous.
- No `.rollback()` at all: nothing is undone locally, the refresh restores server data.

`.commit(({ data, response, request }) => next)` runs on success, before the refresh. Use the `optimistic` builder
passed to the callback so `response` is typed with the mutation's response:

```ts
export const createTodo = client
  .createRequest<{ response: Todo; payload: { title: string } }>()({ endpoint: "/todos", method: "POST" })
  .setOptimistic(({ payload, optimistic: typed }) => {
    const temp: Todo = { id: -Date.now(), title: payload.title, completed: false };
    return [
      typed(getTodos)
        .insert(temp, { at: "start" })
        .commit(({ data, response }) => data.map((todo) => (todo.id === temp.id ? response.data : todo)))
        .rollback(({ data }) => data.filter((todo) => todo.id !== temp.id)),
    ];
  });
```

## Object form: context, side effects, options

```ts
export const updateUser = client
  .createRequest<{ response: User; payload: Partial<User> }>()({ endpoint: "/users/:userId", method: "PATCH" })
  .setOptimistic(({ params, payload }) => ({
    updates: [optimistic(getUsers).patch(params.userId, payload)],
    context: { userId: params.userId },
    rollback: ({ reason }) => toast(`Not saved (${reason})`),
    invalidate: [getUserStats],
    rollbackOnError: ({ response }) => response.status !== 409,
    revalidate: true,
  }));
```

| Field             | Default | Meaning                                                                                      |
| ----------------- | ------- | -------------------------------------------------------------------------------------------- |
| `updates`         | -       | Operations built with `optimistic()`, applied in order, reverted in reverse order            |
| `context`         | -       | Delivered, typed, as `mutationContext` to every submit callback                              |
| `rollback`        | -       | Hand-written undo for anything outside the cache; runs after the helpers' rollbacks          |
| `invalidate`      | -       | Requests invalidated on success (targets of `updates` are refreshed anyway)                  |
| `rollbackOnError` | `true`  | `false` or a predicate keeps the change on a final error (aborts and removals always revert) |
| `revalidate`      | `true`  | Refresh the `updates` targets after the last pending mutation on them settles                |

```tsx
const { onSubmitSuccess, onSubmitError } = useSubmit(updateUser);
onSubmitSuccess(({ mutationContext }) => track("user-updated", mutationContext?.userId));
onSubmitError(() => toast("Changes reverted")); // rollback already ran
```

The older hand-written form (`client.cache.update` in the callback plus `{ context, rollback, invalidate }`) still
works; prefer helpers.

## Hook and per-call overrides

```tsx
// Every submit of this hook - replaces the request's own setOptimistic
const { submit } = useSubmit(toggleTodo, {
  optimistic: ({ params, payload }) => [optimistic(getTodos).patch(params.todoId, payload)],
});

// One call - wins over the hook option
submit({ params: { todoId }, payload, optimistic: [optimistic(getTodos).patch(todoId, payload)] });
```

`request.send({ optimistic })` works the same outside React.

## When things settle

| Outcome                              | What happens                        | Then              |
| ------------------------------------ | ----------------------------------- | ----------------- |
| Success                              | `.commit()`s run, `invalidate` runs | Targets refreshed |
| Final error                          | `.rollback()`s run in reverse order | Targets refreshed |
| Final error, `rollbackOnError` false | Change stays                        | Nothing           |
| Abort or removed from the queue      | `.rollback()`s run                  | Targets refreshed |
| Will retry, or waiting offline       | Change stays                        | Nothing yet       |

- Order on failure: rollback -> `onSubmitError` -> `onSubmitFinished`. On success: invalidate -> `onSubmitSuccess` ->
  `onSubmitFinished`.
- The optimistic callback runs once per request, before the first attempt (not per retry). With `bounce`, it runs when
  the bounced request is actually sent. A disabled hook never runs it.
- An async optimistic callback delays sending until it resolves; if it rejects or throws, nothing is sent and `submit()`
  resolves with an error response.
- While a mutation on a key is pending, fetch responses that started before it settled (manual `refetch`, focus refetch,
  polling) are discarded, so they never overwrite the optimistic value. Manual `cache.set` / `cache.update` always
  apply.
- With several mutations pending on one key, the key is refreshed once, after the last settles.
- Throwing helpers, commits or rollbacks never break the request; other changes still settle and the target is
  refreshed.
- StrictMode applies and rolls back exactly once.

## Patterns

| Scenario            | Rollback                                        |
| ------------------- | ----------------------------------------------- |
| One item in a list  | Restore that item from `previous`, by id        |
| Toggle              | Write the opposite value                        |
| Create              | Filter the temp id out; swap it in `.commit()`  |
| Delete              | Re-add the item from `previous`                 |
| Counter             | Opposite `increment`                            |
| Batch               | Restore the matched items from `previous`       |
| Every filter / page | `optimistic.all(getTodos)`                      |
| Several caches      | Return one operation per target                 |
| Hard to undo        | No `.rollback()`; the refresh restores the data |

```ts
// Delete with re-insert, plus a counter in another cache entry
export const deleteTodo = client
  .createRequest<{ response: null }>()({ endpoint: "/todos/:todoId", method: "DELETE" })
  .setOptimistic(({ params }) => [
    optimistic
      .all(getTodos)
      .remove(params.todoId)
      .rollback(({ data, previous }) => {
        const removed = previous.find((todo) => todo.id === Number(params.todoId));
        return removed ? [...data, removed] : data;
      }),
    optimistic(getStats)
      .increment("total", -1)
      .rollback(({ data }) => ({ ...data, total: data.total + 1 })),
  ]);
```

Docs: https://hyperfetch.bettertyped.com/docs/guides/react/basics/optimistic-approach,
https://hyperfetch.bettertyped.com/docs/guides/react/basics/optimistic-advanced
