import { act, renderHook } from "@testing-library/react";
import { useFetch } from "hooks/use-fetch";
import { useState } from "react";

import { client, createRequest } from "../../utils";
import { advance, gateRequest, settle } from "../../utils/gate.utils";

type User = { id: number };

describe("useFetch [ Callbacks ]", () => {
  let request = createRequest<User, any, "/users/:id">({ endpoint: "/users/:id" });
  let calls = gateRequest(request);

  beforeEach(() => {
    vi.useFakeTimers();
    client.clear();
    request = createRequest<User, any, "/users/:id">({ endpoint: "/users/:id" });
    calls = gateRequest(request);
  });

  afterEach(() => {
    vi.useRealTimers();
  });

  const renderCallbacks = (id = 1) => {
    const spies = {
      onSuccess: vi.fn(),
      onError: vi.fn(),
      onFinished: vi.fn(),
      onAbort: vi.fn(),
      onRequestStart: vi.fn(),
      onResponseStart: vi.fn(),
    };
    const view = renderHook(
      (props: { id: number }) => {
        const state = useFetch(request.setParams({ id: props.id }));
        state.onSuccess(spies.onSuccess);
        state.onError(spies.onError);
        state.onFinished(spies.onFinished);
        state.onAbort(spies.onAbort);
        state.onRequestStart(spies.onRequestStart);
        state.onResponseStart(spies.onResponseStart);
        return { data: state.data, refetch: state.refetch, abort: state.abort };
      },
      { initialProps: { id } },
    );
    return { ...view, spies };
  };

  describe("when the request succeeds", () => {
    it("should call onSuccess and onFinished once", async () => {
      const { spies } = renderCallbacks();
      await advance();
      calls[0].succeed({ id: 1 });
      await settle();

      expect(spies.onSuccess).toHaveBeenCalledOnce();
      expect(spies.onFinished).toHaveBeenCalledOnce();
      expect(spies.onError).not.toHaveBeenCalled();
      expect(spies.onAbort).not.toHaveBeenCalled();
    });
    it("should pass the response, details and request to onSuccess", async () => {
      const { spies } = renderCallbacks();
      await advance();
      calls[0].succeed({ id: 1 });
      await settle();

      const [params] = spies.onSuccess.mock.calls[0];
      expect(params.response.data).toStrictEqual({ id: 1 });
      expect(params.response.success).toBeTrue();
      expect(params.response.status).toBe(200);
      expect(params.details.retries).toBe(0);
      expect(params.details.isCanceled).toBeFalse();
      expect(params.request.endpoint).toBe("/users/1");
      expect(params.requestId).toBe(calls[0].requestId);
    });
    it("should call the start callbacks once per request", async () => {
      const { spies } = renderCallbacks();
      await advance();
      calls[0].succeed({ id: 1 });
      await settle();

      expect(spies.onRequestStart).toHaveBeenCalledOnce();
      expect(spies.onResponseStart).toHaveBeenCalledOnce();
    });
    it("should call the callbacks once per every refetch", async () => {
      const { spies, result } = renderCallbacks();
      await advance();
      calls[0].succeed({ id: 1 });
      await settle();

      act(() => {
        result.current.refetch();
      });
      await advance();
      calls[1].succeed({ id: 1 });
      await settle();

      expect(spies.onSuccess).toHaveBeenCalledTimes(2);
      expect(spies.onFinished).toHaveBeenCalledTimes(2);
    });
    it("should call the callback even when the data did not change", async () => {
      const { spies, result } = renderCallbacks();
      await advance();
      calls[0].succeed({ id: 1 });
      await settle();

      act(() => {
        result.current.refetch();
      });
      await advance();
      calls[1].succeed({ id: 1 });
      await settle();

      expect(spies.onSuccess.mock.calls[1][0].response.data).toStrictEqual({ id: 1 });
    });
  });

  describe("when the request fails", () => {
    it("should call onError and onFinished once", async () => {
      const { spies } = renderCallbacks();
      await advance();
      calls[0].fail(new Error("Failed"), 500);
      await settle();

      expect(spies.onError).toHaveBeenCalledOnce();
      expect(spies.onFinished).toHaveBeenCalledOnce();
      expect(spies.onSuccess).not.toHaveBeenCalled();
    });
    it("should pass the error response to onError", async () => {
      const { spies } = renderCallbacks();
      await advance();
      calls[0].fail(new Error("Failed"), 500);
      await settle();

      const [params] = spies.onError.mock.calls[0];
      expect(params.response.error.message).toBe("Failed");
      expect(params.response.status).toBe(500);
      expect(params.response.success).toBeFalse();
      expect(params.response.data).toBeNull();
    });
    it("should call onSuccess after the failed request is refetched", async () => {
      const { spies, result } = renderCallbacks();
      await advance();
      calls[0].fail();
      await settle();

      act(() => {
        result.current.refetch();
      });
      await advance();
      calls[1].succeed({ id: 1 });
      await settle();

      expect(spies.onError).toHaveBeenCalledOnce();
      expect(spies.onSuccess).toHaveBeenCalledOnce();
      expect(spies.onFinished).toHaveBeenCalledTimes(2);
    });
  });

  describe("when the callback changes between renders", () => {
    it("should call the callback from the latest render", async () => {
      const seen: number[] = [];
      const { result } = renderHook(() => {
        const [count, setCount] = useState(0);
        const state = useFetch(request.setParams({ id: 1 }));
        state.onSuccess(() => {
          seen.push(count);
        });
        return { data: state.data, setCount };
      });
      await advance();

      act(() => {
        result.current.setCount(5);
      });
      calls[0].succeed({ id: 1 });
      await settle();

      expect(seen).toStrictEqual([5]);
    });
    it("should allow to update the state from the callback", async () => {
      const { result } = renderHook(() => {
        const [message, setMessage] = useState("idle");
        const state = useFetch(request.setParams({ id: 1 }));
        state.onSuccess(({ response }) => setMessage(`user ${response.data.id}`));
        state.onError(({ response }) => setMessage(response.error.message));
        return { message, refetch: state.refetch };
      });
      await advance();
      calls[0].succeed({ id: 1 });
      await settle();
      expect(result.current.message).toBe("user 1");

      act(() => {
        result.current.refetch();
      });
      await advance();
      calls[1].fail(new Error("Failed"));
      await settle();
      expect(result.current.message).toBe("Failed");
    });
    it("should not fail when no callbacks are registered", async () => {
      const { result } = renderHook(() => useFetch(request.setParams({ id: 1 })).data);
      await advance();
      calls[0].succeed({ id: 1 });
      await settle();

      expect(result.current).toStrictEqual({ id: 1 });
    });
  });

  describe("when the key changes", () => {
    it("should not call the callbacks for the response of the previous key", async () => {
      const { spies, rerender } = renderCallbacks(1);
      await advance();
      rerender({ id: 2 });
      await advance();

      calls[0].succeed({ id: 1 });
      await settle();

      expect(spies.onSuccess).not.toHaveBeenCalled();
      expect(spies.onFinished).not.toHaveBeenCalled();
    });
    it("should call the callbacks for the response of the current key", async () => {
      const { spies, rerender } = renderCallbacks(1);
      await advance();
      rerender({ id: 2 });
      await advance();

      calls[1].succeed({ id: 2 });
      await settle();

      expect(spies.onSuccess).toHaveBeenCalledOnce();
      expect(spies.onSuccess.mock.calls[0][0].response.data).toStrictEqual({ id: 2 });
    });
  });

  describe("when the hook unmounts", () => {
    it("should not call the callbacks of the request finished after the unmount", async () => {
      const { spies, unmount } = renderCallbacks();
      await advance();

      unmount();
      calls[0].succeed({ id: 1 });
      await settle();

      expect(spies.onSuccess).not.toHaveBeenCalled();
      expect(spies.onFinished).not.toHaveBeenCalled();
      expect(spies.onResponseStart).not.toHaveBeenCalled();
    });
    it("should not call onError after the unmount", async () => {
      const { spies, unmount } = renderCallbacks();
      await advance();

      unmount();
      calls[0].fail();
      await settle();

      expect(spies.onError).not.toHaveBeenCalled();
    });
  });

  describe("when many hooks use the same request", () => {
    it("should call the callbacks of every hook once", async () => {
      const first = renderCallbacks();
      const second = renderCallbacks();
      await advance();
      expect(calls).toHaveLength(1);

      calls[0].succeed({ id: 1 });
      await settle();

      expect(first.spies.onSuccess).toHaveBeenCalledOnce();
      expect(second.spies.onSuccess).toHaveBeenCalledOnce();
    });
    it("should call the callbacks for the request sent outside of the hook", async () => {
      const { spies } = renderCallbacks();
      await advance();
      calls[0].succeed({ id: 1 });
      await settle();

      act(() => {
        client.fetchDispatcher.add(request.setParams({ id: 1 }));
      });
      await advance();
      calls[1].succeed({ id: 1 });
      await settle();

      expect(spies.onSuccess).toHaveBeenCalledTimes(2);
    });
  });

  describe("when the request uses a response mapper", () => {
    it("should pass the mapped response to the callbacks", async () => {
      const mapped = createRequest<User>().setResponseMapper(
        (response) => ({ ...response, data: { id: 100 } }) as typeof response,
      );
      const mappedCalls = gateRequest(mapped);
      const onSuccess = vi.fn();
      const { result } = renderHook(() => {
        const state = useFetch(mapped);
        state.onSuccess(({ response }) => onSuccess(response.data));
        return { data: state.data };
      });
      await advance();
      mappedCalls[0].succeed({ id: 1 });
      await settle();

      expect(result.current.data).toStrictEqual({ id: 100 });
      expect(onSuccess).toHaveBeenCalledWith({ id: 100 });
    });
    it("should pass the asynchronously mapped response to the callbacks", async () => {
      const mapped = createRequest<User>().setResponseMapper(
        async (response) => ({ ...response, data: { id: 100 } }) as typeof response,
      );
      const mappedCalls = gateRequest(mapped);
      const onSuccess = vi.fn();
      renderHook(() => {
        const state = useFetch(mapped);
        state.onSuccess(({ response }) => onSuccess(response.data));
        return { data: state.data };
      });
      await advance();
      mappedCalls[0].succeed({ id: 1 });
      await settle();

      expect(onSuccess).toHaveBeenCalledWith({ id: 100 });
    });
    it("should call onError when the mapper turns the response into a failure", async () => {
      const mapped = createRequest<User>().setResponseMapper(
        (response) =>
          ({
            ...response,
            data: null,
            error: new Error("Mapped failure"),
            success: false,
          }) as typeof response,
      );
      const mappedCalls = gateRequest(mapped);
      const onSuccess = vi.fn();
      const onError = vi.fn();
      const { result } = renderHook(() => {
        const state = useFetch(mapped);
        state.onSuccess(onSuccess);
        state.onError(({ response }) => onError(response.error?.message));
        return { error: state.error };
      });
      await advance();
      mappedCalls[0].succeed({ id: 1 });
      await settle();

      expect(result.current.error?.message).toBe("Mapped failure");
      expect(onError).toHaveBeenCalledWith("Mapped failure");
      expect(onSuccess).not.toHaveBeenCalled();
    });
  });
});
