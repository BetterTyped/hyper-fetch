# Type safety with @hyper-fetch/react

The hooks have no type parameters you need to pass. Every type comes from the request: declare `response`, `payload`,
`queryParams` and `error` once in `createRequest`, the endpoint string gives the params, and `useFetch`, `useSubmit`,
`useInfiniteFetch`, `useCache`, callbacks, `submit()`, optimistic helpers and hydration items are all derived from it.
All examples below were type-checked against the built packages; every `@ts-expect-error` line is a real rejection.

## Where the types come from

```ts
import { Client } from "@hyper-fetch/core";

type ApiError = { code: string; message: string };
type User = { id: number; name: string };

// Global error type: replaces the default `Error` in every request's error union
export const client = new Client<ApiError>({ url: "https://api.example.com" });

export const getUsers = client.createRequest<{ response: User[]; queryParams: { search?: string; page?: number } }>()({
  endpoint: "/users",
});
// Local error type is added to the global one: error is `{ field: string } | ApiError`
export const getUser = client.createRequest<{ response: User; error: { field: string } }>()({
  endpoint: "/users/:userId",
});
export const renameUser = client.createRequest<{ response: User; payload: { name: string } }>()({
  endpoint: "/users/:userId",
  method: "PATCH",
});
```

- `createRequest<Generics>()(config)` is curried on purpose: the second call infers the endpoint literal, which types
  `params` (`"/users/:userId"` -> `{ userId: string | number }`).
- Without generics, `response` is `undefined`, so `data` is typed `undefined | null` and every use needs a cast. Always
  declare `response`.
- With `new Client({ url })` (no generic) the global error is `Error`.

## What the hooks infer

| Value                                   | Type                                                                                 |
| --------------------------------------- | ------------------------------------------------------------------------------------ |
| `useFetch(r).data`                      | `ExtractResponseType<R> \| null` (or `TSelected \| null` with select)                |
| `useFetch(r).error`                     | `ExtractErrorType<R> \| null` (global error \| local error)                          |
| `status` / `extra`                      | Adapter types (`number \| null`, headers for HTTP)                                   |
| `loading`, `success` / `submitting`     | `boolean`                                                                            |
| `responseTimestamp`, `requestTimestamp` | `Date \| null` in hooks (`number` in raw responses)                                  |
| `setData`                               | `(data \| null \| (prev) => data \| null)` of the (selected) type                    |
| `onSuccess(({ response }))`             | `response.data: Response`, `response.error: null`, `success: true`                   |
| `onError(({ response }))`               | `response.data: null`, `response.error: Error union`, `success: false`               |
| `onFinished(({ response, details }))`   | `data: Response \| null`, `error: Error union \| null`, `details.willRetry: boolean` |
| `mutationContext` in submit callbacks   | `context` returned by `setOptimistic`, `\| undefined`; `undefined` without it        |
| `submit` / `send`                       | `RequestSendType<R>`: required `payload` / `params` / `queryParams` enforced         |
| `await submit()`                        | `{ data: Response \| null; error: Error union \| null; success: boolean; ... }`      |

```tsx
function UserCard({ userId }: { userId: number }) {
  const { data, error, onSuccess, onError } = useFetch(getUser.setParams({ userId }));
  // data: User | null, error: { field: string } | ApiError | null

  onSuccess(({ response }) => {
    const user: User = response.data; // narrowed: never null inside onSuccess
  });
  onError(({ response }) => {
    if ("code" in response.error) report(response.error.code); // narrow the error union by shape
  });

  return <h2>{data?.name}</h2>;
}
```

`data` is always nullable in the hook (no response yet, error responses, disabled). Handle `null` instead of casting.

## Params, query params and payload

The request types reject wrong values at the place where you set them:

```ts
// @ts-expect-error - the endpoint param is userId
getUser.setParams({ id: 1 });
// @ts-expect-error - search is a string
getUsers.setQueryParams({ search: 1 });
```

