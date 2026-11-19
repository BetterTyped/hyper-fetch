import { act, renderHook } from "@testing-library/react";
import { useFetch } from "hooks/use-fetch";

import { client, createRequest } from "../../utils";
import { advance, gateRequest, setCacheResponse, settle } from "../../utils/gate.utils";

type User = { id: number; name: string };

const user: User = { id: 1, name: "Maciej" };

describe("useFetch [ Cache Events ]", () => {
  let request = createRequest<User>();
  let calls = gateRequest(request);

  const renderLoaded = async (options?: Parameters<typeof useFetch<typeof request>>[1]) => {
    const view = renderHook(() => {
      const { data, loading, error, success } = useFetch(request, options);
      return { data, loading, error, success };
    });
    await advance();
    if (calls.length > 0) {
      calls[0].succeed(user);
      await settle();
    }
    return view;
  };

  beforeEach(() => {
    vi.useFakeTimers();
    client.clear();
    request = createRequest<User>();
    calls = gateRequest(request);
  });

  afterEach(() => {
    vi.useRealTimers();
  });

  describe("when the cache is changed from outside", () => {
    it("should show the data saved in the cache", async () => {
      const { result } = await renderLoaded();

      act(() => {
        setCacheResponse(request, { id: 1, name: "External" });
      });

      expect(result.current.data).toStrictEqual({ id: 1, name: "External" });
      expect(calls).toHaveLength(1);
    });
    it("should show the data updated with cache.update", async () => {
      const { result } = await renderLoaded();

      act(() => {
        client.cache.update(request, (previous) => ({ data: { ...(previous?.data as User), name: "Patched" } }));
      });

      expect(result.current.data).toStrictEqual({ id: 1, name: "Patched" });
    });
    it("should show the data saved for the disabled hook", async () => {
      const { result } = await renderLoaded({ disabled: true });

      act(() => {
        setCacheResponse(request, user);
      });

      expect(result.current.data).toStrictEqual(user);
      expect(result.current.success).toBeTrue();
      expect(calls).toHaveLength(0);
    });
    it("should show the response of the request sent outside of the hook", async () => {
      const { result } = await renderLoaded();

      act(() => {
        client.fetchDispatcher.add(request);
      });
      await advance();
      expect(result.current.loading).toBeTrue();

      calls[1].succeed({ id: 1, name: "From outside" });
      await settle();

      expect(result.current.data).toStrictEqual({ id: 1, name: "From outside" });
      expect(result.current.loading).toBeFalse();
    });
    it("should ignore the changes of other cache keys", async () => {
      const { result } = await renderLoaded();

      act(() => {
        setCacheResponse(request.setQueryParams({ page: 2 }), { id: 2, name: "Other" });
      });

      expect(result.current.data).toStrictEqual(user);
    });
  });

  describe("when the cache is invalidated", () => {
    it.each([
      ["request", () => client.cache.invalidate(request)],
      ["cache key", () => client.cache.invalidate(request.cacheKey)],
      ["RegExp", () => client.cache.invalidate(/shared-endpoint/)],
      ["list of keys", () => client.cache.invalidate([request.cacheKey, "other"])],
      ["no arguments", () => client.cache.invalidate()],
    ])("should refetch after the invalidation by %s", async (_, invalidate) => {
      const { result } = await renderLoaded();

      act(() => {
        invalidate();
      });
      await advance();

      expect(calls).toHaveLength(2);
      expect(result.current.loading).toBeTrue();
      expect(result.current.data).toStrictEqual(user);
    });
    it("should not refetch after the invalidation of another key", async () => {
      await renderLoaded();

      act(() => {
        client.cache.invalidate("another-key");
        client.cache.invalidate(/nothing-matches/);
      });
      await advance();

      expect(calls).toHaveLength(1);
    });
    it("should not refetch the disabled hook", async () => {
      setCacheResponse(request, user);
      await renderLoaded({ disabled: true });

      act(() => {
        client.cache.invalidate(request);
      });
      await advance();

      expect(calls).toHaveLength(0);
    });
    it("should send one request for many hooks of the invalidated key", async () => {
      await renderLoaded();
      renderHook(() => useFetch(request, { revalidate: false }).data);
      renderHook(() => useFetch(request, { revalidate: false }).data);

      act(() => {
        client.cache.invalidate(request);
      });
      await advance();

      expect(calls).toHaveLength(2);
    });
    it("should not refetch after unmount", async () => {
      const { unmount } = await renderLoaded();

      unmount();
      act(() => {
        client.cache.invalidate(request);
      });
      await advance();

      expect(calls).toHaveLength(1);
    });
    it("should refetch on the next mount after the invalidation without mounted hooks", async () => {
      const { unmount } = await renderLoaded({ revalidate: false });
      unmount();

      act(() => {
        client.cache.invalidate(request);
      });
      renderHook(() => useFetch(request, { revalidate: false }).data);
      await advance();

      expect(calls).toHaveLength(2);
    });
  });

  describe("when the cache entry is deleted", () => {
    it("should keep the data visible and refetch it", async () => {
      const { result } = await renderLoaded();

      act(() => {
        client.cache.delete(request.cacheKey);
      });
      await advance();

      expect(result.current.data).toStrictEqual(user);
      expect(result.current.loading).toBeTrue();
      expect(calls).toHaveLength(2);
    });
    it("should not refetch the disabled hook", async () => {
      setCacheResponse(request, user);
      const { result } = await renderLoaded({ disabled: true });

      act(() => {
        client.cache.delete(request.cacheKey);
      });
      await advance();

      expect(calls).toHaveLength(0);
      expect(result.current.data).toStrictEqual(user);
    });
  });

  describe("when the cache is disabled for the request", () => {
    it("should show the response without saving it", async () => {
      request = createRequest<User>({ cache: false });
      calls = gateRequest(request);

      const { result } = await renderLoaded();

      expect(result.current.data).toStrictEqual(user);
      expect(client.cache.get(request.cacheKey)).toBeUndefined();
    });
  });
});
