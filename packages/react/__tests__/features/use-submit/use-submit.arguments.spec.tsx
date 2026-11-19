import type { RequestInstance } from "@hyper-fetch/core";
import { getErrorMessage } from "@hyper-fetch/core";
import { act, renderHook, waitFor } from "@testing-library/react";
import type { UseSubmitOptionsType } from "hooks/use-submit";
import { useSubmit } from "hooks/use-submit";
import { Provider } from "provider";
import type { ReactNode } from "react";

import { createGatedClient } from "../../utils/gated-client.utils";

type User = { id: number; name: string };

const setup = () => {
  const gated = createGatedClient();
  const createUser = gated.client.createRequest<{ response: User; payload: { name: string } }>()({
    endpoint: "/users",
    method: "POST",
  });
  const patchUser = gated.client.createRequest<{
    response: User;
    payload: { name: string };
    queryParams?: { notify?: string; source?: string };
  }>()({
    endpoint: "/teams/:teamId/users/:userId",
    method: "PATCH",
  });
  return { ...gated, createUser, patchUser };
};

/** The tests read the state outside of the render, so the hook has to rerender on every change */
const useUntrackedSubmit = <T extends RequestInstance>(request: T, options?: UseSubmitOptionsType<T>) =>
  useSubmit(request, { dependencyTracking: false, ...options } as UseSubmitOptionsType<T>);

/** Run the pending timers and promise callbacks - for the tests using fake timers */
const advance = async (time = 0) => {
  await act(async () => {
    await vi.advanceTimersByTimeAsync(time);
  });
};

