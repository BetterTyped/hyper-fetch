# Mocking reference

The mocker is part of `@hyper-fetch/core`. It runs inside the adapter step of a request, so everything before and after
it (dispatcher, deduplication, queueing, retries, cache, hooks, plugins, lifecycle callbacks) behaves exactly as with a
real server.

## API

```ts
request.setMock(fn, config?) // attach a mock, enables it, returns the same instance (mutates, no clone)
request.clearMock()          // remove the mock and disable mocking for the request, returns the instance
request.setMockingEnabled(b) // switch the mock off / on without removing it, returns the instance
client.setEnableGlobalMocking(b) // switch every mock of this client off / on (default: on)
```

A mock runs only when all three are true: the request has a mock, the request's mocking is enabled, and the client's
global mocking is enabled. Otherwise the real adapter is called.

`clone()` (used by every `set*` method other than the mock methods, for example `setParams`, `setQueryParams`,
`setPayload`, `setHeaders`) copies the mock and its enabled flag into the clone. A clone created before `setMock` keeps
whatever it had at clone time.

## The mock function

```ts
request.setMock(({ request, requestId }) => MockResponse | Promise<MockResponse>, config);
```

- `request`: the request being sent, with `params`, `queryParams`, `payload` and the resolved `endpoint` (`/users/:id`
  sent with `{ params: { id: 7 } }` arrives as `endpoint: "/users/7"`).
- `requestId`: unique id of this send.
- Only the callback form exists. Passing a plain object (`setMock({ data })`) is not supported.
- The function is called before `onBeforeRequest` / `onRequestStart`, so an async mock that has not resolved yet keeps
  the request in its pre-flight phase.
- A throwing or rejecting mock produces a failed response: `success: false`, `status: 0`, `error` is the thrown error.
  The request is removed from the queue as usual.

### Mock response shape

| Field     | Required | Meaning                                                                                        |
| --------- | -------- | ---------------------------------------------------------------------------------------------- |
| `data`    | one of   | Response data, typed by the request's `response` generic                                       |
| `error`   | one of   | Error, typed by the request's `error` generic plus the client's global error (`Error` default) |
| `status`  | yes      | Status for the adapter (HTTP: a number). May be `null`                                         |
| `success` | no       | Overrides the computed success flag                                                            |
| `extra`   | no       | Adapter extra. Defaults to the adapter's `defaultExtra` (HTTP: `{ headers: {} }`)              |

### How success is decided

`success` defaults to `!error || hasData`, where `hasData` means `data` is neither `undefined` nor `null`.

| Mock returns                                       | `response.success`       |
| -------------------------------------------------- | ------------------------ |
| `{ data: { id: 1 }, status: 200 }`                 | `true`                   |
| `{ data: 0 }` / `{ data: "" }` (falsy but defined) | `true`                   |
| `{ data: null, status: 204 }` (no error)           | `true`                   |
| `{ error, status: 400 }`                           | `false`, `data: null`    |
| `{ data: null, error, status: 500 }`               | `false`                  |
| `{ data, error, status: 200 }` (partial response)  | `true`, both fields kept |
| `{ data, status: 400, success: false }`            | `false`                  |
| `{ error, status: 400, success: false }`           | `false`                  |
| `{ error, status: 200, success: true }`            | `true`                   |

`status` is passed through as-is, it does not decide success. A failed mock goes through the same error path as a real
failure: `onError` callbacks, `retry` / `retryOnError`, error state in hooks, no cache write for failures.

## Config

| Option            | Default     | Meaning                                                                                    |
| ----------------- | ----------- | ------------------------------------------------------------------------------------------ |
| `requestTime`     | `20`        | Duration of the upload phase in ms                                                         |
| `responseTime`    | `20`        | Duration of the download phase in ms                                                       |
| `totalUploaded`   | `1000`      | "Bytes" reported through upload progress events                                            |
| `totalDownloaded` | `1000`      | "Bytes" reported through download progress events                                          |
| `timeout`         | `undefined` | When a number, a timeout error is reported after that many ms if the mock is still running |

Progress is emitted every 20 ms during each phase, with `loaded` growing to the total. Because the phase loop ticks at
20 ms, a phase with `requestTime: 0` still lasts one tick. Budget about 40 ms per mocked response with
`{ requestTime: 0, responseTime: 0 }`.

`timeout` is a number of milliseconds (not a boolean). The timeout fires only if the two phases are still running; a
mock that finishes first reports success and nothing after it.

## Recipes

### Success, empty, error

```ts
getUsers.setMock(() => ({ data: [{ id: 1, name: "John" }], status: 200 }));
getUsers.setMock(() => ({ data: [], status: 200 }));
getUsers.setMock(() => ({ error: new Error("Server error"), status: 500 }));
```

### Typed API error

```ts
type ApiError = { message: string; code: string };

const createUser = client.createRequest<{ response: { id: number }; payload: { name: string }; error: ApiError }>()({
  endpoint: "/users",
  method: "POST",
});

createUser.setMock(({ request }) =>
  request.payload?.name
    ? { data: { id: 1 }, status: 201 }
    : { error: { message: "Name is required", code: "VALIDATION" }, status: 422 },
);
```

### Timeout

```ts
getUsers.setMock(() => ({ data: [], status: 200 }), { requestTime: 100, responseTime: 100, timeout: 50 });

const response = await getUsers.send();
expect(response.success).toBe(false);
expect(response.error?.message).toBe("Request timeout");
```

