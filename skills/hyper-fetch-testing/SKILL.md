---
name: hyper-fetch-testing
description:
  How to test application code built on HyperFetch (@hyper-fetch/core, @hyper-fetch/react) with Vitest or Jest and React
  Testing Library. Covers the built-in mocker (request.setMock, clearMock, setMockingEnabled,
  client.setEnableGlobalMocking), mock config (requestTime, responseTime, timeout, totalUploaded, totalDownloaded),
  mocking success, error, timeout, abort and upload/download progress, test SDKs with sdk.$configure, isolating tests
  with client.clear(), resetting cache and storage, deterministic async without sleeps (findBy, waitFor, fake timers,
  gated mocks), testing useFetch and useSubmit components and hooks with renderHook, type-level tests of requests and
  SDKs (expectTypeOf, @ts-expect-error, typed mocks), and MSW (Mock Service Worker) interplay. Use when writing or
  fixing unit tests, component tests or integration tests for code that sends HyperFetch requests, when tests are flaky,
  leak cache between tests, hang, or need mocked API responses.
---

# Testing code that uses HyperFetch

HyperFetch has a mocker built into every `Request`. `request.setMock(fn, config)` replaces the adapter call for that
request while keeping the **whole request lifecycle**: dispatcher queues, deduplication, retries, cache writes, hook
state, lifecycle callbacks, progress events, abort and timeout. That means a test mocks at the request level and still
exercises the real data flow, with full type safety (the mock's `data` must match the request's `response` type).

Three building blocks cover almost every test:

1. **Mock** the request: `setMock` on the request instance, or a test SDK built with `sdk.$configure`.
2. **Isolate** the client: `client.clear()` before each test, so cache, queues and listeners never leak.
3. **Wait deterministically**: `findBy*` / `waitFor` with real timers, or fake timers advanced inside `act`. Never
   sleep.

## Minimal setup

```ts
// src/api/client.ts
import { createClient } from "@hyper-fetch/core";

export const client = createClient({ url: "http://localhost:3000" });

export const getUsers = client.createRequest<{ response: { id: number; name: string }[] }>()({
  endpoint: "/users",
});
```

```ts
// src/api/users.spec.ts
import { client, getUsers } from "./client";

describe("getUsers", () => {
  beforeEach(() => {
    client.clear();
  });

  afterEach(() => {
    getUsers.clearMock();
  });

  it("returns the users", async () => {
    getUsers.setMock(() => ({ data: [{ id: 1, name: "John" }], status: 200 }));

    const response = await getUsers.send();

    expect(response.success).toBe(true);
    expect(response.data).toEqual([{ id: 1, name: "John" }]);
  });

  it("reports a server error through the response", async () => {
    getUsers.setMock(() => ({ error: new Error("Server error"), status: 500 }));

    const response = await getUsers.send();

    expect(response).toMatchObject({ data: null, success: false, status: 500 });
    expect(response.error?.message).toBe("Server error");
  });
});
```

`send()` always resolves. Assert on `response.success`, `response.error` and `response.status`, never wrap `send()` in
`expect(...).rejects` or `try/catch`.

## Golden rules

1. **Always return `status` from a mock.** It is required by `MockResponseType`, and tests that assert status codes need
   it. Return `data` for success, `error` for failure.
2. **Mock failures without `data`.** `{ error, status: 500 }` is a failure. `{ data, error }` is treated as a
   **successful partial response** (`success: true`). Force a failure that carries data with `success: false`.
3. **Use `new Error(...)` (or your declared error type) for `error`.** The error type is the request's `error` generic
   plus the client's global error, which defaults to `Error`.
4. **`setMock` mutates the instance and returns it.** It is the only request method that does not clone. Mocks therefore
   survive across tests on module-level requests: call `clearMock()` in `afterEach` or set a mock in every test.
5. **Clones copy the mock at clone time.** `getUser.setParams({ id: 1 })` made _after_ `setMock` is mocked; a clone
   saved _before_ `setMock` is not. Set mocks before rendering or creating derived requests.
6. **SDK property access creates a new request every time.** `sdk.users.$get.setMock(...)` mocks a throwaway instance.
   Use `sdk.$configure({ "users.$get": (request) => request.setMock(...) })`, which returns a new SDK, and inject it.
7. **Call `client.clear()` in `beforeEach`.** It aborts in-flight requests (their `send()` promises resolve), empties
   both dispatchers, replaces the cache and app manager with fresh instances and removes every emitter listener.
8. **Never sleep and never widen timeouts.** Wait for an observable result (`findByText`, `waitFor`, the awaited
   `send()`), or control time with fake timers. A `waitFor` that times out at 1000 ms means the state you wait for never
   happens, not that it is slow.