describe("useSubmit [ Submit arguments ]", () => {
  afterEach(() => {
    vi.useRealTimers();
  });

  describe("when passing the request data to submit", () => {
    it("should send the payload", async () => {
      const { createUser, waitForCall } = setup();
      const { result } = renderHook(() => useUntrackedSubmit(createUser));

      act(() => {
        result.current.submit({ payload: { name: "Maciej" } });
      });

      const call = await waitForCall(0);
      expect(call.request.payload).toStrictEqual({ name: "Maciej" });
      expect(call.payload).toBe(JSON.stringify({ name: "Maciej" }));
    });
    it("should send the params", async () => {
      const { patchUser, waitForCall } = setup();
      const { result } = renderHook(() => useUntrackedSubmit(patchUser));

      act(() => {
        result.current.submit({ payload: { name: "Maciej" }, params: { teamId: "core", userId: 7 } });
      });

      const call = await waitForCall(0);
      expect(call.request.endpoint).toBe("/teams/core/users/7");
      expect(call.request.params).toStrictEqual({ teamId: "core", userId: 7 });
    });
    it("should send the query params", async () => {
      const { patchUser, waitForCall } = setup();
      const { result } = renderHook(() => useUntrackedSubmit(patchUser));

      act(() => {
        result.current.submit({
          payload: { name: "Maciej" },
          params: { teamId: "core", userId: 7 },
          queryParams: { notify: "true" },
        });
      });

      const call = await waitForCall(0);
      expect(call.request.queryParams).toStrictEqual({ notify: "true" });
    });
    it("should send the payload, params and query params together", async () => {
      const { patchUser, waitForCall } = setup();
      const { result } = renderHook(() => useUntrackedSubmit(patchUser));

      act(() => {
        result.current.submit({
          payload: { name: "Kacper" },
          params: { teamId: "docs", userId: 3 },
          queryParams: { notify: "false", source: "form" },
        });
      });

      const call = await waitForCall(0);
      expect(call.request.payload).toStrictEqual({ name: "Kacper" });
      expect(call.request.endpoint).toBe("/teams/docs/users/3");
      expect(call.request.queryParams).toStrictEqual({ notify: "false", source: "form" });
      expect(call.request.method).toBe("PATCH");
    });
    it("should send the data set on the request when submit gets no arguments", async () => {
      const { patchUser, waitForCall } = setup();
      const prepared = patchUser
        .setParams({ teamId: "core", userId: 7 })
        .setPayload({ name: "Maciej" })
        .setQueryParams({ notify: "true" });
      const { result } = renderHook(() => useUntrackedSubmit(prepared));

      act(() => {
        result.current.submit();
      });

      const call = await waitForCall(0);
      expect(call.request.payload).toStrictEqual({ name: "Maciej" });
      expect(call.request.endpoint).toBe("/teams/core/users/7");
      expect(call.request.queryParams).toStrictEqual({ notify: "true" });
    });
    it("should mix the data set on the request with the submit arguments", async () => {
      const { patchUser, waitForCall } = setup();
      const prepared = patchUser.setParams({ teamId: "core", userId: 7 });
      const { result } = renderHook(() => useUntrackedSubmit(prepared));

      act(() => {
        result.current.submit({ payload: { name: "Kacper" } });
      });

      const call = await waitForCall(0);
      expect(call.request.payload).toStrictEqual({ name: "Kacper" });
      expect(call.request.endpoint).toBe("/teams/core/users/7");
    });
    it("should not change the request passed to the hook", async () => {
      const { patchUser, waitForCall } = setup();
      const { result } = renderHook(() => useUntrackedSubmit(patchUser));

      act(() => {
        result.current.submit({ payload: { name: "Maciej" }, params: { teamId: "core", userId: 7 } });
      });
      await waitForCall(0);

      expect(patchUser.payload).toBeUndefined();
      expect(patchUser.params).toBeUndefined();
      expect(patchUser.endpoint).toBe("/teams/:teamId/users/:userId");
    });
    it("should send different data with every submit", async () => {
      const { createUser, waitForCalls } = setup();
      const { result } = renderHook(() => useUntrackedSubmit(createUser));

      act(() => {
        result.current.submit({ payload: { name: "First" } });
        result.current.submit({ payload: { name: "Second" } });
        result.current.submit({ payload: { name: "Third" } });
      });

      const calls = await waitForCalls(3);
      expect(calls.map((call) => call.request.payload)).toStrictEqual([
        { name: "First" },
        { name: "Second" },
        { name: "Third" },
      ]);
    });
    it("should send a separate request for every submit", async () => {
      const { createUser, waitForCalls } = setup();
      const { result } = renderHook(() => useUntrackedSubmit(createUser));

      act(() => {
        result.current.submit({ payload: { name: "Same" } });
        result.current.submit({ payload: { name: "Same" } });
      });

      const calls = await waitForCalls(2);
      expect(calls[0].requestId).not.toBe(calls[1].requestId);
    });
    it("should use the submit dispatcher", async () => {
      const { createUser, client, waitForCall } = setup();
      const { result } = renderHook(() => useUntrackedSubmit(createUser));

      act(() => {
        result.current.submit({ payload: { name: "Maciej" } });
      });
      await waitForCall(0);

      expect(client.submitDispatcher.getAllRunningRequests()).toHaveLength(1);
      expect(client.fetchDispatcher.getAllRunningRequests()).toHaveLength(0);
    });
    it("should send a GET request through the submit dispatcher as well", async () => {
      const { client, waitForCall } = setup();
      const search = client.createRequest<{ response: User[]; queryParams: { search: string } }>()({
        endpoint: "/users",
      });
      const { result } = renderHook(() => useUntrackedSubmit(search));

      act(() => {
        result.current.submit({ queryParams: { search: "mac" } });
      });
      await waitForCall(0);

      expect(client.submitDispatcher.getAllRunningRequests()).toHaveLength(1);
      expect(result.current.submitting).toBeTrue();
    });
  });

  describe("when passing the callbacks to submit", () => {
    it("should call onBeforeSent with the id of the request", async () => {
      const { createUser, waitForCall } = setup();
      const onBeforeSent = vi.fn();
      const { result } = renderHook(() => useUntrackedSubmit(createUser));

      act(() => {
        result.current.submit({ payload: { name: "Maciej" }, onBeforeSent });
      });
      const call = await waitForCall(0);

      expect(onBeforeSent).toHaveBeenCalledTimes(1);
      expect(onBeforeSent.mock.calls[0][0].requestId).toBe(call.requestId);
      expect(onBeforeSent.mock.calls[0][0].request.payload).toStrictEqual({ name: "Maciej" });
    });
    it("should call the request and response lifecycle callbacks once", async () => {
      const { createUser, waitForCall } = setup();
      const spies = {
        onRequestStart: vi.fn(),
        onResponseStart: vi.fn(),
        onResponse: vi.fn(),
        onRemove: vi.fn(),
      };
      const { result } = renderHook(() => useUntrackedSubmit(createUser));
      let promise: Promise<unknown> = Promise.resolve();

      act(() => {
        promise = result.current.submit({ payload: { name: "Maciej" }, ...spies });
      });
      const call = await waitForCall(0);
      await act(async () => {
        call.succeed({ id: 1, name: "Maciej" });
        await promise;
      });

      expect(spies.onRequestStart).toHaveBeenCalledTimes(1);
      expect(spies.onResponseStart).toHaveBeenCalledTimes(1);
      expect(spies.onResponse).toHaveBeenCalledTimes(1);
      expect(spies.onResponse.mock.calls[0][0].response.data).toStrictEqual({ id: 1, name: "Maciej" });
      expect(spies.onRemove).not.toHaveBeenCalled();
    });
    it("should call the progress callbacks", async () => {
      const { createUser, waitForCall } = setup();
      const onUploadProgress = vi.fn();
      const onDownloadProgress = vi.fn();
      const { result } = renderHook(() => useUntrackedSubmit(createUser));

      act(() => {
        result.current.submit({ payload: { name: "Maciej" }, onUploadProgress, onDownloadProgress });
      });
      const call = await waitForCall(0);
      act(() => {
        call.upload(50, 100);
        call.download(20, 200);
      });

      expect(onUploadProgress).toHaveBeenCalledWith(expect.objectContaining({ loaded: 50, total: 100 }));
      expect(onDownloadProgress).toHaveBeenCalledWith(expect.objectContaining({ loaded: 20, total: 200 }));
    });
    it("should call onRemove instead of onResponse when the request gets aborted", async () => {
      const { createUser, waitForCall } = setup();
      const onResponse = vi.fn();
      const onRemove = vi.fn();
      const { result } = renderHook(() => useUntrackedSubmit(createUser));
      let promise: Promise<unknown> = Promise.resolve();

      act(() => {
        promise = result.current.submit({ payload: { name: "Maciej" }, onResponse, onRemove });
      });
      await waitForCall(0);
      await act(async () => {
        result.current.abort();
        await promise;
      });

      expect(onRemove).toHaveBeenCalledTimes(1);
      expect(onResponse).not.toHaveBeenCalled();
    });
    it("should call onResponse only with the final response of a retried request", async () => {
      vi.useFakeTimers();
      const { createUser, calls } = setup();
      const onResponse = vi.fn();
      const { result } = renderHook(() => useUntrackedSubmit(createUser.setRetry(1).setRetryTime(5000)));

      act(() => {
        result.current.submit({ payload: { name: "Maciej" }, onResponse });
      });
      await advance();
      calls[0].fail();
      await advance(5000);
      expect(onResponse).not.toHaveBeenCalled();

      calls[1].succeed({ id: 1, name: "Maciej" });
      await advance();

      expect(onResponse).toHaveBeenCalledTimes(1);
      expect(onResponse.mock.calls[0][0].response.success).toBeTrue();
    });
  });

  describe("when awaiting the promise returned by submit", () => {
    it("should resolve with the successful response", async () => {
      const { createUser, waitForCall } = setup();
      const { result } = renderHook(() => useUntrackedSubmit(createUser));
      let promise: ReturnType<typeof result.current.submit> | null = null;

      act(() => {
        promise = result.current.submit({ payload: { name: "Maciej" } });
      });
      const call = await waitForCall(0);
      act(() => {
        call.succeed({ id: 1, name: "Maciej" }, 201);
      });

      await expect(promise).resolves.toStrictEqual({
        data: { id: 1, name: "Maciej" },
        error: null,
        status: 201,
        success: true,
        extra: { headers: { "content-type": "application/json" } },
        requestTimestamp: expect.toBeNumber(),
        responseTimestamp: expect.toBeNumber(),
      });
    });
    it("should resolve with the error response instead of rejecting", async () => {
      const { createUser, waitForCall } = setup();
      const { result } = renderHook(() => useUntrackedSubmit(createUser));
      let promise: ReturnType<typeof result.current.submit> | null = null;

      act(() => {
        promise = result.current.submit({ payload: { name: "Maciej" } });
      });
      const call = await waitForCall(0);
      act(() => {
        call.fail({ message: "Name is taken" }, 409);
      });

      await expect(promise).resolves.toStrictEqual({
        data: null,
        error: { message: "Name is taken" },
        status: 409,
        success: false,
        extra: { headers: { "content-type": "application/json" } },
        requestTimestamp: expect.toBeNumber(),
        responseTimestamp: expect.toBeNumber(),
      });
    });
    it("should resolve with an error response when the request gets aborted", async () => {
      const { createUser, waitForCall } = setup();
      const { result } = renderHook(() => useUntrackedSubmit(createUser));
      let promise: ReturnType<typeof result.current.submit> | null = null;

      act(() => {
        promise = result.current.submit({ payload: { name: "Maciej" } });
      });
      await waitForCall(0);
      act(() => {
        result.current.abort();
      });

      const response = await promise!;
      expect(response.success).toBeFalse();
      expect(response.data).toBeNull();
      expect(response.error).toBeInstanceOf(Error);
    });
    it("should resolve with the abort error when a newer cancelable submit replaces the request", async () => {
      const { createUser, waitForCall } = setup();
      const { result } = renderHook(() => useUntrackedSubmit(createUser.setCancelable(true)));
      let promise: ReturnType<typeof result.current.submit> | null = null;

      act(() => {
        promise = result.current.submit({ payload: { name: "First" } });
      });
      await waitForCall(0);
      act(() => {
        result.current.submit({ payload: { name: "Second" } });
      });

      const response = await promise!;
      expect(response.success).toBeFalse();
      expect(response.error).toStrictEqual(getErrorMessage("abort"));
      expect(response.status).toBe(0);
    });
    it("should resolve only once the retries are over", async () => {
      vi.useFakeTimers();
      const { createUser, calls } = setup();
      const { result } = renderHook(() => useUntrackedSubmit(createUser.setRetry(1).setRetryTime(5000)));
      const settled = vi.fn();

      act(() => {
        result.current.submit({ payload: { name: "Maciej" } }).then(settled);
      });
      await advance();
      calls[0].fail({ message: "Temporary" }, 503);
      await advance(5000);
      expect(settled).not.toHaveBeenCalled();

      calls[1].succeed({ id: 1, name: "Maciej" });
      await advance();

      expect(settled).toHaveBeenCalledTimes(1);
      expect(settled.mock.calls[0][0].data).toStrictEqual({ id: 1, name: "Maciej" });
      expect(settled.mock.calls[0][0].success).toBeTrue();
    });
    it("should resolve with the last error when every retry fails", async () => {
      vi.useFakeTimers();
      const { createUser, calls } = setup();
      const { result } = renderHook(() => useUntrackedSubmit(createUser.setRetry(1).setRetryTime(5000)));
      const settled = vi.fn();

      act(() => {
        result.current.submit({ payload: { name: "Maciej" } }).then(settled);
      });
      await advance();
      calls[0].fail({ message: "First" }, 500);
      await advance(5000);
      calls[1].fail({ message: "Second" }, 500);
      await advance();

      expect(settled).toHaveBeenCalledTimes(1);
      expect(settled.mock.calls[0][0].error).toStrictEqual({ message: "Second" });
      expect(settled.mock.calls[0][0].success).toBeFalse();
    });
    it("should resolve even when the hook unmounted in the meantime", async () => {
      const { createUser, waitForCall } = setup();
      const { result, unmount } = renderHook(() => useUntrackedSubmit(createUser));
      let promise: ReturnType<typeof result.current.submit> | null = null;
      act(() => {
        promise = result.current.submit({ payload: { name: "Maciej" } });
      });
      const call = await waitForCall(0);

      unmount();
      call.succeed({ id: 1, name: "Maciej" });

      const response = await promise!;
      expect(response.data).toStrictEqual({ id: 1, name: "Maciej" });
      expect(response.success).toBeTrue();
    });
    it("should resolve with the error even when the hook unmounted in the meantime", async () => {
      const { createUser, waitForCall } = setup();
      const { result, unmount } = renderHook(() => useUntrackedSubmit(createUser));
      let promise: ReturnType<typeof result.current.submit> | null = null;
      act(() => {
        promise = result.current.submit({ payload: { name: "Maciej" } });
      });
      const call = await waitForCall(0);

      unmount();
      call.fail({ message: "Nope" }, 400);

      const response = await promise!;
      expect(response.error).toStrictEqual({ message: "Nope" });
      expect(response.success).toBeFalse();
    });
    it("should resolve every parallel submit with its own response", async () => {
      const { createUser, waitForCalls } = setup();
      const { result } = renderHook(() => useUntrackedSubmit(createUser));
      let promises: ReturnType<typeof result.current.submit>[] = [];

      act(() => {
        promises = ["First", "Second", "Third"].map((name) => result.current.submit({ payload: { name } }));
      });
      const calls = await waitForCalls(3);
      act(() => {
        // Answer in a different order than the requests were sent
        calls[2].succeed({ id: 3, name: "Third" });
        calls[0].succeed({ id: 1, name: "First" });
        calls[1].succeed({ id: 2, name: "Second" });
      });

      const responses = await Promise.all(promises);
      expect(responses.map((response) => response.data)).toStrictEqual([
        { id: 1, name: "First" },
        { id: 2, name: "Second" },
        { id: 3, name: "Third" },
      ]);
    });
    it("should resolve the parallel submits when one of them fails", async () => {
      const { createUser, waitForCalls } = setup();
      const { result } = renderHook(() => useUntrackedSubmit(createUser));
      let promises: ReturnType<typeof result.current.submit>[] = [];

      act(() => {
        promises = ["First", "Second"].map((name) => result.current.submit({ payload: { name } }));
      });
      const calls = await waitForCalls(2);
      act(() => {
        calls[0].fail({ message: "First failed" }, 500);
        calls[1].succeed({ id: 2, name: "Second" });
      });

      const responses = await Promise.all(promises);
      expect(responses.map((response) => response.success)).toStrictEqual([false, true]);
      expect(responses[0].error).toStrictEqual({ message: "First failed" });
      expect(responses[1].data).toStrictEqual({ id: 2, name: "Second" });
    });
    it("should allow to chain the submits one after another", async () => {
      const { createUser, waitForCall, calls } = setup();
      const { result } = renderHook(() => useUntrackedSubmit(createUser));
      const names: string[] = [];

      const chain = (async () => {
        const first = await result.current.submit({ payload: { name: "First" } });
        names.push(first.data?.name ?? "");
        const second = await result.current.submit({ payload: { name: `${first.data?.name} + Second` } });
        names.push(second.data?.name ?? "");
      })();
      const firstCall = await waitForCall(0);
      expect(calls).toHaveLength(1);
      act(() => {
        firstCall.succeed({ id: 1, name: "First" });
      });
      const secondCall = await waitForCall(1);
      act(() => {
        secondCall.succeed({ id: 2, name: (secondCall.request.payload as { name: string }).name });
      });
      await act(async () => {
        await chain;
      });

      expect(names).toStrictEqual(["First", "First + Second"]);
    });
    it("should not send the next submit of a chain when the code stops on an error", async () => {
      const { createUser, waitForCall, calls } = setup();
      const { result } = renderHook(() => useUntrackedSubmit(createUser));

      const chain = (async () => {
        const first = await result.current.submit({ payload: { name: "First" } });
        if (!first.success) {
          return "stopped";
        }
        await result.current.submit({ payload: { name: "Second" } });
        return "finished";
      })();
      const firstCall = await waitForCall(0);
      act(() => {
        firstCall.fail({ message: "Nope" }, 400);
      });
      let outcome = "";
      await act(async () => {
        outcome = await chain;
      });

      expect(outcome).toBe("stopped");
      expect(calls).toHaveLength(1);
    });
    it("should resolve with the full response when the hook selects a part of the data", async () => {
      const { createUser, waitForCall } = setup();
      const { result } = renderHook(() =>
        useSubmit(createUser, { dependencyTracking: false, select: (user) => user.name }),
      );
      let promise: ReturnType<typeof result.current.submit> | null = null;

      act(() => {
        promise = result.current.submit({ payload: { name: "Maciej" } });
      });
      const call = await waitForCall(0);
      act(() => {
        call.succeed({ id: 1, name: "Maciej" });
      });

      const response = await promise!;
      expect(response.data).toStrictEqual({ id: 1, name: "Maciej" });
      await waitFor(() => {
        expect(result.current.data).toBe("Maciej");
      });
    });
  });

  describe("when submit gets an empty payload", () => {
    it("should send no payload for null instead of the payload set on the request", async () => {
      const { client, waitForCall } = setup();
      const request = client
        .createRequest<{ response: User; payload: { name: string } | null }>()({ endpoint: "/users", method: "PUT" })
        .setPayload({ name: "From request" });
      const { result } = renderHook(() => useUntrackedSubmit(request));

      act(() => {
        result.current.submit({ payload: null });
      });

      const call = await waitForCall(0);
      expect(call.request.payload).toBeUndefined();
    });
    it("should send the payload set on the request when submit gets none", async () => {
      const { client, waitForCall } = setup();
      const request = client
        .createRequest<{ response: User; payload: { name: string } }>()({ endpoint: "/users", method: "PUT" })
        .setPayload({ name: "From request" });
      const { result } = renderHook(() => useUntrackedSubmit(request));

      act(() => {
        result.current.submit();
      });

      const call = await waitForCall(0);
      expect(call.request.payload).toStrictEqual({ name: "From request" });
    });
  });

  describe("when the hook is disabled", () => {
    it("should not send the request", async () => {
      vi.useFakeTimers();
      const { createUser, calls } = setup();
      const { result } = renderHook(() => useUntrackedSubmit(createUser, { disabled: true }));

      act(() => {
        result.current.submit({ payload: { name: "Maciej" } });
      });
      await advance(1000);

      expect(calls).toHaveLength(0);
      expect(result.current.submitting).toBeFalse();
    });
    it("should resolve right away with a complete error response", async () => {
      const { createUser } = setup();
      const { result } = renderHook(() => useUntrackedSubmit(createUser, { disabled: true }));

      const response = await result.current.submit({ payload: { name: "Maciej" } });

      expect(response).toStrictEqual({
        data: null,
        error: expect.any(Error),
        status: null,
        success: false,
        extra: createUser.client.adapter.defaultExtra,
        requestTimestamp: expect.toBeNumber(),
        responseTimestamp: expect.toBeNumber(),
      });
      expect((response.error as Error).message).toContain("disabled");
    });
    it("should not change the state", async () => {
      const { createUser } = setup();
      const { result } = renderHook(() => useUntrackedSubmit(createUser, { disabled: true }));

      await act(async () => {
        await result.current.submit({ payload: { name: "Maciej" } });
      });

      expect(result.current.error).toBeNull();
      expect(result.current.data).toBeNull();
      expect(result.current.success).toBeFalse();
    });
    it("should not call the hook callbacks", async () => {
      const { createUser } = setup();
      const spy = vi.fn();
      const { result } = renderHook(() => {
        const view = useUntrackedSubmit(createUser, { disabled: true });
        view.onSubmitRequestStart(spy);
        view.onSubmitError(spy);
        view.onSubmitFinished(spy);
        return view;
      });

      await act(async () => {
        await result.current.submit({ payload: { name: "Maciej" } });
      });

      expect(spy).not.toHaveBeenCalled();
    });
    it("should not call the onBeforeSent callback", async () => {
      const { createUser } = setup();
      const onBeforeSent = vi.fn();
      const { result } = renderHook(() => useUntrackedSubmit(createUser, { disabled: true }));

      await act(async () => {
        await result.current.submit({ payload: { name: "Maciej" }, onBeforeSent });
      });

      expect(onBeforeSent).not.toHaveBeenCalled();
    });
    it("should send the request once the hook gets enabled", async () => {
      const { createUser, waitForCall } = setup();
      const { result, rerender } = renderHook(
        ({ disabled }: { disabled: boolean }) => useUntrackedSubmit(createUser, { disabled }),
        { initialProps: { disabled: true } },
      );

      rerender({ disabled: false });
      act(() => {
        result.current.submit({ payload: { name: "Maciej" } });
      });

      const call = await waitForCall(0);
      expect(call.request.payload).toStrictEqual({ name: "Maciej" });
    });
    it("should stop sending the requests once the hook gets disabled", async () => {
      const { createUser, calls } = setup();
      const { result, rerender } = renderHook(
        ({ disabled }: { disabled: boolean }) => useUntrackedSubmit(createUser, { disabled }),
        { initialProps: { disabled: false } },
      );

      rerender({ disabled: true });
      const response = await result.current.submit({ payload: { name: "Maciej" } });

      expect(response.success).toBeFalse();
      expect(calls).toHaveLength(0);
    });
    it("should take the disabled option from the provider config", async () => {
      const { createUser, calls } = setup();
      const wrapper = ({ children }: { children: ReactNode }) => (
        <Provider config={{ useSubmitConfig: { disabled: true } }}>{children}</Provider>
      );
      const { result } = renderHook(() => useUntrackedSubmit(createUser), { wrapper });

      const response = await result.current.submit({ payload: { name: "Maciej" } });

      expect(response.success).toBeFalse();
      expect(calls).toHaveLength(0);
    });
    it("should prefer the hook options over the provider config", async () => {
      const { createUser, waitForCall } = setup();
      const wrapper = ({ children }: { children: ReactNode }) => (
        <Provider config={{ useSubmitConfig: { disabled: true } }}>{children}</Provider>
      );
      const { result } = renderHook(() => useUntrackedSubmit(createUser, { disabled: false }), { wrapper });

      act(() => {
        result.current.submit({ payload: { name: "Maciej" } });
      });

      const call = await waitForCall(0);
      expect(call.request.payload).toStrictEqual({ name: "Maciej" });
    });
  });
});
