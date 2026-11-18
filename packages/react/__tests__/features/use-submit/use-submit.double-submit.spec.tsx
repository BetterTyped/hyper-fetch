import type { RequestInstance } from "@hyper-fetch/core";
import { getErrorMessage } from "@hyper-fetch/core";
import { act, renderHook, waitFor } from "@testing-library/react";
import { useSubmit } from "hooks/use-submit";

import { createGatedClient } from "../../utils/gated-client.utils";

type User = { id: number; name: string };

const setup = (options?: { queued?: boolean; cancelable?: boolean; deduplicate?: boolean }) => {
  const gated = createGatedClient();
  const request = gated.client.createRequest<{ response: User; payload: { name: string } }>()({
    endpoint: "/users",
    method: "POST",
    queued: options?.queued ?? false,
    cancelable: options?.cancelable ?? false,
    deduplicate: options?.deduplicate ?? false,
  });
  /** Listeners attached to the request manager - they have to be gone once the requests are done */
  const countListeners = () => {
    const { emitter } = gated.client.requestManager;
    return emitter.eventNames().reduce((sum, name) => sum + emitter.listenerCount(name), 0);
  };
  return { ...gated, request, countListeners };
};

/** Renders the hook and records every distinct `submitting` value it went through */
const renderSubmit = <T extends RequestInstance>(request: T) => {
  const submittingHistory: boolean[] = [];
  const spies = { success: vi.fn(), error: vi.fn(), abort: vi.fn(), finished: vi.fn() };
  const view = renderHook(() => {
    const submit = useSubmit(request, { dependencyTracking: false });
    submit.onSubmitSuccess(spies.success);
    submit.onSubmitError(spies.error);
    submit.onSubmitAbort(spies.abort);
    submit.onSubmitFinished(spies.finished);
    if (submittingHistory.at(-1) !== submit.submitting) {
      submittingHistory.push(submit.submitting);
    }
    return submit;
  });
  return { ...view, submittingHistory, spies };
};