9. **Keep mock delays explicit and small.** The default mock takes `requestTime: 20` + `responseTime: 20` ms. Set
   `{ requestTime: 0, responseTime: 0 }` for speed; even then each phase waits one 20 ms progress tick (about 40 ms per
   response), so with fake timers advance at least 50 ms after a response is released.
10. **Test through the response and the UI, not internals.** Prefer asserting rendered output, `response` fields and
    callback calls over reading `client.cache` or dispatcher queues, except in isolation checks.

## Core patterns

### Dynamic mocks from request values

The mock function receives `{ request, requestId }`. `request` is the sent request with `params`, `queryParams` and
`payload` already applied, and `request.endpoint` already filled in (`/users/7`).

```ts
const getUser = client.createRequest<{ response: { id: number; name: string } }>()({ endpoint: "/users/:userId" });

getUser.setMock(({ request }) => {
  if (request.params?.userId === 404) {
    return { error: new Error("Not found"), status: 404 };
  }
  return { data: { id: Number(request.params?.userId), name: "John" }, status: 200 };
});

const found = await getUser.send({ params: { userId: 1 } });
const missing = await getUser.send({ params: { userId: 404 } });
```

The mock may be `async`. If it throws or rejects, the response is a failure with `status: 0` and the thrown error.

### Timeout, abort and progress

```ts
// Timeout: the mock is slower than `timeout`, so the response is a TimeoutError ("Request timeout")
getUsers.setMock(() => ({ data: [], status: 200 }), { requestTime: 100, responseTime: 100, timeout: 50 });

// Progress: 1000 "bytes" reported through onUploadProgress / onDownloadProgress
uploadAvatar.setMock(() => ({ data: { ok: true }, status: 200 }), {
  requestTime: 60,
  responseTime: 60,
  totalUploaded: 1000,
  totalDownloaded: 1000,
});
```

Abort with `request.abort()` while the mock is running; the response is an `AbortError` ("Request aborted") and no
further progress is reported. Full option table, success rules and recipes:
[references/mocking.md](references/mocking.md).

### Gated mock: full control of when a response arrives

To assert loading states, ordering or race conditions, keep the mock pending until the test releases it. No timing is
involved, so the test is deterministic.

```ts
import type { RequestInstance } from "@hyper-fetch/core";

type Outcome = { data: unknown; status: number } | { error: Error; status: number };

export const gate = (request: RequestInstance) => {
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

Render, assert the loading UI, `await waitFor(() => expect(g.count).toBe(1))`, call `release(...)`, then
`await screen.findByText(...)`. The mock is shared by clones made afterwards, so `setParams` / `setQueryParams` variants
go through the same gate.

### Test SDK with `$configure`

```ts
// test/sdk.ts
import type { RequestInstance } from "@hyper-fetch/core";
import { sdk } from "src/api/sdk";

export const testSdk = sdk.$configure({
  "*": { retry: 0 },
  "users.$get": (request: RequestInstance) =>
    request.setMock(() => ({ data: [{ id: 1, name: "John" }], status: 200 }), { requestTime: 0, responseTime: 0 }),
});

// Per-test override: `$configure` merges and returns a new SDK, the base stays untouched
const failingSdk = testSdk.$configure({
  "users.$get": (request: RequestInstance) => request.setMock(() => ({ error: new Error("Boom"), status: 500 })),
});
```

Keys are dot paths (`"users.$userId.$get"`), endpoint patterns (`"/users/*"`) or `"*"`. Values are a defaults object
(`retry`, `cacheTime`, `staleTime`, `deduplicate`, `headers`, ...) or a function receiving and returning the request.
Order applied: `"*"`, then endpoint patterns, then dot paths. Inject the SDK through props, context or your DI layer.
The test SDK uses the same client as production, so `client.clear()` still applies.

### React components

```tsx
import { render, screen } from "@testing-library/react";
import { client, getUsers } from "src/api/client";
import { Users } from "./Users";

beforeEach(() => client.clear());
afterEach(() => getUsers.clearMock());

it("renders users", async () => {
  getUsers.setMock(() => ({ data: [{ id: 1, name: "John" }], status: 200 }), { requestTime: 0, responseTime: 0 });

  render(<Users />);

  expect(screen.getByText("Loading...")).toBeInTheDocument();
  expect(await screen.findByText("John")).toBeInTheDocument();
});
```

For `useSubmit`, forms, `renderHook`, error boundaries and fake timers see
[references/react-components.md](references/react-components.md).

## Testing types

Request and SDK types are part of your app's contract: a schema change that turns `response` into `any`, a typo in a
generic key or a wrong `params` shape compiles silently unless something checks it. Add type-level tests next to the
runtime ones. Vitest's `expectTypeOf` and `// @ts-expect-error` are checked by `tsc` (run `tsc --noEmit` over test
files, or `vitest --typecheck`).

