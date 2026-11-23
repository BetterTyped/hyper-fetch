import type { RequestInstance } from "@hyper-fetch/core";
import { Client, Time, httpExtra } from "@hyper-fetch/core";
import { createHttpMockingServer } from "@hyper-fetch/testing";
import { act, renderHook, waitFor } from "@testing-library/react";
import { useFetch } from "hooks/use-fetch";

const { resetMocks, startServer, stopServer, mockRequest } = createHttpMockingServer();

type User = { name: string };

// Typed loosely - the tests write raw cache values for requests of different shapes
const createResponse = (data: User): any => ({
  data,
  error: null,
  status: 200,
  success: true,
  extra: httpExtra,
  requestTimestamp: Date.now(),
  responseTimestamp: Date.now(),
  retries: 0,
  isCanceled: false,
  isOffline: false,
  willRetry: false,
  addedTimestamp: Date.now(),
  triggerTimestamp: Date.now(),
});

describe("useFetch [ Scope ]", () => {
  let client: Client;
  let request: ReturnType<typeof createUserRequest>;

  const createUserRequest = (c: Client) =>
    c.createRequest<{ response: User }>()({ endpoint: "/users/:userId" }).setStaleTime(Time.MIN);

  beforeAll(() => startServer());
  afterEach(() => resetMocks());
  afterAll(() => stopServer());

  beforeEach(() => {
    client = new Client({ url: "http://localhost:3000" });
    request = createUserRequest(client);
  });

  const renderScoped = (initial: RequestInstance) =>
    renderHook(({ req }: { req: RequestInstance }) => useFetch(req, { revalidate: false, dependencyTracking: false }), {
      initialProps: { req: initial },
    });

  it("should read the scoped cache on mount", () => {
    const scoped = request.setParams({ userId: 1 }).setScope("a");
    client.cache.set(scoped, createResponse({ name: "Scoped" }));

    const view = renderScoped(scoped);

    expect(view.result.current.data).toEqual({ name: "Scoped" });
  });

  it("should read the scoped cache when the request changes to another key", () => {
    const first = request.setParams({ userId: 1 }).setScope("a");
    const second = request.setParams({ userId: 2 }).setScope("a");
    client.cache.set(first, createResponse({ name: "First" }));
    client.cache.set(second, createResponse({ name: "Second" }));
    const spy = vi.spyOn(client.fetchDispatcher, "add");

    const view = renderScoped(first);
    view.rerender({ req: second });

    expect(view.result.current.data).toEqual({ name: "Second" });
    expect(spy).not.toHaveBeenCalled();
  });

  it("should not receive cache updates of another scope with the same cache key", async () => {
    const scopeA = request.setParams({ userId: 1 }).setScope("a");
    const scopeB = request.setParams({ userId: 1 }).setScope("b");
    client.cache.set(scopeA, createResponse({ name: "A" }));
    client.cache.set(scopeB, createResponse({ name: "B" }));

    const viewA = renderScoped(scopeA);
    const viewB = renderScoped(scopeB);

    act(() => {
      client.cache.set(scopeA, createResponse({ name: "A updated" }));
    });

    await waitFor(() => expect(viewA.result.current.data).toEqual({ name: "A updated" }));
    expect(viewB.result.current.data).toEqual({ name: "B" });
  });

  it("should not receive cache updates of the unscoped request with the same cache key", async () => {
    const scoped = request.setParams({ userId: 1 }).setScope("a");
    const unscoped = request.setParams({ userId: 1 });
    client.cache.set(scoped, createResponse({ name: "Scoped" }));

    const view = renderScoped(scoped);

    act(() => {
      client.cache.set(unscoped, createResponse({ name: "Unscoped" }));
    });

    expect(view.result.current.data).toEqual({ name: "Scoped" });
  });

  it("should store the fetched response under its scope only", async () => {
    const scoped = request.setParams({ userId: 1 }).setScope("a");
    const mock = mockRequest(scoped, { data: { name: "Fetched" } });

    const view = renderHook(() => useFetch(scoped, { dependencyTracking: false }));

    await waitFor(() => expect(view.result.current.data).toEqual(mock));
    expect(client.cache.get(`a__${scoped.cacheKey}`)?.data).toEqual(mock);
    expect(client.cache.get(scoped.cacheKey)).toBeUndefined();
  });
});

