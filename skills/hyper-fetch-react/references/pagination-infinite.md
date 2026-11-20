# Pagination and infinite lists

Two tools:

- **Numbered pages with buttons**: `useFetch` with the page in the request. Each page is its own cache entry.
- **Load more / infinite scroll**: `useInfiniteFetch` with a `pagination` description. Each page is still a normal
  request under its own cache key; the hook glues them together.

## Page buttons with useFetch

```tsx
function UsersPage() {
  const [page, setPage] = useState(1);
  const { data, loading } = useFetch(getUsers.setQueryParams({ page, limit: 20 }));

  return (
    <>
      <UsersTable users={data ?? []} dimmed={loading} />
      <button disabled={page === 1} onClick={() => setPage((p) => p - 1)}>
        Previous
      </button>
      <button disabled={(data?.length ?? 0) < 20} onClick={() => setPage((p) => p + 1)}>
        Next
      </button>
    </>
  );
}
```

- With the default `keepPreviousData: "auto"`, a query param change keeps the previous page visible while the next one
  loads (`loading` is `true`). Going back to a visited page renders it from the cache on the same render.
- If the page is a URL param (`/users/page/:page`), `"auto"` clears the list between pages; pass
  `keepPreviousData: "preserve"` to keep it.
- Prefetch the next page for instant navigation:
  `useEffect(() => { getUsers.setQueryParams({ page: page + 1, limit: 20 }).send(); }, [page]);`

## useInfiniteFetch

```tsx
import { useInfiniteFetch } from "@hyper-fetch/react";

const getFeed = client.createRequest<{
  response: { data: Post[]; nextCursor: string | null };
  queryParams: { cursor?: string; topic?: string };
}>()({ endpoint: "/feed" });

function Feed({ topic }: { topic: string }) {
  const { items, loading, error, hasNextPage, isFetchingNextPage, fetchNextPage } = useInfiniteFetch(
    getFeed.setQueryParams({ topic }),
    { pagination: { cursor: "cursor", next: "nextCursor", items: "data" } },
  );

  if (loading) return <Spinner />;
  if (error && items.length === 0) return <ErrorState />;

  return (
    <>
      {items.map((post) => (
        <PostCard key={post.id} post={post} />
      ))}
      {hasNextPage && (
        <button onClick={() => fetchNextPage()} disabled={isFetchingNextPage}>
          Load more
        </button>
      )}
    </>
  );
}
```

### pagination

Paging fields live in `queryParams` unless `in: "params"` or `in: "payload"`. Every key is type-checked against the
request and its response.

```ts
// Page numbers: ?page=2. With limit, a short page ends the list without an extra request.
{ page: "page", limit: "limit" }
// Offsets: ?offset=40&limit=20, stops at total
{ offset: "offset", limit: "limit", items: "users", total: "total" }
// Cursors
{ cursor: "cursor", next: "nextCursor", previous: "prevCursor", items: "data" }
// Functions receive { data, param, pages }
{ cursor: "cursor", next: ({ data }) => data.meta.next, items: ({ data }) => data.results }
```

| Key                          | Meaning                                                                               |
| ---------------------------- | ------------------------------------------------------------------------------------- |
| `page` / `offset` / `cursor` | The paging field (pick one mode). `offset` requires `limit`, `cursor` requires `next` |
| `limit`                      | Page size field, lets a short page end the list                                       |
| `next` / `previous`          | Response field or function with the next / previous cursor                            |
| `items`                      | Array field or function. Not needed when the response is an array                     |
| `total`                      | Number field or function with the list size                                           |
| `hasNext` / `hasPrevious`    | Override end / start detection                                                        |
| `in`                         | `"queryParams"` (default), `"params"`, `"payload"`                                    |

Reuse a description next to the request:

```ts
import type { Pagination } from "@hyper-fetch/core";

export const feedPagination = { cursor: "cursor", next: "nextCursor", items: "data" } satisfies Pagination<
  typeof getFeed
>;
```

- The list starts from the value already set on the request, otherwise page `1`, offset `0` or no cursor. Starting at
  page `5` allows `fetchPreviousPage`. A list starting at `0` is numbered from zero.
- The end is reached when the cursor is empty, `total` is reached, a page is empty, or a page is shorter than `limit`.

### Options and defaults

