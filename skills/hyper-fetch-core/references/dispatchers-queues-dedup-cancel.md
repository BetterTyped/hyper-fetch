# Dispatchers, queues, deduplication and cancelation

## Two dispatchers

`send()` hands the request to a dispatcher:

- `client.fetchDispatcher` for safe reads (`GET`, `QUERY`),
- `client.submitDispatcher` for everything else,
- override per call with `send({ dispatcherType: "fetch" | "submit" | "auto" })`.

Each dispatcher keeps **queues** keyed by the scoped `queryKey` (`method_endpoint-with-params_queryParams` by default).
Requests in different queues never affect each other. `exec()` bypasses dispatchers entirely.

## Modes

When a request is added, the dispatcher looks at it and the last item of its queue, in this order:

1. `queued: true` - **one by one**: appended, sent when the previous one in the queue finishes (success, final failure,
   abort). The first item also holds the queue while it waits for a retry or for the network.
2. `cancelable: true` - **previous canceled**: running requests of the queue are aborted (their `send()` resolves with
   `AbortError`, `details.isCanceled: true`), waiting ones are removed (`DeletedError`), then the new one is sent.
3. `deduplicate: true` and the last item is still in flight, not stopped, not answered, and inside `deduplicateTime`
   (when set) and the new request is not `used` - **deduplicated**: no new network call; the caller gets the in-flight
   request's response, callbacks and events.
4. Otherwise **concurrent**: sent immediately alongside the others.

Consequences:

- Mode is decided per queue, i.e. per `queryKey`. Different params or query params mean different queues: a cancelable
  search with a changing `q` cancels nothing and duplicates are not joined. Share a queue with
  `setQueryKey("users-search")` (sticky across clones) when the calls should interact.
- Deduplication is not caching: once the response arrives, the next call goes to the network again. Combine with
  `cachePolicy` or hooks to avoid refetching.
- `deduplicateTime: null` (default) joins for the whole flight; a number limits joining to that many ms after the
  original was added.
- The HTTP adapter defaults `deduplicate: true` for GET and QUERY. Mutations are never deduplicated unless you opt in.
- `setUsed(true)` excludes a request from deduplication (intentional resend, token refresh).

## Abort and cancel

```ts
const report = client.createRequest<{ response: Report }>()({ endpoint: "/reports/:id" });

const pending = report.send({ params: { id: 1 } });
report.abort(); // aborts all in-flight requests with the same (scoped) abortKey
const { error } = await pending; // AbortError, status 0

const dashboardUsers = getUsers.setAbortKey("dashboard");
const dashboardStats = getStats.setAbortKey("dashboard");
dashboardUsers.send();
dashboardStats.send();
client.requestManager.abortByKey("dashboard"); // abort a whole screen on unmount
client.requestManager.abortAll(); // everything of this client
```

- Default `abortKey` is `method_endpointTemplate_cancelable`, so `getUser.setParams({ userId: 1 }).abort()` also aborts
  in-flight requests for other user ids. Set a custom `abortKey` for finer groups.
- Aborted requests are not retried and not written to the cache.
- Deduplicated callers share the aborted response.
- `client.setUrl(url, { abort: true })` aborts everything in flight for the old base url.
- Timeouts (HTTP default 5000 ms, `options: { timeout }`) are separate from aborts: `TimeoutError`, retried if `retry`.

## Queue control

```ts
const { submitDispatcher } = client;
const queryKey = saveNote.queryKey; // scoped key when the request has a scope: scopeKey(queryKey, scope)

submitDispatcher.pause(queryKey); // stop starting new ones, running ones continue
submitDispatcher.stop(queryKey); // pause + abort running ones; they stay queued and run again on start
submitDispatcher.start(queryKey); // resume and flush
submitDispatcher.stopRequest(queryKey, requestId); // hold one request
submitDispatcher.startRequest(queryKey, requestId);
submitDispatcher.delete(queryKey, requestId, abortKey); // remove (send() resolves with DeletedError)
submitDispatcher.clearQueue(queryKey); // remove waiting items (DeletedError); running ones finish, no retries
submitDispatcher.getQueue(queryKey); // { queryKey, requests: [{ requestId, request, retries, timestamp, stopped, resolved }], stopped }
submitDispatcher.getRunningRequests(queryKey);
submitDispatcher.getAllRunningRequests();
submitDispatcher.flush(); // try to send everything waiting in all queues
```

`onBeforeSent({ requestId })` in `send()` gives the id needed for per-request control. A `send()` whose running request
is aborted by `stop` resolves with `AbortError` even though the item stays queued; re-sent attempts are only visible
through events. In React use `useQueue` from `hyper-fetch-react`.

## Concurrency and priorities

- There is no global concurrency limit and no priority option. Concurrent requests in different queues all go out at
  once.
- To serialize, put requests in one queue: `queued: true` plus a shared `queryKey` (`setQueryKey("uploads")`) when they
  target different endpoints or params.
- To prioritize, pause lower-priority queues (`pause`) while critical work runs, then `start` them.
- For a bounded pool, keep your own counter around `send()` or a custom dispatcher storage; core does not provide one.

## Response ordering

Responses of one cache key can arrive out of order. A response of a request sent before the one already cached is not
written to the cache (the caller still receives it). Combine with `cancelable` when only the latest result matters to
callers too.

## Events

`dispatcher.events`: `onQueueChange(ByKey)`, `onQueueStatusChange(ByKey)` (start/pause/stop), `onDrained(ByKey)` (queue
emptied), `onRunningRequestsChange(ByKey)`. Each returns an unsubscribe function. Request level events (loading,
response, abort, deduplicated, remove) are on `client.requestManager.events`, see events-and-managers.

## Choosing

| Situation                                             | Setting                                               |
| ----------------------------------------------------- | ----------------------------------------------------- |
| Many components read the same resource                | default GET deduplication                             |
| Search, filters, autocomplete                         | `cancelable: true` + shared `setQueryKey`             |
| Ordered writes (chat messages, edits of one document) | `queued: true` (+ shared `queryKey` across endpoints) |
| Idempotent writes clicked twice                       | `deduplicate: true` on the mutation                   |
| Background sync that must survive offline/restarts    | `queued` + `offline` + dispatcher `storage`           |
| Leaving a screen                                      | custom `abortKey` per screen + `abortByKey`           |