`useFetch` and `useInfiniteFetch` do **not** check that params are set: `useFetch(getUser)` compiles and sends
`/users/:userId`. Always pass a request with its endpoint params set (`getUser.setParams({ userId })`); for dependent
requests use a placeholder plus `disabled` (see `use-fetch.md`).

`submit()` has the same signature as `request.send()` and enforces whatever the request still misses:

```tsx
const { submit } = useSubmit(renameUser);

// @ts-expect-error - params and payload are required
submit();
// @ts-expect-error - params are required
submit({ payload: { name: "Ann" } });
// @ts-expect-error - name has to be a string
submit({ params: { userId: 1 }, payload: { name: 1 } });
submit({ params: { userId: 1 }, payload: { name: "Ann" } });

// Values already set on the request are no longer required
const { submit: rename } = useSubmit(renameUser.setParams({ userId: 1 }));
rename({ payload: { name: "Ann" } });
```

- A request that declares `queryParams` requires them in `send()` / `submit()` even when every field is optional, until
  they are set with `setQueryParams(...)`: `getUsers.send()` is a type error, `getUsers.setQueryParams({}).send()` or
  `getUsers.send({ queryParams: {} })` is fine.
- Requests with nothing to send (`submit()` on a POST without payload, params or query params) accept no arguments.

## The submit result is not a discriminated union

```tsx
const response = await submit({ params: { userId: 1 }, payload: { name: "Ann" } });

if (response.success) {
  // @ts-expect-error - data is still User | null after checking success
  const user: User = response.data;
}
if (response.data) {
  const user: User = response.data; // narrow on the value itself
}
```

The callbacks (`onSuccess`, `onSubmitSuccess`, `onError`, ...) receive narrowed success / error types; the awaited
response (and `send()`) does not. Narrow on `response.data` / `response.error`.

## initialResponse and setData

```ts
const cachedUsers: User[] = [];

useFetch(getUsers, { initialResponse: { data: cachedUsers } });
// @ts-expect-error - initialResponse is a partial response, not raw data
useFetch(getUsers, { initialResponse: cachedUsers });
```

`initialResponse` is `Partial<ResponseType>` of the request: `{ data }`, `{ error }`, `{ status }`, typed with the
response and error types. `setData` takes the response type (or the selected type with `select`):

```ts
const { setData } = useFetch(getUsers);
setData((previous) => (previous ? [...previous, { id: 2, name: "Ann" }] : previous));
// @ts-expect-error - id has to be a number and name is missing
setData([{ id: "1" }]);
```

## select changes the data type

```tsx
const { data, setData } = useFetch(getUsers, { select: (users) => users.map((user) => user.name) });
// data: string[] | null, setData accepts string[]
```

The selector argument is the full response type. Callbacks and the `submit()` result keep the full response.
`throwOnError: (error) => boolean` receives the request's error union.

## Optimistic updates

```ts
import { optimistic } from "@hyper-fetch/core";
import type { ExtractMutationContextType } from "@hyper-fetch/core";

export const toggleTodo = client
  .createRequest<{ response: Todo; payload: { completed: boolean } }>()({ endpoint: "/todos/:todoId", method: "PATCH" })
  .setOptimistic(({ params, payload }) => ({
    context: { todoId: params.todoId }, // becomes the typed mutationContext
    updates: [
      optimistic(getTodos)
        .patch(params.todoId, payload) // fields checked against Todo
        .rollback(({ data, previous }) => {
          // data and previous: Todo[]
          const before = previous.find((todo) => todo.id === Number(params.todoId));
          return data.map((todo) => (todo.id === Number(params.todoId) && before ? before : todo));
        }),
    ],
  }));

type Ctx = ExtractMutationContextType<typeof toggleTodo>; // { todoId: string | number }

const { onSubmitSuccess } = useSubmit(toggleTodo);
onSubmitSuccess(({ mutationContext }) => track(mutationContext?.todoId));
```

- The callback args (`params`, `payload`, `queryParams`) are typed by the mutation; helper arguments by the target's
  response.
