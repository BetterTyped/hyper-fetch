# SSR, hydration and prefetching

## What happens on the server

- `new Client({ url })` picks its mode automatically: `"client"` in a browser, `"server"` elsewhere (force with
  `mode: "client" | "server"`). In server mode the cache stores nothing unless the request has a scope
  (`request.setScope(id)`), so a module-level client shared by concurrent server renders never leaks one user's data to
  another.
- Hooks never send requests during server rendering (effects do not run). `useFetch` without data renders its loading
  state; with `suspense: true` it renders the Suspense fallback. Nothing is left running (no timers, no listeners).
- To render data on the server, fetch it before rendering and pass it down with `Hydrate`.

## Hydrate

```tsx
import { Hydrate } from "@hyper-fetch/react";

<Hydrate client={client} data={[getUsers.dehydrate({ response }), getMe.dehydrate({ response: meResponse })]}>
  <Page />
</Hydrate>;
```

- `request.dehydrate({ response })` turns a response into a plain, serializable item (cache key, scope, stale and cache
  time, timestamp, response). `request.dehydrate()` without a response reads the current cache and returns `undefined`
  when there is nothing.
- Hooks below `Hydrate` (`useFetch`, `useSubmit`, `useCache`, `useInfiniteFetch`) start with the hydrated data on the
  first render, on the server and in the browser, so markup matches and there is no loading flash.
- In the browser the items are written to the cache in a layout effect, before any hook mounts, so fresh data is not
  fetched again. With the default `revalidate: true`, `useFetch` still refetches in the background while showing the
  hydrated value. Use `revalidate: false` (and a suitable `staleTime` on the request) to rely on server data.
- Newer cache data is never replaced by an older snapshot; an older cache entry is replaced and hooks showing it update.
  `override: false` (on the item via `dehydrate({ response, override: false })`, or in `options`) never replaces
  existing cache data.
- Re-rendering with the same items does not write them again. After `client.clear()` (logout) the snapshot is not used
  by hooks mounted later.
- `data` ignores `null` / `undefined` items, so build it conditionally:
  `data={[user && getUser.dehydrate({ response: user })]}`.
- Each `Hydrate` serves only its own client; nest them for several clients or boundaries. Scoped snapshots hydrate only
  that scope. Hydrated hooks with `suspense: true` do not suspend.
- `options` (object or `(item) => options`) is the same as the second argument of `client.hydrate(items, options)`.
  Outside React call `client.hydrate(items)` directly.

## Next.js app router

The client instance cannot cross from a server component to a client component; only the dehydrated data can. Render
`Hydrate` in a client component that imports the client.

```tsx
// api/users.ts - export the exact request both sides use
export const getFirstPage = getUsers.setQueryParams({ page: 1 });

// app/users/page.tsx - server component
import { getFirstPage } from "@/api";
import { UsersList } from "./users-list";

export default async function Page() {
  const response = await getFirstPage.send();
  return <UsersList hydration={[getFirstPage.dehydrate({ response })]} />;
}
```

```tsx
// app/users/users-list.tsx
"use client";

import { Hydrate, useFetch } from "@hyper-fetch/react";
import type { HydrateProps } from "@hyper-fetch/react";
import { client, getFirstPage } from "@/api";

export const UsersList = ({ hydration }: { hydration: HydrateProps["data"] }) => (
  <Hydrate client={client} data={hydration}>
    <Users />
  </Hydrate>
);

const Users = () => {
  const { data } = useFetch(getFirstPage, { revalidate: false });
  return (
    <ul>
      {data?.map((user) => (
        <li key={user.id}>{user.name}</li>
      ))}
    </ul>
  );
};
```

- The hydrated item is found by `cacheKey` (method, endpoint, params, query params). Export the configured request and
  use it on both sides; a hook with other query params misses the snapshot and fetches.
- A request that declares `queryParams` must get them before `send()` type-checks (`setQueryParams(...)` or
  `send({ queryParams })`), even when every field is optional.
- `send()` resolves with the response even on errors; check `response.success` before deciding to render, redirect or
  `notFound()`.
- `request.exec()` sends without cache and queues; it also works on the server.
- Keep `Provider` (if used) and other context in a `"use client"` providers file.

## Next.js pages router

```tsx
// pages/users.tsx
export const getServerSideProps = async () => {
  const response = await getFirstPage.send();
  return { props: { hydration: [getFirstPage.dehydrate({ response })] } };
};

// pages/_app.tsx
import { Hydrate } from "@hyper-fetch/react";
import type { AppProps } from "next/app";

export default function App({ Component, pageProps }: AppProps) {
  return (
    <Hydrate client={client} data={pageProps.hydration}>
      <Component {...pageProps} />
    </Hydrate>
  );
}
```

`getStaticProps` works the same. Prefer `Hydrate` over calling `client.hydrate()` during render: in server mode the
cache ignores unscoped writes, so only `Hydrate` makes the data visible to the server render.

## Infinite lists

Use `fetchInfinite(request, { pagination, pages })` from `@hyper-fetch/core` and pass its `dehydrated` array to
`Hydrate`. See `pagination-infinite.md`.

## Server-side cache per request (advanced)

When the server render itself should read the cache (for example several components using the same data without prop
drilling), scope the request to the incoming request or session:

```ts
const scoped = getUser.setParams({ userId }).setScope(sessionId);
await scoped.send(); // cached under this scope even in server mode
// components rendered in this request use `scoped` and read it on the server
```

Scoped entries are isolated from other scopes and from unscoped hooks with the same cache key.

## Prefetching in the browser

`request.send()` stores the response in the cache, and every hook on that key renders it immediately.

```tsx
function UserLink({ userId }: { userId: number }) {
  const prefetch = () => {
    getUser.setParams({ userId }).send({ cachePolicy: "cache-first" });
  };
  return (
    <Link to={`/users/${userId}`} onMouseEnter={prefetch} onFocus={prefetch}>
      Open
    </Link>
  );
}
```

`send()` cache policies:

| `cachePolicy`              | Behavior                                                                |
| -------------------------- | ----------------------------------------------------------------------- |
| `"network-only"` (default) | Always sends; the response is cached                                    |
| `"cache-first"`            | Returns cached data if any (regardless of staleness), otherwise sends   |
| `"revalidate"`             | Returns cached data at once and sends in the background; sends if empty |

- Route-change prefetch: call `send()` in the router loader or navigation handler, then the destination's `useFetch`
  renders the cached data on its first render.
- With `useFetch`'s default `revalidate: true`, the destination refetches in the background anyway. Use
  `revalidate: false` there to rely on the prefetched response while it is fresh (`staleTime` defaults to 5 minutes).
- A failed prefetch is not used as data: the hook fetches again on mount.
- Enable `request.setDeduplicate(true)` if hover prefetches and mounts can overlap and you want them to share one call.

Docs: https://hyperfetch.bettertyped.com/docs/react/hydrate,
https://hyperfetch.bettertyped.com/docs/guides/core/advanced/prefetching
