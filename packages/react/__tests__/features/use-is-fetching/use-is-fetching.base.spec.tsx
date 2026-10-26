import { createHttpMockingServer } from "@hyper-fetch/testing";
import { act, renderHook, waitFor } from "@testing-library/react";
import { useIsFetching, useIsSubmitting } from "hooks/use-is-fetching";

import { client, createRequest } from "../../utils";

const { resetMocks, startServer, stopServer, mockRequest } = createHttpMockingServer();

describe("useIsFetching [ Base ]", () => {
  beforeAll(() => {
    startServer();
  });

  afterEach(() => {
    resetMocks();
  });

  afterAll(() => {
    stopServer();
  });

  beforeEach(() => {
    vi.resetModules();
    client.clear();
  });

  it("should count the running fetch requests", async () => {
    const usersRequest = createRequest({ endpoint: "/users" });
    const postsRequest = createRequest({ endpoint: "/posts" });
    mockRequest(usersRequest, { delay: 30 });
    mockRequest(postsRequest, { delay: 60 });

    const { result } = renderHook(() => useIsFetching(client));
    expect(result.current).toBe(0);

    act(() => {
      client.fetchDispatcher.add(usersRequest);
      client.fetchDispatcher.add(postsRequest);
    });

    await waitFor(() => {
      expect(result.current).toBe(2);
    });
    await waitFor(() => {
      expect(result.current).toBe(1);
    });
    await waitFor(() => {
      expect(result.current).toBe(0);
    });
  });

  it("should filter the requests by query key and predicate", async () => {
    const usersRequest = createRequest({ endpoint: "/users" });
    const postsRequest = createRequest({ endpoint: "/posts" });
    mockRequest(usersRequest, { delay: 30 });
    mockRequest(postsRequest, { delay: 30 });

    const { result } = renderHook(() => ({
      exact: useIsFetching(client, { queryKey: usersRequest.queryKey }),
      regex: useIsFetching(client, { queryKey: /posts/ }),
      predicate: useIsFetching(client, { predicate: (request) => request.endpoint === "/missing" }),
    }));

    act(() => {
      client.fetchDispatcher.add(usersRequest);
      client.fetchDispatcher.add(postsRequest);
    });

    await waitFor(() => {
      expect(result.current).toStrictEqual({ exact: 1, regex: 1, predicate: 0 });
    });
    await waitFor(() => {
      expect(result.current).toStrictEqual({ exact: 0, regex: 0, predicate: 0 });
    });
  });

  it("should count canceled requests out", async () => {
    const request = createRequest();
    mockRequest(request, { delay: 1000 });

    const { result } = renderHook(() => useIsFetching(client));

    act(() => {
      client.fetchDispatcher.add(request);
    });
    await waitFor(() => {
      expect(result.current).toBe(1);
    });

    act(() => {
      client.fetchDispatcher.cancelRunningRequests(request.queryKey);
    });

    expect(result.current).toBe(0);
  });

  it("should count the running submit requests separately", async () => {
    const request = createRequest({ method: "POST" });
    mockRequest(request, { delay: 30 });

    const { result } = renderHook(() => ({
      fetching: useIsFetching(client),
      submitting: useIsSubmitting(client),
    }));

    act(() => {
      client.submitDispatcher.add(request);
    });

    await waitFor(() => {
      expect(result.current).toStrictEqual({ fetching: 0, submitting: 1 });
    });
    await waitFor(() => {
      expect(result.current).toStrictEqual({ fetching: 0, submitting: 0 });
    });
  });
});