```ts
import type {
  ExtractErrorType,
  ExtractParamsType,
  ExtractPayloadType,
  ExtractQueryParamsType,
  ExtractResponseType,
} from "@hyper-fetch/core";
import { expectTypeOf } from "vitest";
import { createUser, getUser, sdk } from "src/api";

it("keeps request types", () => {
  expectTypeOf<ExtractResponseType<typeof getUser>>().toEqualTypeOf<User>();
  expectTypeOf<ExtractPayloadType<typeof createUser>>().toEqualTypeOf<{ name: string }>();
  expectTypeOf<ExtractErrorType<typeof getUser>>().toEqualTypeOf<ApiError | Error>(); // local | global error
  expectTypeOf<ExtractQueryParamsType<typeof getUser>>().toEqualTypeOf<{ expand?: boolean } | undefined>();
  expectTypeOf<ExtractParamsType<typeof getUser>>().toMatchTypeOf<{ userId: string | number }>();
  expectTypeOf<ExtractResponseType<typeof sdk.users.$userId.$get>>().toEqualTypeOf<User>();
  expectTypeOf(getUser.send).returns.resolves.toHaveProperty("data").toEqualTypeOf<User | null>();
});

it("rejects wrong usage", () => {
  // @ts-expect-error params from "/users/:userId" are required
  void getUser.send();
  // @ts-expect-error payload is required for createUser
  void createUser.send();
  // @ts-expect-error payload must match the payload type
  void createUser.send({ payload: { name: 1 } });
  // @ts-expect-error unknown SDK path in $configure
  sdk.$configure({ "users.$nope": { retry: 0 } });
});
```

Mocks are typed by the request, which makes them part of the type contract too:

```ts
// @ts-expect-error mock data must match the response type (id is a number)
getUser.setMock(() => ({ data: { id: "1", name: "John" }, status: 200 }));
// @ts-expect-error status is required in a mock response
getUser.setMock(() => ({ data: { id: 1, name: "John" } }));
// @ts-expect-error error must be the request's error type or the client's global error
getUser.setMock(() => ({ error: { msg: "x" }, status: 500 }));
getUser.setMock(() => ({ error: { message: "Invalid", code: "VALIDATION" }, status: 422 })); // ok, ApiError
```

Rules for type tests:

- Mock the **typed** request instance (`getUser.setMock`). A mock inside `$configure` receives `RequestInstance`, whose
  response type is `any`, so data there is not checked. Keep shared fixtures typed with
  `ExtractResponseType<typeof request>` (`const users: ExtractResponseType<typeof getUsers> = [...]`) to recover the
  check.
- Never silence a mismatch with `as any` or `as never` in fixtures; a failing type there is the test catching drift.
- Put a `@ts-expect-error` on exactly one line that must fail. An unused directive is itself a compile error, so the
  test also fails when the API becomes too permissive.
- Generated SDKs (see `hyper-fetch-cli`) deserve a type test per critical endpoint: regenerate, run `tsc`, and the
  `expectTypeOf` lines show which contracts the new schema changed.
- Lint generic keys with `hyper-fetch-eslint` or `hyper-fetch-oxlint`: a typo like `rsponse` next to a valid key
  (`{ rsponse: User; payload: Input }`) compiles, and the response type silently becomes `undefined`. TypeScript only
  rejects the generic when no key matches at all. An `expectTypeOf<ExtractResponseType<...>>()` test catches it too.

## Isolation checklist

| Leak                                   | Fix                                                                                     |
| -------------------------------------- | --------------------------------------------------------------------------------------- |
| Cached data from a previous test       | `client.clear()` in `beforeEach` (replaces the cache; old entries are gone)             |
| In-flight request finishing late       | `client.clear()` aborts it and resolves its pending `send()`                            |
| Mock from a previous test              | `request.clearMock()` in `afterEach`, or set a mock in every test                       |
| Persistent cache (`lazyStorage`)       | `await client.cache.clear()` before `client.clear()`, and clear the backing store too   |
| `localStorage` / IndexedDB used by app | Clear them in `beforeEach` (`localStorage.clear()` in jsdom)                            |
| Mounted components keep listeners      | Let RTL unmount after each test (automatic with globals) before the next `clear()`      |
| Module-level client shared by files    | Vitest (`isolate: true`, default) and Jest give every test file its own module registry |

`client.clear()` is synchronous. It calls the old cache's async `clear()` without awaiting it, so persistent lazy
storage is only guaranteed empty if you `await client.cache.clear()` yourself first.

