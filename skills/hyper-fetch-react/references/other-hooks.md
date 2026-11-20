# Other hooks and the Provider

## useCache - observe without fetching

```tsx
import { useCache } from "@hyper-fetch/react";

function CartBadge() {
  const { data } = useCache(getCart, { select: (cart) => cart.items.length });
  return <Badge count={data ?? 0} />;
}
```

- Never sends a request. Shows the cache entry of the request and updates with it (responses of other hooks, `send()`,
  `cache.set` / `cache.update`, optimistic changes). `loading` reflects requests running for that key elsewhere.
- Options: `select`, `dependencyTracking: true`, `deepCompare: true`, `structuralSharing: true`.
- Returns the tracked state (`data`, `error`, `loading`, `status`, `success`, `extra`, `retries`, timestamps), the local
  setters, `clearState`, and `invalidate(keys?)`: no argument invalidates this request's key; also accepts a cache key,
  RegExp, request or an array. Mounted `useFetch` hooks of invalidated keys refetch.
- On a key change it always shows the new key's entry (no previous data kept).

## useQueue - inspect and control a dispatcher queue

```tsx
import { useQueue, useSubmit } from "@hyper-fetch/react";

const uploadFile = client
  .createRequest<{ response: { url: string }; payload: FormData }>()({ endpoint: "/files", method: "POST" })
  .setQueued(true);

function Uploads() {
  const { submit } = useSubmit(uploadFile);
  const { requests, stopped, stop, pause, start } = useQueue(uploadFile);

  return (
    <>
      <input
        type="file"
        multiple
        onChange={(e) =>
          Array.from(e.target.files ?? []).forEach((file) => {
            const payload = new FormData();
            payload.append("file", file);
            submit({ payload });
          })
        }
      />
      {stopped ? <button onClick={start}>Resume</button> : <button onClick={pause}>Pause</button>}
      <button onClick={stop}>Stop</button>
      {requests.map((item) => (
        <Row
          key={item.requestId}
          progress={item.uploading.progress}
          failed={item.failed}
          onCancel={item.deleteRequest}
        />
      ))}
    </>
  );
}
```

- Options: `dispatcherType: "auto" | "fetch" | "submit"` (default `"auto"`: GET / QUERY -> fetch dispatcher, other
  methods -> submit dispatcher) and `keepFinishedRequests: false`. `useSubmit` always uses the submit dispatcher, so for
  a GET sent with `useSubmit` pass `dispatcherType: "submit"`.
- Returns `{ requests, stopped, dispatcher, stop, pause, start }`. The queue is identified by the request's `queryKey`
  (and scope).
  - `stop()` cancels the running request (kept in the list, `canceled: true`) and holds the rest; `start()` resends it.
  - `pause()` lets the running request finish and holds the next ones.
- Each item: `requestId`, `request`, `retries`, `timestamp`, `stopped`, `resolved`, flags `success`, `failed` (after the
  final retry), `canceled`, `removed`, progress `uploading` / `downloading`
  (`{ progress, loaded, total, sizeLeft, timeLeft, startTimestamp }`), and actions `startRequest()`, `stopRequest()`,
  `deleteRequest()` (a deleted request's `send()`/`submit()` promise resolves with an error response).
- Finished requests leave the list unless `keepFinishedRequests: true` (then they stay with their final flags).
- `.setQueued(true)` sends one request at a time in order; without it all are sent at once and still listed while
  running.

## useIsFetching / useIsSubmitting - global indicators

```tsx
const fetching = useIsFetching(client);
const usersFetching = useIsFetching(client, { queryKey: getUsers.queryKey });
const uploading = useIsSubmitting(client, { predicate: (request) => request.endpoint.startsWith("/files") });
```

- Count requests being sent right now in the fetch dispatcher (`useFetch`, `useCache`, `fetchDispatcher`) or the submit
  dispatcher (`useSubmit`). Queued-but-waiting and offline-waiting requests are not counted.
- Filters: `queryKey` (string or RegExp), `predicate(request)`. Re-renders only when the number changes. Returns `0`
  during server rendering.

## useAppManager - online and focus state

`useAppManager(client)` returns `{ isOnline, isFocused, setOnline, setFocused }`. See `refreshing-focus-online.md`.

## useStream - streamed responses

```tsx
import { useStream } from "@hyper-fetch/react";

function Answer({ prompt }: { prompt: string }) {
  const { text, streaming, done, error, start, abort, reset } = useStream(askAi.setPayload({ prompt }));

  return (
    <>
      <pre>{text}</pre>
      <button onClick={start} disabled={streaming}>
        Ask
      </button>
      <button onClick={abort} disabled={!streaming}>
        Stop
      </button>
      {done && (
        <button
          onClick={() => {
            reset();
            start();
          }}
        >
          Again
        </button>
      )}
      {error && <ErrorText error={error} />}
    </>
  );
}
```

- Sends the request with the fetch adapter's `streaming: true` option and reads the `ReadableStream`; `text` accumulates
  UTF-8 decoded chunks, `chunks` keeps the raw `Uint8Array`s. Returns `status` and `extra` of the response.
- `start()` is ignored while streaming. `abort()` cancels by the request's `abortKey`. `reset()` aborts and clears.
- Option `autoStart: false` by default; `true` starts once on mount.
- A non-stream response falls back to `text` (string data as is, other data JSON-stringified) with `done: true`.
- It does not use the cache, dedupe or the hooks' field tracking, and the source has no unmount cleanup: call `abort()`
  in an effect cleanup if a stream must stop when the component unmounts.

```tsx
useEffect(() => abort, [abort]);
```

## Provider and useProvider

```tsx
import { Provider, useProvider } from "@hyper-fetch/react";

<Provider
  config={{
    useFetchConfig: { refetchOnFocus: true, revalidate: false },
    useSubmitConfig: { bounce: false },
    useInfiniteFetchConfig: { keepPreviousData: "preserve" },
    useCacheConfig: { deepCompare: true },
    useQueueConfig: { keepFinishedRequests: true },
  }}
>
  <App />
</Provider>;

const { config, setConfig } = useProvider(); // read or replace the config at runtime
```

- Optional; without it hooks use their defaults. The closest provider wins. Precedence: hook options > provider config >
  defaults.
- An equal inline `config` object on re-render does not re-render consumers. A changed `config` prop replaces the config
  (including anything set with `setConfig`), and mounted hooks pick it up.
- `select` cannot be global; `pagination`, `select`, `uniqueBy`, `maxPages` cannot be set in `useInfiniteFetchConfig`.
- Socket hook defaults use the keys `useListener` and `useEmitter` (no `Config` suffix). The hooks themselves are
  covered by the `hyper-fetch-sockets` skill.

Docs: https://hyperfetch.bettertyped.com/docs/react/hooks/use-cache,
https://hyperfetch.bettertyped.com/docs/react/hooks/use-queue,
https://hyperfetch.bettertyped.com/docs/react/hooks/use-is-fetching,
https://hyperfetch.bettertyped.com/docs/react/hooks/use-app-manager,
https://hyperfetch.bettertyped.com/docs/react/hooks/use-stream,
https://hyperfetch.bettertyped.com/docs/guides/react/basics/queues
