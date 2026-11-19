import { act, renderHook } from "@testing-library/react";
import { useCache } from "hooks/use-cache";
import { useFetch } from "hooks/use-fetch";
import { StrictMode } from "react";

import { client, createRequest } from "../../utils";
import { advance, countListeners, gateRequest, setCacheResponse, settle } from "../../utils/gate.utils";

type User = { id: number; name: string };

const user: User = { id: 1, name: "Maciej" };

describe("useCache [ State ]", () => {
  let request = createRequest<User, any, "/users/:id">({ endpoint: "/users/:id" });
  let calls = gateRequest(request);

  const userRequest = (id = 1) => request.setParams({ id });

  const renderUserCache = (id = 1, wrapper?: typeof StrictMode) => {
    const counter = { renders: 0 };
    const view = renderHook(
      (props: { id: number }) => {
        counter.renders += 1;
        const state = useCache(userRequest(props.id));
        return {
          data: state.data,
          loading: state.loading,
          error: state.error,
          success: state.success,
          status: state.status,
          actions: state,
        };
      },
      { initialProps: { id }, wrapper },
    );
    return { ...view, counter };
  };

  beforeEach(() => {
    vi.useFakeTimers();
    client.clear();
    request = createRequest<User, any, "/users/:id">({ endpoint: "/users/:id" });
    calls = gateRequest(request);
  });

  afterEach(() => {
    vi.useRealTimers();
  });

  describe("when the cache is empty", () => {
    it("should return empty state without loading", async () => {
      const { result } = renderUserCache();

      expect(result.current.data).toBeNull();
      expect(result.current.error).toBeNull();
      expect(result.current.loading).toBeFalse();
      expect(result.current.success).toBeFalse();
      expect(result.current.status).toBeNull();
    });
    it("should never send a request", async () => {
      const { rerender } = renderUserCache();
      rerender({ id: 2 });
      act(() => {
        client.appManager.setFocused(true);
        client.appManager.setOnline(true);
      });
      await advance(60_000);

      expect(calls).toHaveLength(0);
    });
    it("should receive the data fetched by another hook", async () => {
      const { result } = renderUserCache();
      renderHook(() => useFetch(userRequest()).data);
      await advance();

      expect(result.current.loading).toBeTrue();

      calls[0].succeed(user);
      await settle();

      expect(result.current.data).toStrictEqual(user);
      expect(result.current.loading).toBeFalse();
      expect(result.current.success).toBeTrue();
    });
    it("should receive the error of the request sent by another hook", async () => {
      const { result } = renderUserCache();
      renderHook(() => useFetch(userRequest()).data);
      await advance();
      calls[0].fail(new Error("Failed"), 500);
      await settle();

      expect(result.current.error?.message).toBe("Failed");
      expect(result.current.status).toBe(500);
      expect(result.current.success).toBeFalse();
    });
    it("should receive the data set directly in the cache", async () => {
      const { result } = renderUserCache();

      act(() => {
        setCacheResponse(userRequest(), user);
      });

      expect(result.current.data).toStrictEqual(user);
    });
  });

  describe("when the cache has data", () => {
    beforeEach(() => {
      setCacheResponse(userRequest(), user);
    });

    it("should return it on the first render", async () => {
      const { result, counter } = renderUserCache();

      expect(result.current.data).toStrictEqual(user);
      expect(result.current.success).toBeTrue();
      expect(result.current.status).toBe(200);
      expect(counter.renders).toBe(1);
    });
    it("should not send a request for stale data", async () => {
      await advance(60 * 60 * 1000);
      setCacheResponse(userRequest(), user, Date.now() - 60 * 60 * 1000);

      renderUserCache();
      await advance();

      expect(calls).toHaveLength(0);
    });
    it("should follow the cache updates", async () => {
      const { result } = renderUserCache();

      act(() => {
        client.cache.update(userRequest(), { data: { id: 1, name: "Updated" } });
      });

      expect(result.current.data).toStrictEqual({ id: 1, name: "Updated" });
    });
    it("should not rerender when the cache gets equal data", async () => {
      const { counter } = renderUserCache();

      act(() => {
        client.cache.update(userRequest(), { data: { ...user } });
      });

      expect(counter.renders).toBe(1);
    });
    it("should keep the data when the request fails later", async () => {
      const { result } = renderUserCache();
      act(() => {
        client.fetchDispatcher.add(userRequest());
      });
      await advance();
      calls[0].fail(new Error("Failed"));
      await settle();

      expect(result.current.data).toStrictEqual(user);
      expect(result.current.error?.message).toBe("Failed");
    });
    it("should work in StrictMode", async () => {
      const { result } = renderUserCache(1, StrictMode);

      act(() => {
        client.cache.update(userRequest(), { data: { id: 1, name: "Updated" } });
      });

      expect(result.current.data).toStrictEqual({ id: 1, name: "Updated" });
    });
  });

  describe("when the request key changes", () => {
    it("should show the cached data of the new key on the first render with it", async () => {
      setCacheResponse(userRequest(1), user);
      setCacheResponse(userRequest(2), { id: 2, name: "Second" });
      const { result, rerender } = renderUserCache(1);

      rerender({ id: 2 });

      expect(result.current.data).toStrictEqual({ id: 2, name: "Second" });
    });
    it("should return empty state for the key without cache", async () => {
      setCacheResponse(userRequest(1), user);
      const { result, rerender } = renderUserCache(1);

      rerender({ id: 2 });

      expect(result.current.data).toBeNull();
      expect(result.current.success).toBeFalse();
    });
    it("should not keep the data of the previous query params", async () => {
      const listRequest = createRequest<{ page: number }, any, "/users">({ endpoint: "/users" });
      setCacheResponse(listRequest.setQueryParams({ page: 1 }), { page: 1 });
      const { result, rerender } = renderHook(({ page }) => useCache(listRequest.setQueryParams({ page })).data, {
        initialProps: { page: 1 },
      });
      expect(result.current).toStrictEqual({ page: 1 });

      rerender({ page: 2 });

      expect(result.current).toBeNull();
    });
    it("should follow the cache of the new key only", async () => {
      const { result, rerender } = renderUserCache(1);
      rerender({ id: 2 });

      act(() => {
        setCacheResponse(userRequest(1), user);
      });
      expect(result.current.data).toBeNull();

      act(() => {
        setCacheResponse(userRequest(2), { id: 2, name: "Second" });
      });
      expect(result.current.data).toStrictEqual({ id: 2, name: "Second" });
    });
  });

  describe("when using the actions", () => {
    it("should refetch the mounted useFetch hooks on invalidate", async () => {
      const { result } = renderUserCache();
      renderHook(() => useFetch(userRequest()).data);
      await advance();
      calls[0].succeed(user);
      await settle();

      act(() => {
        result.current.actions.invalidate();
      });
      await advance();

      expect(calls).toHaveLength(2);
    });
    it("should not refetch anything on invalidate without mounted useFetch hooks", async () => {
      setCacheResponse(userRequest(), user);
      const { result } = renderUserCache();

      act(() => {
        result.current.actions.invalidate();
      });
      await advance();

      expect(calls).toHaveLength(0);
    });
    it("should mark the cache entry as stale on invalidate", async () => {
      setCacheResponse(userRequest(), user);
      const { result } = renderUserCache();

      act(() => {
        result.current.actions.invalidate();
      });

      expect(client.cache.get(userRequest().cacheKey)?.staleTime).toBe(0);
    });
    it("should invalidate other requests by the given key", async () => {
      const { result } = renderUserCache(1);
      renderHook(() => useFetch(userRequest(2)).data);
      await advance();
      calls[0].succeed({ id: 2, name: "Second" });
      await settle();

      act(() => {
        result.current.actions.invalidate(userRequest(2));
      });
      await advance();

      expect(calls).toHaveLength(2);
      expect(calls[1].request.endpoint).toBe("/users/2");
    });
    it("should keep setData local to the hook", async () => {
      setCacheResponse(userRequest(), user);
      const { result } = renderUserCache();
      const other = renderUserCache();

      act(() => {
        result.current.actions.setData({ id: 1, name: "Local" });
      });

      expect(result.current.data).toStrictEqual({ id: 1, name: "Local" });
      expect(other.result.current.data).toStrictEqual(user);
      expect(client.cache.get(userRequest().cacheKey)?.data).toStrictEqual(user);
    });
    it("should reset the hook state with clearState and keep the cache", async () => {
      setCacheResponse(userRequest(), user);
      const { result } = renderUserCache();

      act(() => {
        result.current.actions.clearState();
      });

      expect(result.current.data).toBeNull();
      expect(result.current.success).toBeFalse();
      expect(client.cache.get(userRequest().cacheKey)?.data).toStrictEqual(user);
    });
    it("should keep the identity of the state actions between renders", async () => {
      const { result, rerender } = renderUserCache();
      const { setData, setError, setLoading, clearState } = result.current.actions;

      rerender({ id: 1 });

      expect(result.current.actions.setData).toBe(setData);
      expect(result.current.actions.setError).toBe(setError);
      expect(result.current.actions.setLoading).toBe(setLoading);
      expect(result.current.actions.clearState).toBe(clearState);
    });
  });

  describe("when the hook unmounts", () => {
    it("should remove all the listeners", async () => {
      const baseline = countListeners(client);
      const { unmount, rerender } = renderUserCache();
      rerender({ id: 2 });
      expect(countListeners(client)).not.toStrictEqual(baseline);

      unmount();

      expect(countListeners(client)).toStrictEqual(baseline);
    });
    it("should remove all the listeners in StrictMode", async () => {
      const baseline = countListeners(client);
      const { unmount } = renderUserCache(1, StrictMode);

      unmount();

      expect(countListeners(client)).toStrictEqual(baseline);
    });
  });
});