For code that creates clients through a factory, a **fresh client per test** is the strongest isolation:
`const client = createClient({ url: "http://localhost" })` inside `beforeEach`, and create requests from it in the test.
Requests are bound to the client they were created with, so module-level requests need the shared client plus
`client.clear()`.

## Decision guide

| Need                                            | Use                                                                              |
| ----------------------------------------------- | -------------------------------------------------------------------------------- |
| Unit test a request or service function         | `request.setMock` + `await request.send()`                                       |
| Component test with SDK injected                | `sdk.$configure({ "path.$method": (r) => r.setMock(...) })`                      |
| Assert loading state or response ordering       | Gated mock (pending promise released by the test)                                |
| Simulate timeout                                | `setMock(fn, { timeout, requestTime, responseTime })` with `timeout` shorter     |
| Simulate cancel / abort                         | Long `requestTime`, then `request.abort()`                                       |
| Upload / download progress UI                   | `totalUploaded` / `totalDownloaded` with non-zero `requestTime` / `responseTime` |
| Test headers, URL building, interceptors, fetch | MSW with mocking off, see [references/msw.md](references/msw.md)                 |
| Turn every mock off for one client              | `client.setEnableGlobalMocking(false)`                                           |
| Pause one request's mock but keep it            | `request.setMockingEnabled(false)`, later `setMockingEnabled(true)`              |
| Retries in error tests                          | `retry: 0` in the test SDK, or fake timers to pass `retryTime`                   |
| Long `cacheTime` / `staleTime` / refresh timers | Fake timers advanced inside `act`                                                |

## Deterministic async

- With **real timers**: `await request.send()`, `await screen.findBy*()`, `await waitFor(() => expect(...))`. Use
  `requestTime: 0, responseTime: 0` so responses arrive in about 40 ms.
- With **fake timers** (`vi.useFakeTimers()` / `jest.useFakeTimers()`): advance time inside `act`:
  `await act(async () => { await vi.advanceTimersByTimeAsync(50); })`. In Vitest, do not use RTL `waitFor` / `findBy*`
  while fake timers are on; RTL only detects Jest's fake timers, so its polling and timeout timers are frozen and the
  wait hangs.
- Restore with `vi.useRealTimers()` in `afterEach`.
- Count adapter calls with a `vi.fn()` mock function (`expect(mock).toHaveBeenCalledTimes(1)`) instead of waiting "long
  enough".

## Pitfalls

- **Identical GET requests are deduplicated by default** (the HTTP adapter sets `deduplicate: true` for safe methods).
  Two components fetching the same GET at once call the mock once. Assert call counts with that in mind, or
  `setDeduplicate(false)` in the test.
- **Stale cache shows first.** After a successful fetch, the next mount renders cached data and revalidates. Without
  `client.clear()` a later test sees the previous test's data before its own mock answers.
- **Default `retryTime` is 500 ms.** An app request with `retry: 3` takes 1.5 s to fail in a test. Set `retry: 0` in the
  test SDK or drive time with fake timers instead of raising the test timeout.
- **Relative client URL with MSW.** Node `fetch` needs an absolute URL. Use `http://localhost` (or any absolute URL) for
  the test client. With `setMock` no network is used, so the URL does not matter there.
- **Mocks are request-scoped, not URL-scoped.** A request created elsewhere for the same endpoint is not mocked. Mock
  the instance your code actually sends, or mock at the SDK level.
- **`client.clear()` while components are mounted** replaces the cache under them. Clear in `beforeEach`, after RTL has
  unmounted the previous test's tree.
- **Do not use `@hyper-fetch/testing`.** It is an unpublished internal package of the HyperFetch repo, not a public
  testing API. Use `setMock`, `$configure` and MSW.

## References

- [references/mocking.md](references/mocking.md): read when you need the full `setMock` contract, success/failure rules,
  config defaults, progress, timeout, abort, async and throwing mocks, enable/disable, SDK-level mocking.
- [references/react-components.md](references/react-components.md): read when testing components or hooks that use
  `useFetch`, `useSubmit`, forms, error boundaries, `renderHook`, fake timers or cache seeding.
- [references/msw.md](references/msw.md): read when tests must exercise the real HTTP adapter (headers, query strings,
  interceptors, auth) with Mock Service Worker.

Related skills: `hyper-fetch-core` (requests, cache, SDK), `hyper-fetch-react` (hooks), `hyper-fetch-sockets` (socket
listeners and emitters).

Docs: https://hyperfetch.bettertyped.com/docs/guides/testing,
https://hyperfetch.bettertyped.com/docs/guides/testing/isolation,
https://hyperfetch.bettertyped.com/docs/guides/testing/mocking, https://hyperfetch.bettertyped.com/docs/core/mocking
