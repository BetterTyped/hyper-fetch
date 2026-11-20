# Performance: renders and requests

## How re-renders are decided

`useFetch`, `useSubmit`, `useCache` and `useInfiniteFetch` return a Proxy. Reading a state field (at render time or
later) subscribes the component to that field; a change of an unread field does not re-render.

- Tracked in `useFetch` / `useCache`: `data`, `error`, `loading`, `status`, `success`, `extra`, `retries`,
  `responseTimestamp`, `requestTimestamp`. `useSubmit` tracks `submitting` instead of `loading`. `useInfiniteFetch`
  tracks each of its returned values.
- Incoming values are compared before notifying: `Object.is`, then deep equality (`deepCompare: true`). A refetch that
  returns equal data does not re-render, and a failed refetch does not re-render a component reading only `data`.
- Measured in the specs: a component reading only `data` renders once on mount and once for the response.

```tsx
// Re-renders only when the data changes - loading flips are ignored
const { data } = useFetch(getUsers);

// Re-renders for loading and data
const { data, loading } = useFetch(getUsers);
```

Ways to subscribe to everything by accident:

- Spreading or iterating the result: `{...useFetch(r)}`, `<Child {...state} />`, `Object.keys(state)`,
  `JSON.stringify(state)`, `console.log(state)` in render.
- Passing the whole result object to a generic component that reads every field.
- `dependencyTracking: false` (re-renders on every change; use only for debugging or wrappers that must expose all).

Destructure only the fields you render, and pass those fields down.

## Stable identities

- Actions and registrars are created once per hook: `refetch`, `abort`, `submit`, `setData` and the other setters,
  `clearState`, `onSuccess` / `onSubmitSuccess` and friends, `useInfiniteFetch` actions. Use them in dependency arrays
  and memoized props without `useCallback`. An effect depending on `refetch` that calls `refetch` does not loop.
- Structural sharing: cached responses are merged with the previous value, so unchanged branches keep their references
  and an identical refetch keeps `data` identical. `useEffect(..., [data])`, `useMemo` and `React.memo` children only
  react to real changes. Disable per request with `setStructuralSharing(false)` (for huge payloads where the merge cost
  matters) or for selected values with `structuralSharing: false`.
- `useQueue`, `useAppManager` and `useStream` return plain objects (no field tracking); `useQueue` action functions are
  recreated each render.

## select for slices

```tsx
const useUnreadCount = () => useFetch(getInbox, { select: (inbox) => inbox.filter((m) => !m.read).length });
```

Each component re-renders only when its selected value changes; all of them share one request and one cache entry.
Inline selectors are fine (results are structurally shared). Keep selectors pure and cheap: they run on every update of
the key.

## Requests per render

- Requests are immutable descriptions; creating `getUser.setParams({ userId })` in render costs a clone and is the
  recommended style. The hooks key on the serialized request, so equal clones do not refetch. No `useMemo` needed.
- Do not create the `Client` (or `createSdk(client)`) inside components or hooks: the cache, queues and stores belong to
  that instance.
- `dependencies` are compared by identity; pass primitives (`[user?.id]`), not objects or arrays built in render.
- Payload is serialized into the hook key: large or non-JSON payloads (`FormData`, `Blob`) in `useFetch` are better sent
  with `useSubmit`.

## Request counts

- Many components mounting `useFetch` on the same request send one request and share the response, even without
  `deduplicate`. A component mounted later renders cached data at once.
- `revalidate: true` (default) refetches on every mount even when data is fresh. For data that rarely changes, use
  `revalidate: false` and a longer request `staleTime` (`getConfig.setStaleTime(Time.HOUR)`), set app-wide through
  `Provider` if desired.
- `request.setDeduplicate(true)` shares in-flight calls across all senders (hooks, `send()`, prefetches) within
  `deduplicateTime`.
- `bounce` on search inputs; `cancelable` for "latest wins" requests; `useInfiniteFetch` shares concurrent
  `fetchNextPage` calls automatically.
- `refetchOnFocus` across hundreds of hooks: each mounted hook triggers on focus; duplicates of one key join the running
  request, but distinct keys each fetch. Enable it only where freshness matters.
- `useIsFetching(client)` re-renders only when the count changes; prefer it to reading `loading` from many hooks in a
  layout component.

## Large lists

- `useInfiniteFetch` with `maxPages` bounds memory; combine with a virtualizer.
- `uniqueBy` removes duplicates across shifting pages without manual dedupe.
- Keep row components memoized and pass item objects (stable thanks to structural sharing).

## Checklist

1. Client and base requests at module level.
2. Destructure only rendered fields; never spread the hook result.
3. Primitive `dependencies` only.
4. `select` for slices of shared responses.
5. `revalidate: false` + `staleTime` for static-ish data.
6. `deduplicate` / `bounce` / `cancelable` where many triggers can overlap.
7. `useIsFetching` for global spinners.