`pagination` (required), `uniqueBy` (field or `({ item }) => id`, drops duplicates across shifting pages), `maxPages`
(keep only N pages; dropped pages can be fetched again), `select` (`({ items, pages }) => result`), `suspense: false`,
`throwOnError: false`, `dependencies: []`, `disabled: false`, `dependencyTracking: true`, `revalidate: false` (note:
unlike `useFetch`), `keepPreviousData: "auto"`, `refresh: false`, `refreshTime: Time.HOUR`, `refetchBlurred: true`,
`refetchOnBlur` / `refetchOnFocus` / `refetchOnReconnect: false`, `structuralSharing: true`, `bounce: false`,
`bounceType: "debounce"`, `bounceTime: 400`, `bounceTimeout: 400`.

Provider defaults go under `useInfiniteFetchConfig` (everything except `pagination`, `select`, `uniqueBy`, `maxPages`).

### Returned values

`items`, `pages` (raw page data), `pageParams`, `total`, `hasNextPage`, `hasPreviousPage`, `loading` (first page,
nothing to show), `isFetching`, `isRefetching`, `isFetchingNextPage`, `isFetchingPreviousPage`, `isFetchNextPageError`,
`isFetchPreviousPageError`, `isPreviousData`, `error`, `status`, `extra`, `success`, `fetchNextPage()`,
`fetchPreviousPage()`, `refetch()`, `reset()`, `abort()`, `onSuccess` / `onError` / `onFinished` (per page,
`{ response, request, param }`), `onReset`, `bounce`. Actions are stable between renders and return promises that
resolve with the page response (or `null`).

- Calls to `fetchNextPage` while a page loads share one request; calling it with no next page or on a failed list does
  nothing. Safe to call from an observer that fires repeatedly.
- A failed next page keeps the loaded list and sets `isFetchNextPageError`; the next successful fetch clears it.

### Starting over

| Change                                     | Result                                                       |
| ------------------------------------------ | ------------------------------------------------------------ |
| Filter, search, sort, page size, URL param | New list from the first page (identity is the whole request) |
| Back to an earlier filter                  | Pages restored from cache, refetched only when stale         |
| `reset()`                                  | Drop to the starting page and fetch it again                 |
| `dependencies` change                      | Refetch the loaded pages                                     |

Pages of the old list still loading are cancelled. While the new list loads its first page, `keepPreviousData` decides
what is shown and `isPreviousData` is `true` if the old list is still on screen. `bounce` waits for the settled value
before starting a new list; `onReset` lets you scroll to the top.

```tsx
const { items, isPreviousData, onReset } = useInfiniteFetch(getPosts.setQueryParams({ search }), {
  pagination: { page: "page" },
  bounce: true,
  bounceTime: 300,
});
onReset(() => listRef.current?.scrollTo({ top: 0 }));
```

### Refetching and cache

- `refetch()` refetches all loaded pages and swaps the list when they arrive. Page and offset lists refetch in parallel;
  cursor lists refetch in order following fresh cursors (a failure keeps the old list).
- The same refetch runs when a loaded page is invalidated or deleted, on `refresh`, and on focus / blur / reconnect
  options. Restored pages refetch on mount only when stale, or always with `revalidate: true`.
- A cache change on a loaded page (for example an optimistic `optimistic.all(getPosts)` update or `cache.update`)
  updates that page in place.
- Pages share the cache with plain `useFetch` on the same page request, and two hooks on one list send one request per
  page.

### Infinite scroll trigger

The hook has no scroll logic; call `fetchNextPage` from anything:

```tsx
const endRef = useRef<HTMLDivElement>(null);

useEffect(() => {
  const node = endRef.current;
  if (!node || !hasNextPage) return;
  const observer = new IntersectionObserver(([entry]) => {
    if (entry.isIntersecting) fetchNextPage();
  });
  observer.observe(node);
  return () => observer.disconnect();
}, [hasNextPage, fetchNextPage]);

// React Native: <FlatList data={items} onEndReached={() => hasNextPage && fetchNextPage()} />
```

With virtualizers, call `fetchNextPage` when the last rendered index approaches `items.length`.

### SSR for infinite lists

```tsx
import { fetchInfinite } from "@hyper-fetch/core";

const { dehydrated } = await fetchInfinite(getFeed.setQueryParams({ topic }), { pagination: feedPagination, pages: 2 });

<Hydrate client={client} data={dehydrated}>
  <Feed topic={topic} />
</Hydrate>;
```

`fetchInfinite` fetches the first pages sequentially without touching the cache or the queues; both pages render on the
server and are not refetched in the browser while fresh. Pass the same pagination object to the hook.

Docs: https://hyperfetch.bettertyped.com/docs/react/hooks/use-infinite-fetch,
https://hyperfetch.bettertyped.com/docs/guides/react/basics/infinite-scroll,
https://hyperfetch.bettertyped.com/docs/guides/react/basics/pagination