describe("useFetch [ Scope - loading ]", () => {
  const { startServer: start, stopServer: stop, resetMocks: reset, mockRequest: mock } = createHttpMockingServer();

  beforeAll(() => start());
  afterEach(() => reset());
  afterAll(() => stop());

  it("should show loading while a scoped request is refetched", async () => {
    const client = new Client({ url: "http://loading.test" });
    const scoped = client.createRequest<{ response: User }>()({ endpoint: "/users/1" }).setScope("a");
    mock(scoped, { data: { name: "Fetched" }, delay: 50 });
    client.cache.set(scoped, createResponse({ name: "Cached" }));

    const view = renderHook(() => useFetch(scoped, { revalidate: false, dependencyTracking: false }));
    expect(view.result.current.loading).toBe(false);

    act(() => {
      view.result.current.refetch();
    });

    await waitFor(() => expect(view.result.current.loading).toBe(true));
    await waitFor(() => expect(view.result.current.data).toEqual({ name: "Fetched" }));
    expect(view.result.current.loading).toBe(false);
  });

  it("should not show loading when another scope with the same key is fetching", async () => {
    const client = new Client({ url: "http://loading.test" });
    const scopeA = client.createRequest<{ response: User }>()({ endpoint: "/users/1" }).setScope("a");
    const scopeB = scopeA.setScope("b");
    mock(scopeA, { data: { name: "Fetched" }, delay: 50 });
    client.cache.set(scopeA, createResponse({ name: "A" }));
    client.cache.set(scopeB, createResponse({ name: "B" }));

    const viewA = renderHook(() => useFetch(scopeA, { revalidate: false, dependencyTracking: false }));
    const viewB = renderHook(() => useFetch(scopeB, { revalidate: false, dependencyTracking: false }));

    act(() => {
      viewA.result.current.refetch();
    });

    await waitFor(() => expect(viewA.result.current.loading).toBe(true));
    expect(viewB.result.current.loading).toBe(false);
    await waitFor(() => expect(viewA.result.current.loading).toBe(false));
    expect(viewB.result.current.data).toEqual({ name: "B" });
  });
});

describe("useFetch [ Scope - key changes and running requests ]", () => {
  const { startServer: start, stopServer: stop, resetMocks: reset, mockRequest: mock } = createHttpMockingServer();

  beforeAll(() => start());
  afterEach(() => reset());
  afterAll(() => stop());

  it("should show the scoped cache of the new page when only query params change", () => {
    const client = new Client({ url: "http://pages.test" });
    const base = client
      .createRequest<{ response: User; queryParams: { page: number } }>()({ endpoint: "/users" })
      .setScope("a")
      .setStaleTime(Time.MIN);
    const page1 = base.setQueryParams({ page: 1 });
    const page2 = base.setQueryParams({ page: 2 });
    client.cache.set(page1, createResponse({ name: "Page 1" }));
    client.cache.set(page2, createResponse({ name: "Page 2" }));

    // "auto" keeps the previous data on query param changes, so only the cache read can switch the page
    const view = renderHook(
      ({ req }) => useFetch(req, { revalidate: false, dependencyTracking: false, keepPreviousData: "auto" }),
      { initialProps: { req: page1 } },
    );
    view.rerender({ req: page2 });

    expect(view.result.current.data).toEqual({ name: "Page 2" });
  });

  it("should keep loading while a scoped request is still running and the cache changes", async () => {
    const client = new Client({ url: "http://running.test" });
    const scoped = client.createRequest<{ response: User }>()({ endpoint: "/users/1" }).setScope("a");
    mock(scoped, { data: { name: "Fetched" }, delay: 100 });
    client.cache.set(scoped, createResponse({ name: "Cached" }));

    const view = renderHook(() => useFetch(scoped, { revalidate: false, dependencyTracking: false }));
    act(() => {
      view.result.current.refetch();
    });
    await waitFor(() => expect(view.result.current.loading).toBe(true));

    // e.g. an optimistic update while the request is in flight
    act(() => {
      client.cache.set(scoped, createResponse({ name: "Optimistic" }));
    });

    expect(view.result.current.data).toEqual({ name: "Optimistic" });
    expect(view.result.current.loading).toBe(true);
    await waitFor(() => expect(view.result.current.data).toEqual({ name: "Fetched" }));
  });
});
