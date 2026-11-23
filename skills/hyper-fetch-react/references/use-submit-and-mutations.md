# useSubmit and mutations

`useSubmit(request, options?)` never sends on its own. `submit()` sends a clone of the request through the client's
`submitDispatcher` and resolves with the response. Verified against `packages/react/src/hooks/use-submit` and its specs.

## Options

| Option               | Default      | What it does                                                                                         |
| -------------------- | ------------ | ---------------------------------------------------------------------------------------------------- |
| `disabled`           | `false`      | `submit()` sends nothing and resolves at once with an error response; no callbacks, no state change. |
| `bounce`             | `false`      | Debounce or throttle `submit()` calls.                                                               |
| `bounceType`         | `"debounce"` | `"debounce"` or `"throttle"`.                                                                        |
| `bounceTime`         | `400`        | Debounce delay or throttle interval, ms.                                                             |
| `bounceTimeout`      | `bounceTime` | Throttle only: when the trailing held submit fires. `0` drops held submits (leading only).           |
| `optimistic`         | -            | Optimistic operations or callback for every submit of this hook. Replaces the request's own.         |
| `select`             | -            | Shapes `data` in the hook. `submit()` and callbacks still get the full response.                     |
| `initialResponse`    | `null`       | Placeholder partial response before the first submit.                                                |
| `dependencyTracking` | `true`       | Re-render only for fields read.                                                                      |
| `deepCompare`        | `true`       | Skip re-renders for deeply equal values.                                                             |
| `structuralSharing`  | `true`       | Keep references of unchanged parts of the selected value.                                            |

## Returned values

State (tracked): `data`, `error`, `submitting`, `status`, `success`, `extra`, `retries`, `responseTimestamp`,
`requestTimestamp`. There is no `loading`.

Actions (stable identity): `submit`, `abort`, `refetch`, `setData` and the other setters, `clearState`,
`bounce: { active, reset }`.

Callback registrars: `onSubmitSuccess`, `onSubmitError`, `onSubmitFinished`, `onSubmitAbort`, `onSubmitOfflineError`,
`onSubmitRequestStart`, `onSubmitResponseStart`, `onSubmitUploadProgress`, `onSubmitDownloadProgress`,
`onSubmitRetry` (`{ retry, delay, response }` when a failed attempt schedules a retry).

## submit()

```tsx
const { submit } = useSubmit(updateUser);

const response = await submit({
  params: { userId: 1 },
  payload: { name: "Ann" },
  queryParams: { notify: true },
  onUploadProgress: ({ progress }) => setProgress(progress),
});

if (response.success) {
  navigate(`/users/${response.data.id}`);
} else {
  form.setError(response.error.message);
}
```

- Accepts `payload`, `params`, `queryParams` plus send options: `onBeforeSent`, `onRequestStart`, `onResponseStart`,
  `onUploadProgress`, `onDownloadProgress`, `onRetry`, `onResponse`, `onRemove`, `optimistic`, and request option overrides
  (`retry`, `headers`, ...). Required fields are enforced by the types when the request has no value set.
- Values already set on the request (`updateUser.setParams({ userId })`) are used when `submit()` omits them and merged
  with the ones it passes. `submit({ payload: null })` sends no payload.
- Every call is a separate request (unless the request deduplicates). The request passed to the hook is never changed.
- It **always resolves**: success, error, after all retries, when aborted (error response), when the hook unmounted in
  the meantime, when disabled, and when a bounce drops or resets the call (error response explaining why). No try/catch
  for HTTP errors; check `response.success`.
- Even a GET passed to `useSubmit` goes through the submit dispatcher.

## Callbacks

```tsx
const { onSubmitSuccess, onSubmitError, onSubmitFinished } = useSubmit(createTodo);

onSubmitSuccess(({ response, mutationContext }) => toast(`Created ${response.data.title}`));
onSubmitError(({ response, details }) => {
  if (!details.willRetry) toast.error(response.error.message);
});
onSubmitFinished(() => closeDialog());
```

- One object: `{ response, request, requestId, details, mutationContext }`. Success and finished get the same response.
- Lifecycle order: `onSubmitRequestStart` -> `onSubmitResponseStart` -> success / error / abort / offline -> finished.
- Only the hook instance that submitted receives them (another `useSubmit` on the same request does not).
- Retried requests call `onSubmitError` for every failed attempt (`details.willRetry` is `true` until the last). The
  `submit()` promise resolves once, with the final response.
- Requests with `offline: true` (the default) that fail because the network dropped call `onSubmitOfflineError`, not
  `onSubmitError`, and are resent once online.