- `.commit(({ response }))` is typed by the mutation's response only with the `optimistic` builder passed to the
  callback:

```ts
.setOptimistic(({ payload, optimistic: typed }) => {
  const temp: Todo = { id: -1, title: payload.title, completed: false };
  return [
    typed(getTodos)
      .insert(temp, { at: "start" })
      .commit(({ data, response }) => data.map((todo) => (todo.id === temp.id ? response.data : todo))),
  ];
})
```

- Rejected at compile time:

```ts
renameUser.setOptimistic(() => [
  // @ts-expect-error - a target with endpoint params needs setParams()
  optimistic(getUser).set((user) => user),
]);
renameUser.setOptimistic(() => [
  // @ts-expect-error - nope is not a field of Todo
  optimistic(getTodos).patch(1, { nope: true }),
]);
```

- Without `setOptimistic`, `mutationContext` is typed `undefined`.

## useInfiniteFetch

`items` is inferred from the response and `pagination.items`; every pagination key is checked against the request.

```ts
import type { Pagination } from "@hyper-fetch/core";

const getFeed = client.createRequest<{
  response: { data: Todo[]; nextCursor: string | null };
  queryParams: { cursor?: string };
}>()({ endpoint: "/feed" });

export const feedPagination = { cursor: "cursor", next: "nextCursor", items: "data" } satisfies Pagination<
  typeof getFeed
>;

const { items, pages } = useInfiniteFetch(getFeed, { pagination: feedPagination });
// items: Todo[], pages: { data: Todo[]; nextCursor: string | null }[], pageParams: unknown[], total: number | null

// @ts-expect-error - nope is not a response field
useInfiniteFetch(getFeed, { pagination: { cursor: "cursor", next: "nope", items: "data" } });
// @ts-expect-error - pagination is required
useInfiniteFetch(getUsers, {});
```

Also rejected: a `page` / `limit` / `offset` field that is not numeric, `offset` without `limit`, `cursor` without
`next`, missing `items` for a non-array response, a non-array `items` field, a non-number `total`, mixed modes, and a
`uniqueBy` key that is not an item field. `items: ({ data }) => ...` and `select: ({ items, pages }) => ...` change the
item type. Use `satisfies Pagination<typeof request>` (not a type annotation) for reusable descriptions, so the literal
keys keep driving the item type.

## Reusable hooks and components

Constrain a generic to `RequestInstance` and derive everything else with the extractors from `@hyper-fetch/core`
(`ExtractResponseType`, `ExtractErrorType`, `ExtractPayloadType`, `ExtractParamsType`, `ExtractQueryParamsType`,
`ExtractMutationContextType`, `ExtractAdapterResolvedType`). Never widen the parameter to `RequestInstance` without a
generic.

```tsx
import type { RequestInstance, ExtractResponseType, ExtractErrorType } from "@hyper-fetch/core";
import type { UseFetchOptionsType, UseFetchReturnType } from "@hyper-fetch/react";

// Pass-through hook: inference intact, options typed for the given request
export function useResource<R extends RequestInstance>(request: R, options?: UseFetchOptionsType<R>) {
  return useFetch(request, options);
}

// Keep select support by forwarding the selected type too
export function useSelectable<R extends RequestInstance, TSelected = ExtractResponseType<R>>(
  request: R,
  options?: UseFetchOptionsType<R, TSelected>,
): UseFetchReturnType<R, TSelected> {
  return useFetch(request, options);
}

const { data: count } = useSelectable(getUsers, { select: (users) => users.length }); // number | null
```

```tsx
// Generic component: the render prop gets the request's response type
type DataViewProps<R extends RequestInstance> = {
  request: R;
  children: (data: ExtractResponseType<R>) => ReactNode;
  renderError?: (error: ExtractErrorType<R>) => ReactNode;
};

export function DataView<R extends RequestInstance>({ request, children, renderError }: DataViewProps<R>) {
  const { data, error, loading } = useFetch(request);
  if (error && renderError) return <>{renderError(error)}</>;
  if (loading || data === null) return <Spinner />;
  return <>{children(data)}</>;
}

<DataView request={getUsers}>{(users) => users.map((user) => <p key={user.id}>{user.name}</p>)}</DataView>;
```