describe("useSubmit [ Double submit ]", () => {
  describe("given the request is sent all at once", () => {
    it("should send both requests right away", async () => {
      const { request, waitForCalls } = setup();
      const { result } = renderSubmit(request);

      act(() => {
        result.current.submit({ payload: { name: "First" } });
        result.current.submit({ payload: { name: "Second" } });
      });

      const calls = await waitForCalls(2);
      expect(calls.map((call) => call.settled)).toStrictEqual([false, false]);
    });
    it("should stay submitting until the last request finishes", async () => {
      const { request, waitForCalls } = setup();
      const { result, submittingHistory } = renderSubmit(request);
      let promises: Promise<unknown>[] = [];
      act(() => {
        promises = ["First", "Second", "Third"].map((name) => result.current.submit({ payload: { name } }));
      });
      const calls = await waitForCalls(3);

      await act(async () => {
        calls[0].succeed({ id: 1, name: "First" });
        await promises[0];
      });
      expect(result.current.submitting).toBeTrue();

      await act(async () => {
        calls[1].fail({ message: "Nope" }, 400);
        await promises[1];
      });
      expect(result.current.submitting).toBeTrue();

      await act(async () => {
        calls[2].succeed({ id: 3, name: "Third" });
        await promises[2];
      });
      await waitFor(() => {
        expect(result.current.submitting).toBeFalse();
      });
      expect(submittingHistory).toStrictEqual([false, true, false]);
    });
    it("should show the response that came last when they arrive in the order of the submits", async () => {
      const { request, waitForCalls } = setup();
      const { result } = renderSubmit(request);
      let promises: Promise<unknown>[] = [];
      act(() => {
        promises = ["First", "Second"].map((name) => result.current.submit({ payload: { name } }));
      });
      const calls = await waitForCalls(2);

      await act(async () => {
        calls[0].succeed({ id: 1, name: "First" });
        await promises[0];
      });
      await waitFor(() => {
        expect(result.current.data).toStrictEqual({ id: 1, name: "First" });
      });
      await act(async () => {
        calls[1].succeed({ id: 2, name: "Second" });
        await promises[1];
      });

      await waitFor(() => {
        expect(result.current.data).toStrictEqual({ id: 2, name: "Second" });
      });
    });
    it("should call the callbacks for both requests", async () => {
      const { request, waitForCalls } = setup();
      const { result, spies } = renderSubmit(request);
      let promises: Promise<unknown>[] = [];
      act(() => {
        promises = ["First", "Second"].map((name) => result.current.submit({ payload: { name } }));
      });
      const calls = await waitForCalls(2);

      await act(async () => {
        calls[0].succeed({ id: 1, name: "First" });
        calls[1].fail({ message: "Nope" }, 400);
        await Promise.all(promises);
      });

      expect(spies.success).toHaveBeenCalledTimes(1);
      expect(spies.error).toHaveBeenCalledTimes(1);
      expect(spies.finished).toHaveBeenCalledTimes(2);
    });
    it("should release the listeners of the finished requests", async () => {
      const { request, waitForCalls, countListeners } = setup();
      const { result } = renderSubmit(request);
      const idleListeners = countListeners();
      let promises: Promise<unknown>[] = [];
      act(() => {
        promises = ["First", "Second", "Third"].map((name) => result.current.submit({ payload: { name } }));
      });
      const calls = await waitForCalls(3);
      expect(countListeners()).toBeGreaterThan(idleListeners);

      await act(async () => {
        calls.forEach((call, index) => call.succeed({ id: index, name: "User" }));
        await Promise.all(promises);
      });

      await waitFor(() => {
        expect(countListeners()).toBe(idleListeners);
      });
    });
  });

  describe("given the request is queued", () => {
    it("should send one request at a time", async () => {
      const { request, waitForCall, calls } = setup({ queued: true });
      const { result } = renderSubmit(request);

      act(() => {
        result.current.submit({ payload: { name: "First" } });
        result.current.submit({ payload: { name: "Second" } });
        result.current.submit({ payload: { name: "Third" } });
      });
      await waitForCall(0);

      expect(calls).toHaveLength(1);
      expect(calls[0].request.payload).toStrictEqual({ name: "First" });
    });
    it("should send the requests in the order of the submits", async () => {
      const { request, waitForCall } = setup({ queued: true });
      const { result } = renderSubmit(request);
      const sent: unknown[] = [];
      act(() => {
        result.current.submit({ payload: { name: "First" } });
        result.current.submit({ payload: { name: "Second" } });
        result.current.submit({ payload: { name: "Third" } });
      });

      for (let index = 0; index < 3; index += 1) {
        // eslint-disable-next-line no-await-in-loop
        const call = await waitForCall(index);
        sent.push(call.request.payload);
        act(() => {
          call.succeed({ id: index, name: "User" });
        });
      }

      expect(sent).toStrictEqual([{ name: "First" }, { name: "Second" }, { name: "Third" }]);
    });
    it("should resolve the promises in the order of the submits", async () => {
      const { request, waitForCall } = setup({ queued: true });
      const { result } = renderSubmit(request);
      const resolved: string[] = [];
      let promises: Promise<unknown>[] = [];
      act(() => {
        promises = ["First", "Second", "Third"].map((name) =>
          result.current.submit({ payload: { name } }).then((response) => resolved.push(response.data?.name ?? "")),
        );
      });

      const answer = async (index: number) => {
        const call = await waitForCall(index);
        await act(async () => {
          call.succeed({ id: index, name: (call.request.payload as { name: string }).name });
          await promises[index];
        });
      };
      await answer(0);
      await answer(1);
      await answer(2);

      expect(resolved).toStrictEqual(["First", "Second", "Third"]);
    });
    it("should show the response of every request as it finishes", async () => {
      const { request, waitForCall } = setup({ queued: true });
      const { result } = renderSubmit(request);
      act(() => {
        result.current.submit({ payload: { name: "First" } });
        result.current.submit({ payload: { name: "Second" } });
      });

      const firstCall = await waitForCall(0);
      act(() => {
        firstCall.succeed({ id: 1, name: "First" });
      });
      await waitFor(() => {
        expect(result.current.data).toStrictEqual({ id: 1, name: "First" });
      });

      const secondCall = await waitForCall(1);
      act(() => {
        secondCall.succeed({ id: 2, name: "Second" });
      });
      await waitFor(() => {
        expect(result.current.data).toStrictEqual({ id: 2, name: "Second" });
      });
    });
    it("should stop submitting after the last request", async () => {
      const { request, waitForCall } = setup({ queued: true });
      const { result } = renderSubmit(request);
      let promises: Promise<unknown>[] = [];
      act(() => {
        promises = ["First", "Second"].map((name) => result.current.submit({ payload: { name } }));
      });

      const firstCall = await waitForCall(0);
      act(() => {
        firstCall.succeed({ id: 1, name: "First" });
      });
      const secondCall = await waitForCall(1);
      expect(result.current.submitting).toBeTrue();
      await act(async () => {
        secondCall.succeed({ id: 2, name: "Second" });
        await Promise.all(promises);
      });

      await waitFor(() => {
        expect(result.current.submitting).toBeFalse();
      });
    });
    it("should send the next request after a failed one", async () => {
      const { request, waitForCall } = setup({ queued: true });
      const { result, spies } = renderSubmit(request);
      let promises: Promise<unknown>[] = [];
      act(() => {
        promises = ["First", "Second"].map((name) => result.current.submit({ payload: { name } }));
      });

      const firstCall = await waitForCall(0);
      act(() => {
        firstCall.fail({ message: "Nope" }, 400);
      });
      const secondCall = await waitForCall(1);
      await act(async () => {
        secondCall.succeed({ id: 2, name: "Second" });
        await Promise.all(promises);
      });

      expect(spies.error).toHaveBeenCalledTimes(1);
      expect(spies.success).toHaveBeenCalledTimes(1);
      await waitFor(() => {
        expect(result.current.data).toStrictEqual({ id: 2, name: "Second" });
      });
      expect(result.current.error).toBeNull();
    });
    it("should send the next request after an aborted one", async () => {
      const { request, waitForCall } = setup({ queued: true });
      const { result } = renderSubmit(request);
      act(() => {
        result.current.submit({ payload: { name: "First" } });
        result.current.submit({ payload: { name: "Second" } });
      });
      const firstCall = await waitForCall(0);

      act(() => {
        result.current.abort();
      });

      expect(firstCall.aborted).toBeTrue();
      const secondCall = await waitForCall(1);
      expect(secondCall.request.payload).toStrictEqual({ name: "Second" });
    });
  });

  describe("given the request is cancelable", () => {
    it("should cancel the previous request when the next submit comes", async () => {
      const { request, waitForCall } = setup({ cancelable: true });
      const { result } = renderSubmit(request);
      act(() => {
        result.current.submit({ payload: { name: "First" } });
      });
      const firstCall = await waitForCall(0);

      act(() => {
        result.current.submit({ payload: { name: "Second" } });
      });

      expect(firstCall.aborted).toBeTrue();
      const secondCall = await waitForCall(1);
      expect(secondCall.aborted).toBeFalse();
    });
    it("should resolve the canceled submit with the abort error and the next one with the data", async () => {
      const { request, waitForCall } = setup({ cancelable: true });
      const { result } = renderSubmit(request);
      let first: ReturnType<typeof result.current.submit> | null = null;
      let second: ReturnType<typeof result.current.submit> | null = null;
      act(() => {
        first = result.current.submit({ payload: { name: "First" } });
      });
      await waitForCall(0);
      act(() => {
        second = result.current.submit({ payload: { name: "Second" } });
      });
      const secondCall = await waitForCall(1);
      act(() => {
        secondCall.succeed({ id: 2, name: "Second" });
      });

      const [firstResponse, secondResponse] = await Promise.all([first!, second!]);
      expect(firstResponse.error).toStrictEqual(getErrorMessage("abort"));
      expect(firstResponse.success).toBeFalse();
      expect(secondResponse.data).toStrictEqual({ id: 2, name: "Second" });
    });
    it("should end with the state of the latest submit", async () => {
      const { request, waitForCall } = setup({ cancelable: true });
      const { result } = renderSubmit(request);
      let promise: Promise<unknown> = Promise.resolve();
      act(() => {
        result.current.submit({ payload: { name: "First" } });
      });
      await waitForCall(0);
      act(() => {
        promise = result.current.submit({ payload: { name: "Second" } });
      });
      const secondCall = await waitForCall(1);

      await act(async () => {
        secondCall.succeed({ id: 2, name: "Second" });
        await promise;
      });

      await waitFor(() => {
        expect(result.current.data).toStrictEqual({ id: 2, name: "Second" });
      });
      expect(result.current.error).toBeNull();
      expect(result.current.success).toBeTrue();
      expect(result.current.submitting).toBeFalse();
    });
    it("should stay submitting while the previous request gets replaced", async () => {
      const { request, waitForCall } = setup({ cancelable: true });
      const { result, submittingHistory } = renderSubmit(request);
      let promise: Promise<unknown> = Promise.resolve();
      act(() => {
        result.current.submit({ payload: { name: "First" } });
      });
      await waitForCall(0);
      act(() => {
        promise = result.current.submit({ payload: { name: "Second" } });
      });
      const secondCall = await waitForCall(1);
      await act(async () => {
        secondCall.succeed({ id: 2, name: "Second" });
        await promise;
      });
      await waitFor(() => {
        expect(result.current.submitting).toBeFalse();
      });

      expect(submittingHistory).toStrictEqual([false, true, false]);
    });
    it("should let only the last of many quick submits through", async () => {
      const { request, waitForCall, calls } = setup({ cancelable: true });
      const { result, spies } = renderSubmit(request);
      let promises: Promise<unknown>[] = [];
      act(() => {
        result.current.submit({ payload: { name: "First" } });
      });
      await waitForCall(0);
      act(() => {
        promises = ["Second", "Third", "Fourth"].map((name) => result.current.submit({ payload: { name } }));
      });
      await waitFor(() => {
        expect(calls.filter((call) => !call.settled)).toHaveLength(1);
      });
      const lastCall = calls.find((call) => !call.settled)!;

      await act(async () => {
        lastCall.succeed({ id: 4, name: "Fourth" });
        await Promise.all(promises);
      });

      expect(lastCall.request.payload).toStrictEqual({ name: "Fourth" });
      expect(spies.success).toHaveBeenCalledTimes(1);
      await waitFor(() => {
        expect(result.current.data).toStrictEqual({ id: 4, name: "Fourth" });
      });
    });
    it("should release the listeners of the canceled requests", async () => {
      const { request, waitForCall, countListeners } = setup({ cancelable: true });
      const { result } = renderSubmit(request);
      const idleListeners = countListeners();
      const promises: Promise<unknown>[] = [];
      act(() => {
        promises.push(result.current.submit({ payload: { name: "First" } }));
      });
      await waitForCall(0);
      act(() => {
        promises.push(result.current.submit({ payload: { name: "Second" } }));
      });
      const secondCall = await waitForCall(1);

      await act(async () => {
        secondCall.succeed({ id: 2, name: "Second" });
        await Promise.all(promises);
      });

      await waitFor(() => {
        expect(countListeners()).toBe(idleListeners);
      });
    });
  });

  describe("given the request is deduplicated", () => {
    it("should send one request for the submits made while it is in flight", async () => {
      const { request, waitForCall, calls } = setup({ deduplicate: true });
      const { result } = renderSubmit(request);

      act(() => {
        result.current.submit({ payload: { name: "Maciej" } });
        result.current.submit({ payload: { name: "Maciej" } });
        result.current.submit({ payload: { name: "Maciej" } });
      });
      await waitForCall(0);

      expect(calls).toHaveLength(1);
    });
    it("should resolve every submit with the shared response", async () => {
      const { request, waitForCall } = setup({ deduplicate: true });
      const { result } = renderSubmit(request);
      let promises: ReturnType<typeof result.current.submit>[] = [];
      act(() => {
        promises = [1, 2].map(() => result.current.submit({ payload: { name: "Maciej" } }));
      });
      const call = await waitForCall(0);

      act(() => {
        call.succeed({ id: 1, name: "Maciej" });
      });

      const responses = await Promise.all(promises);
      expect(responses.map((response) => response.data)).toStrictEqual([
        { id: 1, name: "Maciej" },
        { id: 1, name: "Maciej" },
      ]);
    });
    it("should call the callbacks once for the shared response", async () => {
      const { request, waitForCall } = setup({ deduplicate: true });
      const { result, spies } = renderSubmit(request);
      let promises: Promise<unknown>[] = [];
      act(() => {
        promises = [1, 2, 3].map(() => result.current.submit({ payload: { name: "Maciej" } }));
      });
      const call = await waitForCall(0);

      await act(async () => {
        call.succeed({ id: 1, name: "Maciej" });
        await Promise.all(promises);
      });

      expect(spies.success).toHaveBeenCalledTimes(1);
      expect(spies.finished).toHaveBeenCalledTimes(1);
    });
    it("should send a new request once the previous one is done", async () => {
      const { request, waitForCall } = setup({ deduplicate: true });
      const { result } = renderSubmit(request);
      let promise: Promise<unknown> = Promise.resolve();
      act(() => {
        promise = result.current.submit({ payload: { name: "Maciej" } });
      });
      const firstCall = await waitForCall(0);
      await act(async () => {
        firstCall.succeed({ id: 1, name: "Maciej" });
        await promise;
      });

      act(() => {
        result.current.submit({ payload: { name: "Maciej" } });
      });

      const secondCall = await waitForCall(1);
      expect(secondCall.requestId).not.toBe(firstCall.requestId);
    });
    it("should release the listeners once the shared request is done", async () => {
      const { request, waitForCall, countListeners } = setup({ deduplicate: true });
      const { result } = renderSubmit(request);
      const idleListeners = countListeners();
      let promises: Promise<unknown>[] = [];
      act(() => {
        promises = [1, 2].map(() => result.current.submit({ payload: { name: "Maciej" } }));
      });
      const call = await waitForCall(0);

      await act(async () => {
        call.succeed({ id: 1, name: "Maciej" });
        await Promise.all(promises);
      });

      await waitFor(() => {
        expect(countListeners()).toBe(idleListeners);
      });
    });
    it("should leave no listeners behind after the unmount", async () => {
      const { request, waitForCall, countListeners } = setup({ deduplicate: true });
      const baseline = countListeners();
      const { result, unmount } = renderSubmit(request);
      let promises: Promise<unknown>[] = [];
      act(() => {
        promises = [1, 2].map(() => result.current.submit({ payload: { name: "Maciej" } }));
      });
      const call = await waitForCall(0);
      await act(async () => {
        call.succeed({ id: 1, name: "Maciej" });
        await Promise.all(promises);
      });

      unmount();

      expect(countListeners()).toBe(baseline);
    });
  });
});
