import { act, renderHook } from "@testing-library/react";
import { useFetch } from "hooks/use-fetch";
import { useIsFetching } from "hooks/use-is-fetching";

import { client, createRequest } from "../../utils";
import { advance, gateRequest, settle } from "../../utils/gate.utils";

type Data = { value: number };

const retryTime = 5000;

describe("useFetch [ Retry ]", () => {
  let calls = gateRequest(createRequest<Data>());

  const renderRetry = (retry: number) => {
    const request = createRequest<Data>({ retry, retryTime });
    calls = gateRequest(request);
    const spies = { onError: vi.fn(), onSuccess: vi.fn(), onFinished: vi.fn() };
    const view = renderHook(() => {
      const state = useFetch(request);
      state.onError(spies.onError);
      state.onSuccess(spies.onSuccess);
      state.onFinished(spies.onFinished);
      const fetching = useIsFetching(client);
      return {
        data: state.data,
        error: state.error?.message ?? null,
        loading: state.loading,
        retries: state.retries,
        fetching,
      };
    });
    return { ...view, spies, request };
  };

  const failAttempt = async (index: number) => {
    calls[index].fail(new Error(`Attempt ${index + 1} failed`));
    await settle();
  };

  beforeEach(() => {
    vi.useFakeTimers();
    client.clear();
  });

  afterEach(() => {
    vi.useRealTimers();
  });

  describe("when request retry attribute is set to false", () => {
    it("should not retry request on failure", async () => {
      const { result } = renderRetry(0);
      await advance();
      await failAttempt(0);
      await advance(retryTime * 3);

      expect(calls).toHaveLength(1);
      expect(result.current).toStrictEqual({
        data: null,
        error: "Attempt 1 failed",
        loading: false,
        retries: 0,
        fetching: 0,
      });
    });
    it("should call the error callback once", async () => {
      const { spies } = renderRetry(0);
      await advance();
      await failAttempt(0);
      await advance(retryTime * 3);

      expect(spies.onError).toHaveBeenCalledOnce();
      expect(spies.onError.mock.calls[0][0].details.willRetry).toBeFalse();
    });
  });

  describe("when request retry attribute is set to true", () => {
    it("should retry request once", async () => {
      renderRetry(1);
      await advance();
      await failAttempt(0);
      await advance(retryTime);
      await failAttempt(1);
      await advance(retryTime * 3);

      expect(calls).toHaveLength(2);
    });
    it("should retry request twice", async () => {
      renderRetry(2);
      await advance();
      await failAttempt(0);
      await advance(retryTime);
      await failAttempt(1);
      await advance(retryTime);
      await failAttempt(2);
      await advance(retryTime * 3);

      expect(calls).toHaveLength(3);
    });
    it("should trigger retries with the config interval", async () => {
      renderRetry(1);
      await advance();
      await failAttempt(0);

      await advance(retryTime - 1000);
      expect(calls).toHaveLength(1);

      await advance(1000);
      expect(calls).toHaveLength(2);
    });
    it("should stop retrying after the successful attempt", async () => {
      const { result } = renderRetry(3);
      await advance();
      await failAttempt(0);
      await advance(retryTime);
      calls[1].succeed({ value: 1 });
      await settle();
      await advance(retryTime * 3);

      expect(calls).toHaveLength(2);
      expect(result.current).toStrictEqual({
        data: { value: 1 },
        error: null,
        loading: false,
        retries: 1,
        fetching: 0,
      });
    });
    it("should expose the number of the used retries", async () => {
      const { result } = renderRetry(2);
      await advance();
      expect(result.current.retries).toBe(0);

      await failAttempt(0);
      await advance(retryTime);
      await failAttempt(1);
      expect(result.current.retries).toBe(1);

      await advance(retryTime);
      await failAttempt(2);
      expect(result.current.retries).toBe(2);
    });
    it("should be loading during every attempt", async () => {
      const { result } = renderRetry(1);
      await advance();
      expect(result.current.loading).toBeTrue();
      expect(result.current.fetching).toBe(1);

      await failAttempt(0);
      await advance(retryTime);

      expect(result.current.loading).toBeTrue();
      expect(result.current.fetching).toBe(1);
    });
    it("should end with the last error", async () => {
      const { result } = renderRetry(1);
      await advance();
      await failAttempt(0);
      await advance(retryTime);
      await failAttempt(1);

      expect(result.current).toStrictEqual({
        data: null,
        error: "Attempt 2 failed",
        loading: false,
        retries: 1,
        fetching: 0,
      });
    });
    it("should call the callbacks for every attempt", async () => {
      const { spies } = renderRetry(2);
      await advance();
      await failAttempt(0);
      await advance(retryTime);
      await failAttempt(1);
      await advance(retryTime);
      calls[2].succeed({ value: 1 });
      await settle();

      expect(spies.onError).toHaveBeenCalledTimes(2);
      expect(spies.onError.mock.calls.map(([params]) => params.details.willRetry)).toStrictEqual([true, true]);
      expect(spies.onSuccess).toHaveBeenCalledOnce();
      expect(spies.onFinished).toHaveBeenCalledTimes(3);
    });
    it("should mark only the last failed attempt as final", async () => {
      const { spies } = renderRetry(1);
      await advance();
      await failAttempt(0);
      await advance(retryTime);
      await failAttempt(1);

      expect(spies.onError.mock.calls.map(([params]) => params.details.willRetry)).toStrictEqual([true, false]);
    });
    it("should start the retries from scratch on refetch", async () => {
      const request = createRequest<Data>({ retry: 1, retryTime });
      calls = gateRequest(request);
      const { result } = renderHook(() => {
        const { retries, refetch } = useFetch(request);
        return { retries, refetch };
      });
      await advance();
      await failAttempt(0);
      await advance(retryTime);
      await failAttempt(1);

      act(() => {
        result.current.refetch();
      });
      await advance();
      calls[2].succeed({ value: 1 });
      await settle();

      expect(result.current.retries).toBe(0);
    });
    it("should not retry the request removed with abort", async () => {
      const request = createRequest<Data>({ retry: 3, retryTime });
      calls = gateRequest(request);
      const { result } = renderHook(() => {
        const { error, abort } = useFetch(request);
        return { error, abort };
      });
      await advance();
      await failAttempt(0);
      await advance(retryTime);
      expect(calls).toHaveLength(2);

      act(() => {
        result.current.abort();
      });
      await advance(retryTime * 3);

      expect(calls).toHaveLength(2);
    });
  });
});
