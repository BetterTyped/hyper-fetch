# Testing React components and hooks

Tools: React Testing Library (`@testing-library/react`), a DOM environment (`jsdom` or `happy-dom`), and the mocker from
`@hyper-fetch/core`. Hooks come from `@hyper-fetch/react`. All examples use real timers unless stated.

## Setup

```ts
// vitest.config.ts
import { defineConfig } from "vitest/config";

export default defineConfig({
  test: {
    environment: "jsdom",
    globals: true, // lets RTL register its automatic cleanup after each test
    setupFiles: ["./test/setup.ts"],
  },
});
```

```ts
// test/setup.ts
import "@testing-library/jest-dom/vitest";
import { client } from "src/api/client";

beforeEach(() => {
  // Runs after RTL's cleanup of the previous test, so no component is mounted on the old cache
  client.clear();
});
```

With Jest, use `testEnvironment: "jsdom"` and the same setup file (`import "@testing-library/jest-dom"`).

## Component that fetches

```tsx
// Users.tsx
import { useFetch } from "@hyper-fetch/react";
import { getUsers } from "src/api/client";

export function Users() {
  const { data, loading, error } = useFetch(getUsers);

  if (loading) return <p>Loading...</p>;
  if (error) return <p>Error: {error.message}</p>;
  return (
    <ul>
      {data?.map((user) => (
        <li key={user.id}>{user.name}</li>
      ))}
    </ul>
  );
}
```

```tsx
// Users.spec.tsx
import { render, screen } from "@testing-library/react";
import { getUsers } from "src/api/client";
import { Users } from "./Users";

const fast = { requestTime: 0, responseTime: 0 };

afterEach(() => {
  getUsers.clearMock();
});

it("shows the loading state, then the users", async () => {
  getUsers.setMock(() => ({ data: [{ id: 1, name: "John" }], status: 200 }), fast);

  render(<Users />);

  expect(screen.getByText("Loading...")).toBeInTheDocument();
  expect(await screen.findByText("John")).toBeInTheDocument();
});

it("shows the error", async () => {
  getUsers.setMock(() => ({ error: new Error("Boom"), status: 500 }), fast);

  render(<Users />);

  expect(await screen.findByText("Error: Boom")).toBeInTheDocument();
});
```

- Set the mock **before** `render`. The hook sends on mount.
- `findBy*` and `waitFor` wrap updates in `act`, so no "not wrapped in act" warnings.
- Components that build a request per render (`useFetch(getUser.setParams({ userId }))`) are mocked too, because the
  clone made during render copies the mock.

## Component that submits

```tsx
// CreateUser.tsx
import { useSubmit } from "@hyper-fetch/react";
import { createUser } from "src/api/client";

export function CreateUser() {
  const { submit, submitting, data, error } = useSubmit(createUser);

  return (
    <div>
      <button type="button" disabled={submitting} onClick={() => submit({ payload: { name: "Jane" } })}>
        Save
      </button>
      {submitting && <p>Saving...</p>}
      {data && <p>Saved {data.name}</p>}
      {error && <p>Failed</p>}
    </div>
  );
}
```

```tsx
import { fireEvent, render, screen } from "@testing-library/react";
import type { RequestInstance } from "@hyper-fetch/core";

it("sends the payload and shows the result", async () => {
  const mock = vi.fn(({ request }: { request: RequestInstance }) => ({
    data: { id: 2, name: request.payload.name },
    status: 201,
  }));
  createUser.setMock(mock, { requestTime: 0, responseTime: 0 });

  render(<CreateUser />);
  fireEvent.click(screen.getByText("Save"));

  expect(await screen.findByText("Saved Jane")).toBeInTheDocument();
  expect(mock).toHaveBeenCalledTimes(1);
  expect(mock.mock.calls[0][0].request.payload).toEqual({ name: "Jane" });
});
```

Assert the payload through the mock function's argument instead of spying on `fetch`. `@testing-library/user-event`
works the same way (`await user.click(...)`).

## Loading and ordering with a gated mock

```tsx
import { render, screen, waitFor } from "@testing-library/react";

it("disables the button while saving", async () => {
  const g = gate(createUser); // helper from references/mocking.md

  render(<CreateUser />);
  fireEvent.click(screen.getByText("Save"));

  await waitFor(() => expect(g.count).toBe(1));
  expect(screen.getByText("Saving...")).toBeInTheDocument();
  expect(screen.getByText("Save")).toBeDisabled();

  g.release({ id: 2, name: "Jane" }, 201);

  expect(await screen.findByText("Saved Jane")).toBeInTheDocument();
});
```

Release several pending calls in a chosen order to test race conditions (for example a search input where the older
response arrives last).

## Testing hooks with `renderHook`

`useFetch` and `useSubmit` return a tracked object: the component only re-renders for fields it **read**. A component
reads fields during render, so tracking just works. With `renderHook`, the test reads `result.current` later, and a
field first read after it changed is stale (for example `data: null, loading: true` after the response arrived). Pass
`dependencyTracking: false` in hook tests:

```tsx
import { act, renderHook, waitFor } from "@testing-library/react";
import { useFetch, useSubmit } from "@hyper-fetch/react";

it("fetches", async () => {
  getUsers.setMock(() => ({ data: [{ id: 1, name: "John" }], status: 200 }), { requestTime: 0, responseTime: 0 });

  const { result } = renderHook(() => useFetch(getUsers, { dependencyTracking: false }));

  await waitFor(() => expect(result.current.data).toEqual([{ id: 1, name: "John" }]));
  expect(result.current.loading).toBe(false);
});

it("submits", async () => {
  createUser.setMock(({ request }) => ({ data: { id: 2, name: request.payload?.name ?? "" }, status: 201 }), {
    requestTime: 0,
    responseTime: 0,
  });

  const { result } = renderHook(() => useSubmit(createUser, { dependencyTracking: false }));

  await act(async () => {
    const response = await result.current.submit({ payload: { name: "Jane" } });
    expect(response.success).toBe(true);
  });

  expect(result.current.data).toEqual({ id: 2, name: "Jane" });
  expect(result.current.submitting).toBe(false);
});
```

`submit()` resolves with the same response object as `send()`. Wrap it in `act` because it updates hook state.

## Cache state between tests

After a successful fetch, the next mount of the same request renders the cached data immediately with `loading: true`
while it revalidates (`revalidate: true` by default). Without `client.clear()` a test can briefly see the previous
test's data, and assertions like "shows Loading..." or "never shows John" become order dependent.

To start a test **with** data on purpose:

- `useFetch(request, { initialResponse: { data, status: 200 } })` for a component you control, or
- `{ disabled: true, initialResponse }` to render seeded data without fetching, or
- send the mocked request once before rendering (`await getUsers.send()`) so the cache holds a real entry.

## Error boundaries and Suspense

```tsx
import { Component, type ReactNode } from "react";

class Boundary extends Component<{ children: ReactNode }, { error: Error | null }> {
  state = { error: null as Error | null };
  static getDerivedStateFromError(error: Error) {
    return { error };
  }
  render() {
    return this.state.error ? <p>Boundary: {this.state.error.message}</p> : this.props.children;
  }
}

it("throws the final error to the boundary", async () => {
  vi.spyOn(console, "error").mockImplementation(() => {}); // React logs caught render errors
  getUsers.setMock(() => ({ error: new Error("Boom"), status: 500 }), { requestTime: 0, responseTime: 0 });

  render(
    <Boundary>
      <UsersWithThrow />
    </Boundary>,
  );

  expect(await screen.findByText("Boundary: Boom")).toBeInTheDocument();
});
```

`throwOnError: true` throws only settled errors: not while retrying, not for canceled requests, not for offline
re-queued requests. For `suspense: true`, wrap the component in `<Suspense fallback={...}>` and wait for the content
with `findBy*`.

## Fake timers

Use fake timers for features driven by time: `refresh` / `refreshTime`, `bounce` (debounce / throttle), long
`retryTime`, `staleTime` expiry, garbage collection after `cacheTime`.

```tsx
import { act, render, screen } from "@testing-library/react";

beforeEach(() => {
  vi.useFakeTimers();
});

afterEach(() => {
  vi.useRealTimers();
});

const advance = async (ms: number) => {
  await act(async () => {
    await vi.advanceTimersByTimeAsync(ms);
  });
};

it("refreshes every minute", async () => {
  const mock = vi.fn(() => ({ data: [{ id: 1, name: "John" }], status: 200 }));
  getUsers.setMock(mock, { requestTime: 0, responseTime: 0 });

  render(<RefreshingUsers />); // useFetch(getUsers, { refresh: true, refreshTime: 60_000 })
  await advance(50);
  expect(screen.getByText("John")).toBeInTheDocument();

  await advance(60_000);
  expect(mock).toHaveBeenCalledTimes(2);
});
```

- Advance inside `act` with the **async** variant (`advanceTimersByTimeAsync`), so promise callbacks between timers run
  and React state updates are flushed.
- Use synchronous `getBy*` after advancing. Do not use `findBy*` / `waitFor` with Vitest fake timers: RTL detects only
  Jest fake timers, so in Vitest its polling interval and timeout never fire and the test hangs. With Jest fake timers
  RTL advances time itself and `waitFor` works.
- A mocked response needs about 40 ms of timer time even with `requestTime: 0, responseTime: 0` (one 20 ms tick per
  phase). Advance at least 50 ms after a response is released.
- Vitest fakes `Date` together with timers by default, which the mocker and `staleTime` checks rely on.

## Injecting a test SDK

```tsx
import { createContext, useContext, type ReactNode } from "react";
import { sdk as appSdk } from "src/api/sdk";

const SdkContext = createContext(appSdk);
export const SdkProvider = ({ sdk, children }: { sdk: typeof appSdk; children: ReactNode }) => (
  <SdkContext.Provider value={sdk}>{children}</SdkContext.Provider>
);
export const useSdk = () => useContext(SdkContext);

// In a test
render(
  <SdkProvider sdk={testSdk}>
    <Users />
  </SdkProvider>,
);
```

`testSdk` comes from `sdk.$configure(...)` (see [mocking.md](mocking.md)). `$configure` returns the same SDK type, so it
fits the context type without casts.

## Hook defaults for a whole test tree

`Provider` from `@hyper-fetch/react` sets default hook options. Useful to switch off window-driven refetching in tests
that fire focus or online events:

```tsx
import { Provider } from "@hyper-fetch/react";

render(
  <Provider config={{ useFetchConfig: { refetchOnFocus: false, refetchOnReconnect: false } }}>
    <Users />
  </Provider>,
);
```

## StrictMode

`useFetch` sends once per mount in `<StrictMode>` as well. Wrapping the tree in `StrictMode` in tests is safe and
catches effects that are not idempotent in your own components.
