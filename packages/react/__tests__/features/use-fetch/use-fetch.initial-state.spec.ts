import type { RequestInstance } from "@hyper-fetch/core";
import { act, renderHook } from "@testing-library/react";
import type { UseFetchOptionsType } from "hooks/use-fetch";
import { useFetch } from "hooks/use-fetch";

import { client, createRequest } from "../../utils";
import { advance, gateRequest, setCacheResponse, settle } from "../../utils/gate.utils";

type User = { id: number; name: string };

const user: User = { id: 1, name: "Maciej" };

/**
 * Renders the hook and records the values returned by every render,
 * so the very first render (before any effect) can be asserted.
 */
const renderWithHistory = <T extends RequestInstance>(request: T, options?: UseFetchOptionsType<T>) => {
  const renders: { data: unknown; loading: boolean; success: boolean; status: unknown; error: unknown }[] = [];
  const view = renderHook(() => {
    const state = useFetch(request, options);
    renders.push({
      data: state.data,
      loading: state.loading,
      success: state.success,
      status: state.status,
      error: state.error,
    });
    return state;
  });
  return { ...view, renders };
};

describe("useFetch [ Initial State ]", () => {
  let request = createRequest<User>();
  let calls = gateRequest(request);

  beforeEach(() => {
    vi.useFakeTimers();
    client.clear();
    request = createRequest<User>();
    calls = gateRequest(request);
  });

  afterEach(() => {
    vi.useRealTimers();
  });

  describe("when there is no data", () => {
    it("should start with empty loading state", async () => {
      const { result, renders } = renderWithHistory(request);

      expect(renders[0]).toStrictEqual({ data: null, loading: true, success: false, status: null, error: null });
      expect(result.current.retries).toBe(0);
      expect(result.current.responseTimestamp).toBeNull();
      expect(result.current.requestTimestamp).toBeNull();
    });
    it("should send exactly one request", async () => {
      renderWithHistory(request);
      await advance();

      expect(calls).toHaveLength(1);
    });
    it.each([true, false])("should send the request when revalidate is %s", async (revalidate) => {
      const { renders } = renderWithHistory(request, { revalidate });
      await advance();

      expect(renders[0].loading).toBeTrue();
      expect(calls).toHaveLength(1);
    });
    it("should not load nor send the request when disabled", async () => {
      const { renders } = renderWithHistory(request, { disabled: true });
      await advance();

      expect(renders).toHaveLength(1);
      expect(renders[0]).toStrictEqual({ data: null, loading: false, success: false, status: null, error: null });
      expect(calls).toHaveLength(0);
    });
    it("should expose the default adapter extra", async () => {
      const { result } = renderWithHistory(request);

      expect(result.current.extra).toStrictEqual(client.adapter.defaultExtra);
    });
  });

  describe("when cache holds fresh data", () => {
    beforeEach(() => {
      setCacheResponse(request, user);
    });

    it("should return cached data on the very first render", async () => {
      const { renders, result } = renderWithHistory(request);

      expect(renders[0].data).toStrictEqual(user);
      expect(renders[0].success).toBeTrue();
      expect(renders[0].status).toBe(200);
      expect(renders[0].error).toBeNull();
      expect(result.current.responseTimestamp).toBeDate();
      expect(result.current.requestTimestamp).toBeDate();
    });
    it("should revalidate it in the background by default", async () => {
      const { result } = renderWithHistory(request);
      await advance();

      expect(calls).toHaveLength(1);
      expect(result.current.loading).toBeTrue();
      expect(result.current.data).toStrictEqual(user);
    });
    it("should not send any request when revalidate is off", async () => {
      const { renders } = renderWithHistory(request, { revalidate: false });
      await advance();

      expect(calls).toHaveLength(0);
      expect(renders.every((render) => !render.loading)).toBeTrue();
      expect(renders.at(-1)?.data).toStrictEqual(user);
    });
    it("should not send any request when disabled", async () => {
      const { renders } = renderWithHistory(request, { disabled: true });
      await advance();

      expect(calls).toHaveLength(0);
      expect(renders.every((render) => !render.loading)).toBeTrue();
      expect(renders.at(-1)?.data).toStrictEqual(user);
    });
    it("should keep the cached data reference", async () => {
      const cached = client.cache.get(request.cacheKey)?.data;
      const { result } = renderWithHistory(request, { revalidate: false });

      expect(result.current.data).toBe(cached);
    });
  });

  describe("when the cache data got updated locally", () => {
    beforeEach(() => {
      request = createRequest<User>({ staleTime: 1000 });
      calls = gateRequest(request);
      setCacheResponse(request, user);
      vi.advanceTimersByTime(800);
      client.cache.update(request, { data: { id: 1, name: "Updated locally" } });
      // Stale when counted from the response, fresh when counted from the update
      vi.advanceTimersByTime(800);
    });

    it("should count the stale time from the update and not refetch", async () => {
      const { result } = renderWithHistory(request, { revalidate: false });
      await advance();

      expect(calls).toHaveLength(0);
      expect(result.current.data).toStrictEqual({ id: 1, name: "Updated locally" });
    });
  });

  describe("when cache holds stale data", () => {
    beforeEach(() => {
      request = createRequest<User>({ staleTime: 1000 });
      calls = gateRequest(request);
      setCacheResponse(request, user);
      vi.advanceTimersByTime(1001);
    });

    it("should show stale data while revalidating", async () => {
      const { renders, result } = renderWithHistory(request);
      await advance();

      expect(renders[0].data).toStrictEqual(user);
      expect(result.current.data).toStrictEqual(user);
      expect(result.current.loading).toBeTrue();
      expect(calls).toHaveLength(1);
    });
    it("should refetch stale data even when revalidate is off", async () => {
      const { result } = renderWithHistory(request, { revalidate: false });
      await advance();

      expect(calls).toHaveLength(1);
      expect(result.current.loading).toBeTrue();
      expect(result.current.data).toStrictEqual(user);
    });
    it("should not refetch stale data when disabled", async () => {
      const { result } = renderWithHistory(request, { disabled: true });
      await advance();

      expect(calls).toHaveLength(0);
      expect(result.current.loading).toBeFalse();
      expect(result.current.data).toStrictEqual(user);
    });
    it("should replace stale data with the response", async () => {
      const { result } = renderWithHistory(request);
      await advance();

      calls[0].succeed({ id: 1, name: "Updated" });
      await settle();

      expect(result.current.data).toStrictEqual({ id: 1, name: "Updated" });
      expect(result.current.loading).toBeFalse();
    });
    it("should treat data right before the stale time as fresh", async () => {
      client.clear();
      request = createRequest<User>({ staleTime: 1000 });
      calls = gateRequest(request);
      setCacheResponse(request, user);
      vi.advanceTimersByTime(999);

      renderWithHistory(request, { revalidate: false });
      await advance();

      expect(calls).toHaveLength(0);
    });
  });

  describe("when initial response is provided", () => {
    const initialResponse = { data: { id: 99, name: "Initial" }, status: 200, success: true };

    it("should return it on the very first render", async () => {
      const { renders } = renderWithHistory(request, { initialResponse });

      expect(renders[0].data).toStrictEqual(initialResponse.data);
      expect(renders[0].status).toBe(200);
      expect(renders[0].success).toBeTrue();
    });
    it("should still fetch the real data", async () => {
      const { result } = renderWithHistory(request, { initialResponse });
      await advance();
      expect(calls).toHaveLength(1);

      calls[0].succeed(user);
      await settle();

      expect(result.current.data).toStrictEqual(user);
    });
    it("should keep it without any request when disabled", async () => {
      const { result } = renderWithHistory(request, { initialResponse, disabled: true });
      await advance();

      expect(calls).toHaveLength(0);
      expect(result.current.data).toStrictEqual(initialResponse.data);
      expect(result.current.loading).toBeFalse();
    });
    it("should prefer the cached data", async () => {
      setCacheResponse(request, user);
      const { renders } = renderWithHistory(request, { initialResponse, revalidate: false });

      expect(renders[0].data).toStrictEqual(user);
    });
    it("should not write the initial response to the cache", async () => {
      renderWithHistory(request, { initialResponse, disabled: true });
      await advance();

      expect(client.cache.get(request.cacheKey)).toBeUndefined();
    });
    it.each([0, false, ""])("should accept falsy initial data: %j", async (data) => {
      const falsyRequest = createRequest<typeof data>();
      const { renders } = renderWithHistory(falsyRequest, { initialResponse: { data }, disabled: true });

      expect(renders[0].data).toBe(data);
    });
    it("should allow to pass an error as initial response", async () => {
      const error = new Error("Initial error");
      const { renders } = renderWithHistory(request, {
        initialResponse: { data: null, error, success: false, status: 500 },
        disabled: true,
      });

      expect(renders[0]).toStrictEqual({ data: null, loading: false, success: false, status: 500, error });
    });
  });

  describe("when the request is already running", () => {
    it("should join the running request instead of sending another one", async () => {
      act(() => {
        client.fetchDispatcher.add(request);
      });
      await advance();

      const { renders, result } = renderWithHistory(request);
      await advance();

      expect(renders[0].loading).toBeTrue();
      expect(calls).toHaveLength(1);

      calls[0].succeed(user);
      await settle();

      expect(result.current.data).toStrictEqual(user);
      expect(result.current.loading).toBeFalse();
    });
    it("should show loading in the disabled hook", async () => {
      act(() => {
        client.fetchDispatcher.add(request);
      });
      await advance();

      const { renders, result } = renderWithHistory(request, { disabled: true });

      expect(renders[0].loading).toBeTrue();

      calls[0].succeed(user);
      await settle();

      expect(calls).toHaveLength(1);
      expect(result.current.data).toStrictEqual(user);
      expect(result.current.loading).toBeFalse();
    });
    it("should not start in loading state when the queue is stopped", async () => {
      act(() => {
        client.fetchDispatcher.stop(request.queryKey);
      });

      const { renders } = renderWithHistory(request);

      expect(renders[0].loading).toBeFalse();
    });
  });

  describe("when options are passed as undefined", () => {
    it("should use the default values", async () => {
      setCacheResponse(request, user);
      const { result } = renderWithHistory(request, {
        revalidate: undefined,
        disabled: undefined,
        dependencies: undefined,
        deepCompare: undefined,
        refresh: undefined,
        refreshTime: undefined,
        initialResponse: undefined,
        keepPreviousData: undefined,
      });
      await advance();

      // Default revalidation still happens
      expect(calls).toHaveLength(1);
      expect(result.current.data).toStrictEqual(user);
    });
  });

  describe("when options are not passed", () => {
    it("should work without the options argument", async () => {
      const { result } = renderHook(() => {
        const { data } = useFetch(request);
        return { data };
      });
      await advance();

      calls[0].succeed(user);
      await settle();

      expect(result.current.data).toStrictEqual(user);
    });
    it("should work with empty options", async () => {
      const { result } = renderHook(() => {
        const { data } = useFetch(request, {});
        return { data };
      });
      await advance();

      calls[0].succeed(user);
      await settle();

      expect(result.current.data).toStrictEqual(user);
    });
  });
});