```tsx
// Generic list: let the caller map the response to items instead of casting inside
type ListProps<R extends RequestInstance, Item> = {
  request: R;
  getItems: (data: ExtractResponseType<R>) => Item[];
  renderItem: (item: Item) => ReactNode;
};

export function List<R extends RequestInstance, Item>({ request, getItems, renderItem }: ListProps<R, Item>) {
  const { data } = useFetch(request, { select: getItems });
  return <>{data?.map(renderItem)}</>;
}

<List request={getUsers} getItems={(users) => users} renderItem={(user) => <p key={user.id}>{user.name}</p>} />;
```

Other useful types exported by `@hyper-fetch/react`: `UseSubmitOptionsType`, `UseSubmitReturnType`,
`UseCacheOptionsType`, `UseCacheReturnType`, `UseInfiniteFetchOptionsType`, `UseInfiniteFetchReturnType`,
`UseQueueOptionsType`, `HydrateProps`, `ProviderOptionsType`.

### Helpers that wrap requests

```ts
// Wrong: the parameter type erases the request - data becomes `any` in every hook using it
const withTraceBad = (request: RequestInstance) => request.setHeaders({ "x-trace": "1" });

// Right: keep the generic
const withTrace = <R extends RequestInstance>(request: R): R => request.setHeaders({ "x-trace": "1" }) as R;
```

Prefer configuring headers, auth and mappers on the `Client` or on the request definition over helper wrappers.

## Hydration payloads

```tsx
import type { HydrateDataType, ExtractResponseType, ExtractErrorType } from "@hyper-fetch/core";
import type { HydrateProps } from "@hyper-fetch/react";

// Props crossing the server/client boundary
type UsersPageProps = { hydration: HydrateProps["data"] };

// A typed item, if you store or build them yourself
type UsersItem = HydrateDataType<ExtractResponseType<typeof getUsers>, ExtractErrorType<typeof getUsers>>;
```

`request.dehydrate({ response })` returns `HydrateDataType<Response, Error, Adapter> | undefined`, and
`HydrateProps["data"]` accepts `undefined` / `null` entries, so `[user && getUser.dehydrate({ response: user })]` needs
no non-null assertion. The hydrated value is typed again by the hook that reads it; keep the dehydrated and the hook
request identical.

## Pitfalls

| Pitfall                                                        | Fix                                                                     |
| -------------------------------------------------------------- | ----------------------------------------------------------------------- |
| `data as User[]` / `data!`                                     | Handle `null`: `data ?? []`, early return, or `suspense: true` + check  |
| `createRequest()({ ... })` without `response`                  | Declare `createRequest<{ response: T }>()`                              |
| `(request: RequestInstance) => useFetch(request)` in a wrapper | `<R extends RequestInstance>(request: R)`; data otherwise becomes `any` |
| Annotating `const p: Pagination<typeof r> = {...}`             | `satisfies Pagination<typeof r>` keeps the literal keys                 |
| `if (res.success) res.data.id` after `await submit()`          | `if (res.data) res.data.id`                                             |
| `response.error.message` with a custom error union             | Narrow with `"message" in error` / `instanceof Error`                   |
| `useFetch(getUser)` without params                             | `getUser.setParams({ userId })`; the hook does not enforce it           |
| `initialResponse: data`                                        | `initialResponse: { data }`                                             |
| `as any` to silence a pagination or optimistic error           | Fix the field name or type; the error points at a real mismatch         |
| Duplicating response types in components                       | `ExtractResponseType<typeof getUsers>[number]`                          |

Docs: https://hyperfetch.bettertyped.com/docs/guides/typescript/request-extractors,
https://hyperfetch.bettertyped.com/docs/guides/typescript/global-error,
https://hyperfetch.bettertyped.com/docs/guides/typescript/url-parameters
