import { act, renderHook } from "@testing-library/react";
import { useCache } from "hooks/use-cache";
import { useFetch } from "hooks/use-fetch";

import { client, createRequest } from "../../utils";
import { advance, gateRequest, setCacheResponse, settle } from "../../utils/gate.utils";

type Data = { owner: string };

/**
 * Scoped requests keep their cache, queue and abort keys separated with the `setScope` prefix,
 * while the events are emitted with the plain keys - hooks must handle only the events of their own scope.
 */
describe("useFetch [ Scope ]", () => {
  let request = createRequest<Data>();
  let calls = gateRequest(request);

  const callOf = (scope: string | null) => {
    const call = calls.find((item) => item.request.scope === scope);
    if (!call) {
      throw new Error(`Request of scope ${scope} was not sent`);
    }
    return call;
  };

  const renderScoped = (scope: string | null, options?: { revalidate?: boolean; disabled?: boolean }) => {
    const scoped = scope ? request.setScope(scope) : request;
    return renderHook(() => {
      const { data, loading, error, refetch } = useFetch(scoped, options);
      return { data, loading, error, refetch };
    });
  };

  beforeEach(() => {
    vi.useFakeTimers();
    client.clear();
    request = createRequest<Data>();
    calls = gateRequest(request);
  });

  afterEach(() => {
    vi.useRealTimers();
  });

  describe("when the scoped request is fetched", () => {
    it("should store the response under the scoped key", async () => {
      const { result } = renderScoped("a");
      await advance();
      callOf("a").succeed({ owner: "a" });
      await settle();

      expect(result.current.data).toStrictEqual({ owner: "a" });
      expect(client.cache.keys()).toStrictEqual([`a__${request.cacheKey}`]);
    });
    it("should be in the loading state during the refetch", async () => {
      const { result } = renderScoped("a");
      await advance();
      callOf("a").succeed({ owner: "a" });
      await settle();
      expect(result.current.loading).toBeFalse();

      act(() => {
        result.current.refetch();
      });
      await advance();

      expect(result.current.loading).toBeTrue();

      calls[1].succeed({ owner: "a2" });
      await settle();

      expect(result.current.loading).toBeFalse();
      expect(result.current.data).toStrictEqual({ owner: "a2" });
    });
    it("should read the scoped cache on mount", async () => {
      setCacheResponse(request.setScope("a"), { owner: "a" });

      const { result } = renderScoped("a", { revalidate: false });
      await advance();

      expect(result.current.data).toStrictEqual({ owner: "a" });
      expect(calls).toHaveLength(0);
    });
    it("should join the running request of the same scope", async () => {
      act(() => {
        client.fetchDispatcher.add(request.setScope("a"));
      });
      await advance();

      renderScoped("a");
      await advance();

      expect(calls).toHaveLength(1);
    });
  });

  describe("when the same request is used in different scopes", () => {
    it("should send a request for every scope", async () => {
      renderScoped("a");
      renderScoped("b");
      renderScoped(null);
      await advance();

      expect(calls.map((call) => call.request.scope).toSorted()).toStrictEqual(["a", "b", null].toSorted());
    });
    it("should not show the data of another scope", async () => {
      const scopeA = renderScoped("a");
      const scopeB = renderScoped("b");
      const unscoped = renderScoped(null);
      await advance();

      callOf("a").succeed({ owner: "a" });
      await settle();

      expect(scopeA.result.current.data).toStrictEqual({ owner: "a" });
      expect(scopeB.result.current.data).toBeNull();
      expect(unscoped.result.current.data).toBeNull();
      expect(scopeB.result.current.loading).toBeTrue();
      expect(unscoped.result.current.loading).toBeTrue();
    });
    it("should not show the error of another scope", async () => {
      const scopeA = renderScoped("a");
      const scopeB = renderScoped("b");
      await advance();

      callOf("a").fail(new Error("Scope a failed"));
      await settle();

      expect(scopeA.result.current.error?.message).toBe("Scope a failed");
      expect(scopeB.result.current.error).toBeNull();
    });
    it("should not show the unscoped data in the scoped hook", async () => {
      const scopeA = renderScoped("a");
      const unscoped = renderScoped(null);
      await advance();

      callOf(null).succeed({ owner: "nobody" });
      await settle();

      expect(unscoped.result.current.data).toStrictEqual({ owner: "nobody" });
      expect(scopeA.result.current.data).toBeNull();
    });
    it("should keep the scopes separated in useCache", async () => {
      const cacheB = renderHook(() => useCache(request.setScope("b")).data);
      renderScoped("a");
      await advance();

      callOf("a").succeed({ owner: "a" });
      await settle();

      expect(cacheB.result.current).toBeNull();
    });
    it("should not change the loading state of another scope", async () => {
      const scopeA = renderScoped("a", { disabled: true });
      renderScoped("b");
      await advance();

      expect(scopeA.result.current.loading).toBeFalse();
    });
    it("should call the callbacks of the matching scope only", async () => {
      const onSuccessA = vi.fn();
      const onSuccessB = vi.fn();
      renderHook(() => {
        useFetch(request.setScope("a")).onSuccess(onSuccessA);
        useFetch(request.setScope("b")).onSuccess(onSuccessB);
      });
      await advance();

      callOf("a").succeed({ owner: "a" });
      await settle();

      expect(onSuccessA).toHaveBeenCalledOnce();
      expect(onSuccessB).not.toHaveBeenCalled();
    });
  });

  describe("when the scoped cache changes", () => {
    it("should refetch after invalidation by the request", async () => {
      renderScoped("a");
      await advance();
      callOf("a").succeed({ owner: "a" });
      await settle();

      act(() => {
        client.cache.invalidate(request.setScope("a"));
      });
      await advance();

      expect(calls).toHaveLength(2);
    });
    it("should refetch after invalidation by RegExp", async () => {
      renderScoped("a");
      await advance();
      callOf("a").succeed({ owner: "a" });
      await settle();

      act(() => {
        client.cache.invalidate(/shared-endpoint/);
      });
      await advance();

      expect(calls).toHaveLength(2);
    });
    it("should refetch after invalidation of the whole cache", async () => {
      renderScoped("a");
      await advance();
      callOf("a").succeed({ owner: "a" });
      await settle();

      act(() => {
        client.cache.invalidate();
      });
      await advance();

      expect(calls).toHaveLength(2);
    });
    it("should not refetch when the request of another scope is invalidated", async () => {
      renderScoped("a");
      await advance();
      callOf("a").succeed({ owner: "a" });
      await settle();
      setCacheResponse(request.setScope("b"), { owner: "b" });

      act(() => {
        client.cache.invalidate(request.setScope("b"));
        client.cache.invalidate(`b__${request.cacheKey}`);
      });
      await advance();

      expect(calls).toHaveLength(1);
    });
    it("should not refetch when the unscoped request is invalidated", async () => {
      renderScoped("a");
      await advance();
      callOf("a").succeed({ owner: "a" });
      await settle();

      act(() => {
        client.cache.invalidate(request);
      });
      await advance();

      expect(calls).toHaveLength(1);
    });
    it("should not refetch when the entry of another scope is deleted", async () => {
      renderScoped("a");
      await advance();
      callOf("a").succeed({ owner: "a" });
      await settle();
      setCacheResponse(request.setScope("b"), { owner: "b" });

      act(() => {
        client.cache.delete(`b__${request.cacheKey}`);
      });
      await advance();

      expect(calls).toHaveLength(1);
    });
    it("should refetch every scope once when the whole cache is invalidated", async () => {
      renderScoped("a");
      renderScoped("b");
      await advance();
      callOf("a").succeed({ owner: "a" });
      callOf("b").succeed({ owner: "b" });
      await settle();

      act(() => {
        client.cache.invalidate();
      });
      await advance();

      expect(calls.map((call) => call.request.scope)).toStrictEqual(["a", "b", "a", "b"]);
    });
    it("should refetch after the scoped entry is deleted", async () => {
      renderScoped("a");
      await advance();
      callOf("a").succeed({ owner: "a" });
      await settle();

      act(() => {
        client.cache.delete(`a__${request.cacheKey}`);
      });
      await advance();

      expect(calls).toHaveLength(2);
    });
    it("should follow the updates of the scoped cache", async () => {
      const { result } = renderScoped("a");
      await advance();
      callOf("a").succeed({ owner: "a" });
      await settle();

      act(() => {
        setCacheResponse(request.setScope("a"), { owner: "updated" });
      });

      expect(result.current.data).toStrictEqual({ owner: "updated" });
    });
  });

  describe("when the scope changes", () => {
    it("should switch to the data of the new scope", async () => {
      setCacheResponse(request.setScope("a"), { owner: "a" });
      setCacheResponse(request.setScope("b"), { owner: "b" });
      const { result, rerender } = renderHook(
        ({ scope }) => {
          const { data } = useFetch(request.setScope(scope), { revalidate: false });
          return { data };
        },
        { initialProps: { scope: "a" } },
      );
      expect(result.current.data).toStrictEqual({ owner: "a" });

      rerender({ scope: "b" });

      expect(result.current.data).toStrictEqual({ owner: "b" });
    });
    it("should not keep the data of the previous scope", async () => {
      setCacheResponse(request.setScope("a"), { owner: "a" });
      const { result, rerender } = renderHook(
        ({ scope }) => {
          const { data } = useFetch(request.setScope(scope), { revalidate: false });
          return { data };
        },
        { initialProps: { scope: "a" } },
      );

      rerender({ scope: "b" });

      expect(result.current.data).toBeNull();
    });
  });
});
