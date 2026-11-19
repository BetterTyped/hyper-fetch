import { act, renderHook } from "@testing-library/react";
import type { UseFetchReturnType } from "hooks/use-fetch";
import { useFetch } from "hooks/use-fetch";
import { useEffect } from "react";

import { client, createRequest } from "../../utils";
import { advance, gateRequest, settle } from "../../utils/gate.utils";

type User = { id: number; name: string; tags: string[] };
type Request = ReturnType<typeof createRequest<User>>;

const user: User = { id: 1, name: "Maciej", tags: ["a", "b"] };

describe("useFetch [ Dependency Tracking ]", () => {
  let request = createRequest<User>();
  let calls = gateRequest(request);

  /**
   * Renders the hook reading only the picked fields and counts the renders.
   * Requests are answered with gates, so the number of state changes - and renders - is exact by construction.
   */
  const renderReading = <Picked,>(
    pick: (state: UseFetchReturnType<Request>) => Picked,
    options?: Parameters<typeof useFetch<Request>>[1],
  ) => {
    const counter = { renders: 0 };
    const view = renderHook(() => {
      counter.renders += 1;
      const state = useFetch(request, options);
      return { picked: pick(state), refetch: state.refetch, setData: state.setData, setLoading: state.setLoading };
    });
    return { ...view, counter };
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

  describe("when the component reads only the data", () => {
    it("should render once for mount and once for the response", async () => {
      const { counter, result } = renderReading((state) => state.data);
      await advance();
      calls[0].succeed(user);
      await settle();

      expect(result.current.picked).toStrictEqual(user);
      expect(counter.renders).toBe(2);
    });
    it("should not rerender when refetch brings the same data", async () => {
      const { counter, result } = renderReading((state) => state.data);
      await advance();
      calls[0].succeed(user);
      await settle();

      act(() => {
        result.current.refetch();
      });
      await advance();
      calls[1].succeed({ ...user, tags: [...user.tags] });
      await settle();

      // Loading, timestamps and status changed, but they are not used by the component
      expect(counter.renders).toBe(2);
    });
    it("should not rerender when the refetch fails", async () => {
      const { counter, result } = renderReading((state) => state.data);
      await advance();
      calls[0].succeed(user);
      await settle();

      act(() => {
        result.current.refetch();
      });
      await advance();
      calls[1].fail();
      await settle();

      expect(counter.renders).toBe(2);
      expect(result.current.picked).toStrictEqual(user);
    });
    it("should rerender when the data changes", async () => {
      const { counter, result } = renderReading((state) => state.data);
      await advance();
      calls[0].succeed(user);
      await settle();

      act(() => {
        result.current.refetch();
      });
      await advance();
      calls[1].succeed({ ...user, name: "Changed" });
      await settle();

      expect(counter.renders).toBe(3);
      expect(result.current.picked?.name).toBe("Changed");
    });
    it("should not rerender on local loading changes", async () => {
      const { counter, result } = renderReading((state) => state.data);
      await advance();
      calls[0].succeed(user);
      await settle();

      act(() => {
        result.current.setLoading(true);
      });

      expect(counter.renders).toBe(2);
    });
  });

  describe("when the component reads only the loading state", () => {
    it("should rerender only when loading changes", async () => {
      const { counter, result } = renderReading((state) => state.loading);
      await advance();
      calls[0].succeed(user);
      await settle();
      expect(counter.renders).toBe(2);

      act(() => {
        result.current.refetch();
      });
      await advance();
      expect(result.current.picked).toBeTrue();
      expect(counter.renders).toBe(3);

      calls[1].succeed({ ...user, name: "Changed" });
      await settle();
      expect(result.current.picked).toBeFalse();
      expect(counter.renders).toBe(4);
    });
    it("should not rerender on local data changes", async () => {
      const { counter, result } = renderReading((state) => state.loading);
      await advance();
      calls[0].succeed(user);
      await settle();

      act(() => {
        result.current.setData({ ...user, name: "Local" });
      });

      expect(counter.renders).toBe(2);
    });
  });

  describe("when the component reads only the error", () => {
    it("should not rerender for successful responses", async () => {
      const { counter } = renderReading((state) => state.error);
      await advance();
      calls[0].succeed(user);
      await settle();

      expect(counter.renders).toBe(1);
    });
    it("should rerender when the error appears", async () => {
      const { counter, result } = renderReading((state) => state.error);
      await advance();
      calls[0].fail(new Error("Failed"));
      await settle();

      expect(counter.renders).toBe(2);
      expect(result.current.picked?.message).toBe("Failed");
    });
  });

  describe("when the component reads no state", () => {
    it("should not rerender at all", async () => {
      const { counter, result } = renderReading(() => null);
      await advance();
      calls[0].succeed(user);
      await settle();
      act(() => {
        result.current.refetch();
      });
      await advance();
      calls[1].fail();
      await settle();

      expect(counter.renders).toBe(1);
    });
  });

  describe("when dependency tracking is off", () => {
    it("should rerender for the changes of unused fields", async () => {
      const { counter, result } = renderReading((state) => state.data, { dependencyTracking: false });
      await advance();
      calls[0].succeed(user);
      await settle();
      const rendersAfterResponse = counter.renders;

      act(() => {
        result.current.setLoading(true);
      });

      expect(counter.renders).toBe(rendersAfterResponse + 1);
    });
  });

  describe("when the data comes back unchanged", () => {
    it("should keep the references of the data and its nested parts", async () => {
      const { result } = renderReading((state) => state.data);
      await advance();
      calls[0].succeed(user);
      await settle();
      const first = result.current.picked;

      act(() => {
        result.current.refetch();
      });
      await advance();
      calls[1].succeed({ ...user, name: "Changed", tags: [...user.tags] });
      await settle();

      expect(result.current.picked).not.toBe(first);
      expect(result.current.picked?.tags).toBe(first?.tags);
    });
    it("should not rerun the effects depending on the data", async () => {
      const effect = vi.fn();
      const { result } = renderHook(() => {
        const { data, loading, refetch } = useFetch(request);
        useEffect(() => {
          effect(data);
        }, [data]);
        return { loading, refetch };
      });
      await advance();
      calls[0].succeed(user);
      await settle();
      expect(effect).toHaveBeenCalledTimes(2);

      act(() => {
        result.current.refetch();
      });
      await advance();
      calls[1].succeed({ ...user });
      await settle();

      expect(result.current.loading).toBeFalse();
      expect(effect).toHaveBeenCalledTimes(2);
    });
  });

  describe("when the returned functions are used as dependencies", () => {
    const functionNames = [
      "refetch",
      "abort",
      "setData",
      "setError",
      "setLoading",
      "setStatus",
      "setSuccess",
      "setExtra",
      "setRetries",
      "setResponseTimestamp",
      "setRequestTimestamp",
      "clearState",
      "onSuccess",
      "onError",
      "onAbort",
      "onOfflineError",
      "onFinished",
      "onRequestStart",
      "onResponseStart",
      "onDownloadProgress",
      "onUploadProgress",
    ] as const;

    it.each(functionNames)("should keep the identity of %s between renders", async (name) => {
      const identities = new Set<unknown>();
      const { rerender } = renderHook(() => {
        const state = useFetch(request);
        identities.add(state[name]);
        return state.data;
      });
      await advance();
      calls[0].succeed(user);
      await settle();
      rerender();

      expect(identities.size).toBe(1);
    });
    it("should not loop when refetch is called from an effect depending on it", async () => {
      renderHook(() => {
        const { data, loading, refetch } = useFetch(request, { disabled: false });
        useEffect(() => {
          refetch();
        }, [refetch]);
        return { data, loading };
      });
      await advance();
      calls.forEach((call) => call.succeed(user));
      await settle();
      await advance(1000);

      // Initial request and the single effect call
      expect(calls).toHaveLength(2);
    });
    it("should refetch the current request with the stable refetch function", async () => {
      const { result, rerender } = renderHook(
        ({ page }) => {
          const { data, refetch } = useFetch(request.setQueryParams({ page }));
          return { data, refetch };
        },
        { initialProps: { page: 1 } },
      );
      const initialRefetch = result.current.refetch;
      await advance();
      rerender({ page: 2 });
      await advance();
      calls.forEach((call) => call.succeed(user));
      await settle();

      act(() => {
        initialRefetch();
      });
      await advance();

      expect(calls).toHaveLength(3);
      expect(calls[2].request.queryParams).toStrictEqual({ page: 2 });
    });
  });

  describe("when local state setters get function updaters", () => {
    it("should pass falsy previous data to the updater", async () => {
      const numberRequest = createRequest<number>();
      gateRequest(numberRequest);
      const updater = vi.fn((previous: number | null) => (previous ?? -1) + 1);
      const { result } = renderHook(() => {
        const { data, setData } = useFetch(numberRequest, { disabled: true });
        return { data, setData };
      });

      act(() => {
        result.current.setData(0);
      });
      act(() => {
        result.current.setData(updater);
      });

      expect(updater).toHaveBeenCalledWith(0);
      expect(result.current.data).toBe(1);
    });
    it("should call the updater once", async () => {
      const updater = vi.fn((previous: number | null) => (previous ?? 0) + 1);
      const { result } = renderHook(() => {
        const { retries, setRetries } = useFetch(request, { disabled: true });
        return { retries, setRetries };
      });

      act(() => {
        result.current.setRetries(updater);
      });

      expect(updater).toHaveBeenCalledOnce();
      expect(result.current.retries).toBe(1);
    });
  });
});
