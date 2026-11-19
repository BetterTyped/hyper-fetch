import { getErrorMessage, scopeKey } from "@hyper-fetch/core";
import { act, renderHook, waitFor } from "@testing-library/react";
import { useSubmit } from "hooks/use-submit";
import { StrictMode } from "react";

import { createGatedClient } from "../../utils/gated-client.utils";

type User = { id: number; name: string };

const setup = (options?: { queued?: boolean }) => {
  const gated = createGatedClient();
  const request = gated.client.createRequest<{ response: User; payload: { name: string } }>()({
    endpoint: "/users",
    method: "POST",
    queued: options?.queued ?? false,
    deduplicate: false,
  });
  return { ...gated, request };
};

/**
 * `abort()` takes the request out of the dispatcher. Nothing answers such a request anymore, so the removal is what
 * ends it for the hook: the abort and the finished callbacks run, like the docs describe.
 */
describe("useSubmit [ Abort ]", () => {
  const renderSubmit = (request: ReturnType<typeof setup>["request"], wrapper?: typeof StrictMode) => {
    const onAbort = vi.fn();
    const onFinished = vi.fn();
    const onError = vi.fn();
    const onSuccess = vi.fn();
    const view = renderHook(
      () => {
        const submit = useSubmit(request, { dependencyTracking: false });
        submit.onSubmitAbort(onAbort);
        submit.onSubmitFinished(onFinished);
        submit.onSubmitError(onError);
        submit.onSubmitSuccess(onSuccess);
        return submit;
      },
      { wrapper },
    );

    return { ...view, onAbort, onFinished, onError, onSuccess };
  };

  describe("when the request in flight is aborted with the hook", () => {
    it("should call the abort and the finished callbacks once", async () => {
      const { request, waitForCall } = setup();
      const { result, onAbort, onFinished, onError, onSuccess } = renderSubmit(request);
      let promise: Promise<unknown> = Promise.resolve();
      act(() => {
        promise = result.current.submit({ payload: { name: "Maciej" } });
      });
      await waitForCall(0);

      await act(async () => {
        result.current.abort();
        await promise;
      });
      await waitFor(() => {
        expect(result.current.submitting).toBeFalse();
      });

      expect(onAbort).toHaveBeenCalledTimes(1);
      expect(onFinished).toHaveBeenCalledTimes(1);
      expect(onError).not.toHaveBeenCalled();
      expect(onSuccess).not.toHaveBeenCalled();
    });

    it("should pass the response that submit resolves with", async () => {
      const { request, waitForCall } = setup();
      const { result, onAbort } = renderSubmit(request);
      let promise: ReturnType<typeof result.current.submit> | undefined;
      act(() => {
        promise = result.current.submit({ payload: { name: "Maciej" } });
      });
      const call = await waitForCall(0);

      let resolved: Awaited<ReturnType<typeof result.current.submit>> | undefined;
      await act(async () => {
        result.current.abort();
        resolved = await promise;
      });

      const [params] = onAbort.mock.calls[0];
      expect(params.requestId).toBe(call.requestId);
      expect(params.details.isCanceled).toBeTrue();
      expect(params.response.success).toBeFalse();
      expect(params.response.data).toBeNull();
      expect(params.response.error).toStrictEqual(getErrorMessage("deleted"));
      expect(resolved?.error).toStrictEqual(params.response.error);
      expect(call.aborted).toBeTrue();
    });

    it("should pass the context of the optimistic update", async () => {
      const { request, waitForCall } = setup();
      const optimistic = request.setOptimistic(() => ({ context: { previousName: "Old name" } }));
      const onAbort = vi.fn();
      const { result } = renderHook(() => {
        const submit = useSubmit(optimistic, { dependencyTracking: false });
        submit.onSubmitAbort(onAbort);
        return submit;
      });
      let promise: Promise<unknown> = Promise.resolve();
      act(() => {
        promise = result.current.submit({ payload: { name: "Maciej" } });
      });
      await waitForCall(0);

      await act(async () => {
        result.current.abort();
        await promise;
      });

      expect(onAbort).toHaveBeenCalledTimes(1);
      expect(onAbort.mock.calls[0][0].mutationContext).toStrictEqual({ previousName: "Old name" });
    });

    it("should call the callbacks from the latest render", async () => {
      const { request, waitForCall } = setup();
      const first = vi.fn();
      const second = vi.fn();
      const { result, rerender } = renderHook(
        ({ onAbort }) => {
          const submit = useSubmit(request, { dependencyTracking: false });
          submit.onSubmitAbort(onAbort);
          return submit;
        },
        { initialProps: { onAbort: first } },
      );
      let promise: Promise<unknown> = Promise.resolve();
      act(() => {
        promise = result.current.submit({ payload: { name: "Maciej" } });
      });
      await waitForCall(0);
      rerender({ onAbort: second });

      await act(async () => {
        result.current.abort();
        await promise;
      });

      expect(first).not.toHaveBeenCalled();
      expect(second).toHaveBeenCalledTimes(1);
    });

    it("should call the callbacks once in StrictMode", async () => {
      const { request, waitForCall } = setup();
      const { result, onAbort, onFinished } = renderSubmit(request, StrictMode);
      let promise: Promise<unknown> = Promise.resolve();
      act(() => {
        promise = result.current.submit({ payload: { name: "Maciej" } });
      });
      await waitForCall(0);

      await act(async () => {
        result.current.abort();
        await promise;
      });

      expect(onAbort).toHaveBeenCalledTimes(1);
      expect(onFinished).toHaveBeenCalledTimes(1);
    });

    it("should let the next submit succeed", async () => {
      const { request, waitForCall } = setup();
      const { result, onAbort, onSuccess, onFinished } = renderSubmit(request);
      let promise: Promise<unknown> = Promise.resolve();
      act(() => {
        promise = result.current.submit({ payload: { name: "First" } });
      });
      await waitForCall(0);
      await act(async () => {
        result.current.abort();
        await promise;
      });

      act(() => {
        promise = result.current.submit({ payload: { name: "Second" } });
      });
      const call = await waitForCall(1);
      await act(async () => {
        call.succeed({ id: 2, name: "Second" });
        await promise;
      });

      expect(onAbort).toHaveBeenCalledTimes(1);
      expect(onSuccess).toHaveBeenCalledTimes(1);
      expect(onFinished).toHaveBeenCalledTimes(2);
      expect(result.current.data).toStrictEqual({ id: 2, name: "Second" });
    });
  });

  describe("when the request is removed from the queue before it was sent", () => {
    it("should call the abort and the finished callbacks for the removed request only", async () => {
      const { client, request, waitForCall } = setup({ queued: true });
      const { result, onAbort, onFinished, onSuccess } = renderSubmit(request);
      let promises: Promise<unknown>[] = [];
      act(() => {
        promises = ["First", "Second"].map((name) => result.current.submit({ payload: { name } }));
      });
      const call = await waitForCall(0);
      const queryKey = scopeKey(request.queryKey, request.scope);
      const [, waiting] = client.submitDispatcher.getQueue(queryKey).requests;

      await act(async () => {
        client.submitDispatcher.delete(queryKey, waiting.requestId, scopeKey(request.abortKey, request.scope));
        await promises[1];
      });
      expect(onAbort).toHaveBeenCalledTimes(1);
      expect(onAbort.mock.calls[0][0].requestId).toBe(waiting.requestId);

      await act(async () => {
        call.succeed({ id: 1, name: "First" });
        await promises[0];
      });

      expect(onAbort).toHaveBeenCalledTimes(1);
      expect(onSuccess).toHaveBeenCalledTimes(1);
      expect(onFinished).toHaveBeenCalledTimes(2);
    });
  });

  describe("when the request ends on its own", () => {
    it.each([
      ["succeeds", true],
      ["fails", false],
    ])("should not call the abort callback when it %s", async (_name, success) => {
      const { request, waitForCall } = setup();
      const { result, onAbort, onFinished } = renderSubmit(request);
      let promise: Promise<unknown> = Promise.resolve();
      act(() => {
        promise = result.current.submit({ payload: { name: "Maciej" } });
      });
      const call = await waitForCall(0);

      await act(async () => {
        if (success) {
          call.succeed({ id: 1, name: "Maciej" });
        } else {
          call.fail({ message: "Failed" }, 400);
        }
        await promise;
      });

      expect(onAbort).not.toHaveBeenCalled();
      expect(onFinished).toHaveBeenCalledTimes(1);
    });
  });

  describe("when the hook unmounts before the request is removed", () => {
    it("should not call any callback", async () => {
      const { client, request, waitForCall } = setup();
      const { result, unmount, onAbort, onFinished } = renderSubmit(request);
      let promise: Promise<unknown> = Promise.resolve();
      act(() => {
        promise = result.current.submit({ payload: { name: "Maciej" } });
      });
      const call = await waitForCall(0);
      unmount();

      const queryKey = scopeKey(request.queryKey, request.scope);
      client.submitDispatcher.delete(queryKey, call.requestId, scopeKey(request.abortKey, request.scope));
      await promise;

      expect(onAbort).not.toHaveBeenCalled();
      expect(onFinished).not.toHaveBeenCalled();
    });
  });
});
