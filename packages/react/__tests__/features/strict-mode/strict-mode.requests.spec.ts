import { createHttpMockingServer } from "@hyper-fetch/testing";
import { act, renderHook, waitFor } from "@testing-library/react";
import { useAppManager } from "hooks/use-app-manager";
import { useCache } from "hooks/use-cache";
import { useFetch } from "hooks/use-fetch";
import { useIsFetching } from "hooks/use-is-fetching";
import { useSubmit } from "hooks/use-submit";
import { StrictMode } from "react";

import { client, createRequest } from "../../utils";

const { resetMocks, startServer, stopServer, mockRequest } = createHttpMockingServer();

/**
 * StrictMode mounts, unmounts and mounts every effect again in development.
 * These cases guard the subscriptions that have to survive that cycle.
 */
describe("Requests hooks [ StrictMode ]", () => {
  let request = createRequest({ method: "POST" });

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
    client.clear();
    client.appManager.setOnline(true);
    client.appManager.setFocused(true);
    request = createRequest({ method: "POST" });
  });

  describe("given useAppManager is rendered in StrictMode", () => {
    it("should follow online state changes", async () => {
      const { result } = renderHook(() => useAppManager(client), { wrapper: StrictMode });

      act(() => {
        client.appManager.setOnline(false);
      });
      expect(result.current.isOnline).toBeFalse();

      act(() => {
        client.appManager.setOnline(true);
      });
      expect(result.current.isOnline).toBeTrue();
    });
    it("should follow focus state changes", async () => {
      const { result } = renderHook(() => useAppManager(client), { wrapper: StrictMode });

      act(() => {
        client.appManager.setFocused(false);
      });
      expect(result.current.isFocused).toBeFalse();

      act(() => {
        client.appManager.setFocused(true);
      });
      expect(result.current.isFocused).toBeTrue();
    });
    it("should stop updating after unmount", async () => {
      const { result, unmount } = renderHook(() => useAppManager(client), { wrapper: StrictMode });

      unmount();
      act(() => {
        client.appManager.setOnline(false);
      });

      expect(result.current.isOnline).toBeTrue();
    });
  });

  describe("given useSubmit is rendered in StrictMode", () => {
    it("should receive cache updates made before the first submit", async () => {
      const mock = mockRequest(request);
      const { result } = renderHook(() => useSubmit(request, { dependencyTracking: false }), {
        wrapper: StrictMode,
      });

      expect(result.current.data).toBeNull();

      // Same request sent from outside of the hook, hook has to pick it up from the cache
      await act(async () => {
        await request.send();
      });

      await waitFor(() => {
        expect(result.current.data).toStrictEqual(mock);
      });
    });
    it("should submit and expose the response", async () => {
      const mock = mockRequest(request);
      const { result } = renderHook(() => useSubmit(request, { dependencyTracking: false }), {
        wrapper: StrictMode,
      });

      act(() => {
        result.current.submit();
      });

      await waitFor(() => {
        expect(result.current.data).toStrictEqual(mock);
        expect(result.current.submitting).toBeFalse();
      });
    });
  });

  describe("given selectors are used in StrictMode", () => {
    it("should select the fetched data and follow cache updates", async () => {
      const getRequest = createRequest<{ a: number; b: number }>();
      mockRequest(getRequest, { data: { a: 1, b: 1 } });
      const { result } = renderHook(
        () => ({
          fetched: useFetch(getRequest, { select: (value) => value.a }),
          cached: useCache(getRequest, { select: (value) => value.b }),
        }),
        { wrapper: StrictMode },
      );

      await waitFor(() => {
        expect(result.current.fetched.data).toBe(1);
        expect(result.current.cached.data).toBe(1);
      });

      act(() => {
        client.cache.update(getRequest, (prev) => ({ ...prev, data: { a: 2, b: 3 } }));
      });

      expect(result.current.fetched.data).toBe(2);
      expect(result.current.cached.data).toBe(3);
    });
    it("should count the running requests", async () => {
      const getRequest = createRequest();
      mockRequest(getRequest, { delay: 20 });
      const { result } = renderHook(() => useIsFetching(client), { wrapper: StrictMode });

      act(() => {
        client.fetchDispatcher.add(getRequest);
      });

      await waitFor(() => {
        expect(result.current).toBe(1);
      });
      await waitFor(() => {
        expect(result.current).toBe(0);
      });
    });
  });
});
