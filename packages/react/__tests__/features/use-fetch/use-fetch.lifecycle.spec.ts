import { act, renderHook } from "@testing-library/react";
import { useFetch } from "hooks/use-fetch";

import { client, createRequest } from "../../utils";
import { advance, gateRequest, setCacheResponse, settle } from "../../utils/gate.utils";

type User = { id: number; name: string };
type Snapshot = { data: User | null; error: string | null; loading: boolean; success: boolean; status: number | null };

const user: User = { id: 1, name: "Maciej" };
const updatedUser: User = { id: 1, name: "Updated" };

describe("useFetch [ Lifecycle ]", () => {
  let request = createRequest<User>();
  let calls = gateRequest(request);

  /**
   * Records distinct states returned by the hook in the order of rendering
   */
  const renderLifecycle = (options?: Parameters<typeof useFetch<typeof request>>[1]) => {
    const history: Snapshot[] = [];
    const view = renderHook(() => {
      const state = useFetch(request, options);
      const snapshot: Snapshot = {
        data: state.data,
        error: state.error?.message ?? null,
        loading: state.loading,
        success: state.success,
        status: state.status as number | null,
      };
      if (JSON.stringify(history.at(-1)) !== JSON.stringify(snapshot)) {
        history.push(snapshot);
      }
      return state;
    });
    return { ...view, history };
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

  describe("when the first request succeeds", () => {
    it("should go from loading to success in a single step", async () => {
      const { history } = renderLifecycle();
      await advance();
      calls[0].succeed(user);
      await settle();

      expect(history).toStrictEqual([
        { data: null, error: null, loading: true, success: false, status: null },
        { data: user, error: null, loading: false, success: true, status: 200 },
      ]);
    });
    it("should never render an empty state without loading", async () => {
      const { history } = renderLifecycle();
      await advance();
      calls[0].succeed(user);
      await settle();

      const hasFlicker = history.some((state) => !state.loading && state.data === null && state.error === null);
      expect(hasFlicker).toBeFalse();
    });
    it("should set the timestamps and retries", async () => {
      const { result } = renderLifecycle();
      await advance();
      calls[0].succeed(user);
      await settle();

      expect(result.current.responseTimestamp).toBeDate();
      expect(result.current.requestTimestamp).toBeDate();
      expect(result.current.retries).toBe(0);
    });
    it("should save the response in the cache", async () => {
      renderLifecycle();
      await advance();
      calls[0].succeed(user);
      await settle();

      expect(client.cache.get(request.cacheKey)?.data).toStrictEqual(user);
    });
    it("should expose the custom status of the response", async () => {
      const { result } = renderLifecycle();
      await advance();
      calls[0].succeed(user, 201);
      await settle();

      expect(result.current.status).toBe(201);
    });
  });

  describe("when the first request fails", () => {
    it("should go from loading to error in a single step", async () => {
      const { history } = renderLifecycle();
      await advance();
      calls[0].fail(new Error("Not found"), 404);
      await settle();

      expect(history).toStrictEqual([
        { data: null, error: null, loading: true, success: false, status: null },
        { data: null, error: "Not found", loading: false, success: false, status: 404 },
      ]);
    });
    it("should not save the error in the cache", async () => {
      renderLifecycle();
      await advance();
      calls[0].fail();
      await settle();

      expect(client.cache.get(request.cacheKey)).toBeUndefined();
    });
    it("should not send another request on its own", async () => {
      renderLifecycle();
      await advance();
      calls[0].fail();
      await settle();
      await advance(60_000);

      expect(calls).toHaveLength(1);
    });
  });

  describe("when refetching", () => {
    it("should keep the data visible while loading the new one", async () => {
      const { result, history } = renderLifecycle();
      await advance();
      calls[0].succeed(user);
      await settle();

      act(() => {
        result.current.refetch();
      });
      await advance();
      calls[1].succeed(updatedUser);
      await settle();

      expect(history).toStrictEqual([
        { data: null, error: null, loading: true, success: false, status: null },
        { data: user, error: null, loading: false, success: true, status: 200 },
        { data: user, error: null, loading: true, success: true, status: 200 },
        { data: updatedUser, error: null, loading: false, success: true, status: 200 },
      ]);
    });
    it("should keep the data reference when the same response comes back", async () => {
      const { result } = renderLifecycle();
      await advance();
      calls[0].succeed(user);
      await settle();
      const firstData = result.current.data;

      act(() => {
        result.current.refetch();
      });
      await advance();
      calls[1].succeed({ ...user });
      await settle();

      expect(result.current.data).toBe(firstData);
    });
    it("should keep the last data and show the error when refetch fails", async () => {
      const { result, history } = renderLifecycle();
      await advance();
      calls[0].succeed(user);
      await settle();

      act(() => {
        result.current.refetch();
      });
      await advance();
      calls[1].fail(new Error("Server error"), 500);
      await settle();

      expect(history.at(-1)).toStrictEqual({
        data: user,
        error: "Server error",
        loading: false,
        success: false,
        status: 500,
      });
    });
    it("should keep the valid data in the cache when refetch fails", async () => {
      const { result } = renderLifecycle();
      await advance();
      calls[0].succeed(user);
      await settle();

      act(() => {
        result.current.refetch();
      });
      await advance();
      calls[1].fail();
      await settle();

      expect(client.cache.get(request.cacheKey)?.data).toStrictEqual(user);
      expect(client.cache.get(request.cacheKey)?.success).toBeTrue();
    });
    it("should keep the error visible while retrying manually", async () => {
      const { result, history } = renderLifecycle();
      await advance();
      calls[0].fail(new Error("First"), 500);
      await settle();

      act(() => {
        result.current.refetch();
      });
      await advance();

      expect(history.at(-1)).toStrictEqual({ data: null, error: "First", loading: true, success: false, status: 500 });
    });
    it("should clear the error after a successful refetch", async () => {
      const { result, history } = renderLifecycle();
      await advance();
      calls[0].fail(new Error("First"), 500);
      await settle();

      act(() => {
        result.current.refetch();
      });
      await advance();
      calls[1].succeed(user);
      await settle();

      expect(history.at(-1)).toStrictEqual({ data: user, error: null, loading: false, success: true, status: 200 });
    });
    it("should replace the error with the next error", async () => {
      const { result } = renderLifecycle();
      await advance();
      calls[0].fail(new Error("First"), 500);
      await settle();

      act(() => {
        result.current.refetch();
      });
      await advance();
      calls[1].fail(new Error("Second"), 404);
      await settle();

      expect(result.current.error?.message).toBe("Second");
      expect(result.current.status).toBe(404);
    });
    it("should send a new request for every refetch call", async () => {
      const { result } = renderLifecycle();
      await advance();
      calls[0].succeed(user);
      await settle();

      act(() => {
        result.current.refetch();
        result.current.refetch();
      });
      await advance();

      expect(calls).toHaveLength(3);
    });
    it("should stay in loading state until all the requests are finished", async () => {
      const { result } = renderLifecycle();
      await advance();

      act(() => {
        result.current.refetch();
      });
      await advance();
      expect(calls).toHaveLength(2);

      calls[0].succeed(user);
      await settle();
      expect(result.current.loading).toBeTrue();

      calls[1].succeed(updatedUser);
      await settle();
      expect(result.current.loading).toBeFalse();
      expect(result.current.data).toStrictEqual(updatedUser);
    });
    it("should do nothing when the hook is disabled", async () => {
      const { result } = renderLifecycle({ disabled: true });
      await advance();

      act(() => {
        result.current.refetch();
      });
      await advance();

      expect(calls).toHaveLength(0);
      expect(result.current.loading).toBeFalse();
    });
  });

  describe("when cache gets the data after an error", () => {
    it("should replace the error state with the cached data", async () => {
      const { result } = renderLifecycle();
      await advance();
      calls[0].fail(new Error("First"), 500);
      await settle();

      act(() => {
        setCacheResponse(request, user);
      });

      expect(result.current.data).toStrictEqual(user);
      expect(result.current.error).toBeNull();
      expect(result.current.success).toBeTrue();
      expect(result.current.status).toBe(200);
    });
  });

  describe("when revalidating cached data", () => {
    it("should go through loading with the data visible", async () => {
      setCacheResponse(request, user);
      const { history } = renderLifecycle();
      await advance();
      calls[0].succeed(updatedUser);
      await settle();

      expect(history.every((state) => state.data !== null)).toBeTrue();
      expect(history.some((state) => state.loading)).toBeTrue();
      expect(history.at(-1)).toStrictEqual({
        data: updatedUser,
        error: null,
        loading: false,
        success: true,
        status: 200,
      });
    });
  });

  describe("when the response has no data", () => {
    it("should finish loading with null data and success state", async () => {
      const emptyRequest = createRequest<null>();
      const emptyCalls = gateRequest(emptyRequest);
      const { result } = renderHook(() => {
        const state = useFetch(emptyRequest);
        return { data: state.data, loading: state.loading, success: state.success, status: state.status };
      });
      await advance();
      emptyCalls[0].succeed(null, 204);
      await settle();

      expect(result.current).toStrictEqual({ data: null, loading: false, success: true, status: 204 });
    });
  });
});