The error is an instance of `TimeoutError` (exported by `@hyper-fetch/core`), its `name` is `"TimeoutError"`.

### Abort

```ts
getUsers.setMock(() => ({ data: [], status: 200 }), { requestTime: 1000, responseTime: 1000 });

const response = await getUsers.send({
  onRequestStart: () => {
    getUsers.abort();
  },
});
expect(response.error?.message).toBe("Request aborted");
```

Aborting from a lifecycle callback (or from a UI action in a component test) avoids waiting an arbitrary time before
`abort()`.

`abort()` aborts every in-flight request with the same `abortKey`. The response is reported once (an `AbortError`), no
further progress events are emitted and `onResponseStart` never fires.

### Upload and download progress

```ts
const upload: number[] = [];

uploadFile.setMock(() => ({ data: { ok: true }, status: 200 }), {
  requestTime: 60,
  responseTime: 60,
  totalUploaded: 300,
  totalDownloaded: 900,
});

await uploadFile.send({
  payload: file,
  onUploadProgress: ({ loaded, total, progress }) => upload.push(loaded),
});

expect(upload.at(-1)).toBe(300);
```

Progress events carry `progress` (0-100), `loaded`, `total`, `sizeLeft`, `timeLeft`, `startTimestamp`, plus `request`
and `requestId`.

### Retries

```ts
const mock = vi.fn(() => ({ error: new Error("Unavailable"), status: 503 }));

await getUsers.setRetry(2).setRetryTime(10).setMock(mock, { requestTime: 0, responseTime: 0 }).send();

expect(mock).toHaveBeenCalledTimes(3); // first try + 2 retries
```

`setRetry` / `setRetryTime` clone, then `setMock` mutates that clone, so the chain mocks the clone that is sent.

### Sequenced responses

```ts
const responses = [
  { error: new Error("Unavailable"), status: 503 },
  { data: [{ id: 1, name: "John" }], status: 200 },
];
getUsers.setMock(() => responses.shift() ?? { data: [], status: 200 });
```

### Gated (manually released) mock

```ts
import type { RequestInstance } from "@hyper-fetch/core";

type Outcome = { data: unknown; status: number } | { error: Error; status: number };

const gate = (request: RequestInstance) => {
  const pending: Array<(value: Outcome) => void> = [];
  request.setMock(() => new Promise<Outcome>((resolve) => pending.push(resolve)), { requestTime: 0, responseTime: 0 });
  return {
    get count() {
      return pending.length;
    },
    release: (data: unknown, status = 200) => pending.shift()?.({ data, status }),
    fail: (error: Error, status = 500) => pending.shift()?.({ error, status }),
  };
};
```

Wait for the call to arrive before releasing it (`await waitFor(() => expect(g.count).toBe(1))`), because the mock is
invoked asynchronously after `send()` enters the dispatcher.

Use it to assert loading UI, to release two responses in reverse order (race conditions, `keepPreviousData`), or to
check that a second click while submitting does not send twice.

### Turning mocks off for an integration run

```ts
client.setEnableGlobalMocking(false); // every request of this client uses the real adapter
// ...
client.setEnableGlobalMocking(true);
```

Useful when the same request definitions carry development mocks but a test suite must hit MSW or a test server.

## SDK-level mocking

Every property access on an SDK (`sdk.users.$get`) builds a new request, so mocks must be applied by `$configure`:

```ts
import type { RequestInstance } from "@hyper-fetch/core";

export const testSdk = sdk.$configure({
  "*": { retry: 0, deduplicate: false },
  "/users/*": { cache: false },
  "users.$get": (request: RequestInstance) => request.setMock(() => ({ data: [], status: 200 })),
  "users.$userId.$get": (request: RequestInstance) =>
    request.setMock(({ request: sent }) => ({ data: { id: Number(sent.endpoint.split("/").pop()) }, status: 200 })),
});
```

Inside a `$configure` callback the request is typed loosely, so `sent.params` is `never` there. Read the filled
`sent.endpoint` instead, or call `setMock` on a concrete request (`getUser.setMock(...)`), where `request.params` keeps
the endpoint's param types.

- `$configure` is immutable: it returns a new SDK with the merged configuration. The original SDK is untouched.
- Chained `$configure` calls merge keys, a later key replaces the earlier value for the same key.
- Application order per request: `"*"`, then endpoint patterns (keys starting with `/`, `"/users/*"` matches the
  endpoint and everything below it), then dot paths (exact SDK path like `"users.$userId.$get"`).
- Object values accept `headers`, `auth`, `cache`, `cacheTime`, `staleTime`, `retry`, `retryTime`, `cancelable`,
  `queued`, `offline`, `deduplicate`, `deduplicateTime`, `structuralSharing`. Function values receive the request and
  must return a request (any setter chain works).
- Type the callback parameter as `RequestInstance`: it is a constraint ("any request"), not an endpoint definition.

## Mocking anything else

- **Socket listeners and emitters** (`@hyper-fetch/sockets`) have no built-in mocker. Configure them through the socket
  SDK `$configure` or test against a local WebSocket server; see the `hyper-fetch-sockets` skill.
- **A whole adapter**: for adapter-level tests write a custom adapter fetcher; for app tests prefer `setMock` or MSW.