- Aborts call `onSubmitAbort`, never `onSubmitError`.
- A throwing callback never breaks the request or the queue; the error is rethrown outside the lifecycle.
- Registering again (each render) replaces the callback; the latest closure is used. After unmount nothing is called.
- Calling `submit()` of another hook from a callback is a supported way to chain mutations; awaiting `submit()` in an
  async handler is the simpler one.

## Refreshing other data after a mutation

The mutation's cache key is not the list's key (keys include the method), so refresh the read requests explicitly.

```tsx
// 1. Invalidate on success - every mounted useFetch on those keys refetches, others refetch on next mount
onSubmitSuccess(() => {
  client.cache.invalidate([getTodos, getTodo.setParams({ todoId }), /\/stats/]);
});

// 2. Write the response straight into the cache - no extra request (update() changes existing entries only)
onSubmitSuccess(({ response }) => {
  client.cache.update(getTodo.setParams({ todoId: response.data.id }), { data: response.data });
});

// 3. Declare it on the request - runs even if the component unmounted before the response
export const deleteTodo = client
  .createRequest<{ response: null }>()({ endpoint: "/todos/:todoId", method: "DELETE" })
  .setOptimistic(() => ({ invalidate: [getTodos] }));
```

- `client.cache.invalidate` accepts a request, a cache key string, a RegExp, or an array of them. With no argument it
  invalidates every entry.
- Option 3 is the most robust: hook callbacks stop firing after unmount (e.g. the form closes on submit), core-level
  `invalidate` does not. Optimistic `updates` targets are refreshed automatically; see `optimistic-updates.md`.
- `useSubmit().refetch()` only invalidates the cache key of the request passed to that hook.

## Concurrency strategies

| Request setting                | Rapid `submit()` calls                                                                                                                                                       |
| ------------------------------ | ---------------------------------------------------------------------------------------------------------------------------------------------------------------------------- |
| default                        | All sent at once. `submitting` stays `true` until the last finishes; `data` shows the response that came last.                                                               |
| `request.setQueued(true)`      | Sent one at a time in submit order; promises resolve in order; a failed or aborted one does not block the next.                                                              |
| `request.setCancelable(true)`  | Each submit aborts the previous in-flight one (resolved with the abort error, `onSubmitAbort`). Last one wins.                                                               |
| `request.setDeduplicate(true)` | Submits made while one is in flight share it: one request, every promise gets the shared response.                                                                           |
| hook `bounce: true` (debounce) | Only the last call within `bounceTime` is sent; each call restarts the timer; all calls of the batch resolve with that response; callbacks and optimistic callback run once. |
| hook `bounceType: "throttle"`  | First call sent at once; calls within the interval are held; the last held one is sent after `bounceTimeout`.                                                                |

- `bounce.reset()` cancels a waiting bounced call; its promises resolve with an error response.
- Unmounting during a bounce does not send the waiting call and resolves its promises with an error response; already
  sent requests keep running.
- `abort()` cancels every running request with the request's `abortKey`, including ones sent by other components.

Prevent double clicks with `disabled={submitting}` on the button, or with `bounce`, `cancelable` or `deduplicate` when
the call can come from several places.

## Progress (upload / download)

```tsx
const { submit, submitting, onSubmitUploadProgress } = useSubmit(uploadFile);
const [progress, setProgress] = useState(0);

onSubmitUploadProgress(({ progress: percent }) => setProgress(percent));

const onFile = (file: File) => {
  const payload = new FormData();
  payload.append("file", file);
  return submit({ payload });
};
```

Progress events carry `progress` (0-100), `loaded`, `total`, `sizeLeft`, `timeLeft` (milliseconds, may be `null`) and
`startTimestamp`. For many parallel uploads, track per request with `useQueue` (`requests[i].uploading`) - see
`other-hooks.md`.

## Forms

- Keep form state in the form library; call `submit({ payload: values })` from its submit handler.
- Show `error` from the hook or from the awaited response. With a typed request error
  (`createRequest<{ error: ApiError }>()`) `response.error` is typed.
- Use `clearState()` to reset `data` / `error` when the form reopens.
- Use `disabled` (for example `disabled: !isValid`) when submit must be a no-op; it resolves instead of throwing.

Docs: https://hyperfetch.bettertyped.com/docs/react/hooks/use-submit,
https://hyperfetch.bettertyped.com/docs/guides/react/basics/submitting,
https://hyperfetch.bettertyped.com/docs/guides/react/basics/progress
