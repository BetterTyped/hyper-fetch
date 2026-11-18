import type { RequestInstance } from "@hyper-fetch/core";
import { act, renderHook, waitFor } from "@testing-library/react";
import type { UseSubmitReturnType } from "hooks/use-submit";
import { useSubmit } from "hooks/use-submit";
import type { Mock } from "vitest";
import { onTestFinished } from "vitest";

import { createGatedClient } from "../../utils/gated-client.utils";

type User = { id: number; name: string };

const setup = (options?: { retry?: number; retryTime?: number; cancelable?: boolean; queued?: boolean }) => {
  const gated = createGatedClient();
  const request = gated.client.createRequest<{ response: User; payload: { name: string } }>()({
    endpoint: "/users",
    method: "POST",
    retry: options?.retry ?? 0,
    retryTime: options?.retryTime ?? 0,
    cancelable: options?.cancelable ?? false,
    queued: options?.queued ?? false,
  });
  return { ...gated, request };
};

// eslint-disable-next-line @typescript-eslint/no-explicit-any
type EventSpy = Mock<(params: any) => void>;

type Events = {
  order: string[];
  success: EventSpy;
  error: EventSpy;
  finished: EventSpy;
  requestStart: EventSpy;
  responseStart: EventSpy;
  upload: EventSpy;
  download: EventSpy;
  abort: EventSpy;
  offline: EventSpy;
};

const createEvents = (): Events => {
  const order: string[] = [];
  const track = (name: string): EventSpy =>
    vi.fn(() => {
      order.push(name);
    });
  return {
    order,
    success: track("success"),
    error: track("error"),
    finished: track("finished"),
    requestStart: track("requestStart"),
    responseStart: track("responseStart"),
    upload: vi.fn<(params: any) => void>(),
    download: vi.fn<(params: any) => void>(),
    abort: track("abort"),
    offline: track("offline"),
  };
};

/** Registers every callback the way components do - during the render */
const useSubmitWithEvents = <T extends RequestInstance>(request: T, events: Events) => {
  const view = useSubmit(request, { dependencyTracking: false });
  view.onSubmitSuccess(events.success);
  view.onSubmitError(events.error);
  view.onSubmitFinished(events.finished);
  view.onSubmitRequestStart(events.requestStart);
  view.onSubmitResponseStart(events.responseStart);
  view.onSubmitUploadProgress(events.upload);
  view.onSubmitDownloadProgress(events.download);
  view.onSubmitAbort(events.abort);
  view.onSubmitOfflineError(events.offline);
  return view;
};

/** Errors thrown by the user callbacks are reported as unhandled rejections - collect them for the assertions */
const collectReportedErrors = () => {
  const errors: unknown[] = [];
  const handler = (error: unknown) => {
    errors.push(error);
  };
  process.on("unhandledRejection", handler);
  onTestFinished(() => {
    process.off("unhandledRejection", handler);
  });
  return errors;
};

/** Run the pending timers and promise callbacks - for the tests using fake timers */
const advance = async (time = 0) => {
  await act(async () => {
    await vi.advanceTimersByTimeAsync(time);
  });
};

describe("useSubmit [ Callbacks ]", () => {
  afterEach(() => {
    vi.useRealTimers();
  });

  describe("when the submit succeeds", () => {
    it("should call the callbacks in the lifecycle order", async () => {
      const { request, waitForCall } = setup();
      const events = createEvents();
      const { result } = renderHook(() => useSubmitWithEvents(request, events));
      let promise: Promise<unknown> = Promise.resolve();

      act(() => {
        promise = result.current.submit({ payload: { name: "Maciej" } }).then(() => events.order.push("resolved"));
      });
      const call = await waitForCall(0);
      await act(async () => {
        call.succeed({ id: 1, name: "Maciej" });
        await promise;
      });

      expect(events.order).toStrictEqual(["requestStart", "responseStart", "success", "finished", "resolved"]);
    });
    it("should call every callback once", async () => {
      const { request, waitForCall } = setup();
      const events = createEvents();
      const { result } = renderHook(() => useSubmitWithEvents(request, events));
      let promise: Promise<unknown> = Promise.resolve();

      act(() => {
        promise = result.current.submit({ payload: { name: "Maciej" } });
      });
      const call = await waitForCall(0);
      await act(async () => {
        call.succeed({ id: 1, name: "Maciej" });
        await promise;
      });

      expect(events.requestStart).toHaveBeenCalledTimes(1);
      expect(events.responseStart).toHaveBeenCalledTimes(1);
      expect(events.success).toHaveBeenCalledTimes(1);
      expect(events.finished).toHaveBeenCalledTimes(1);
    });
    it("should not call the error, abort and offline callbacks", async () => {
      const { request, waitForCall } = setup();
      const events = createEvents();
      const { result } = renderHook(() => useSubmitWithEvents(request, events));
      let promise: Promise<unknown> = Promise.resolve();

      act(() => {
        promise = result.current.submit({ payload: { name: "Maciej" } });
      });
      const call = await waitForCall(0);
      await act(async () => {
        call.succeed({ id: 1, name: "Maciej" });
        await promise;
      });

      expect(events.error).not.toHaveBeenCalled();
      expect(events.abort).not.toHaveBeenCalled();
      expect(events.offline).not.toHaveBeenCalled();
    });
    it("should pass the response, the request and its details as a single object", async () => {
      const { request, waitForCall } = setup();
      const events = createEvents();
      const { result } = renderHook(() => useSubmitWithEvents(request, events));
      let promise: Promise<unknown> = Promise.resolve();

      act(() => {
        promise = result.current.submit({ payload: { name: "Maciej" } });
      });
      const call = await waitForCall(0);
      await act(async () => {
        call.succeed({ id: 1, name: "Maciej" }, 201);
        await promise;
      });

      const [params] = events.success.mock.calls[0];
      expect(events.success.mock.calls[0]).toHaveLength(1);
      expect(params.response.data).toStrictEqual({ id: 1, name: "Maciej" });
      expect(params.response.status).toBe(201);
      expect(params.response.success).toBeTrue();
      expect(params.response.error).toBeNull();
      expect(params.requestId).toBe(call.requestId);
      expect(params.request.payload).toStrictEqual({ name: "Maciej" });
      expect(params.details.retries).toBe(0);
      expect(params.details.isCanceled).toBeFalse();
      expect(params.details.isOffline).toBeFalse();
      expect(params.details.willRetry).toBeFalse();
      expect(params.mutationContext).toBeUndefined();
    });
    it("should pass the same response to onSubmitSuccess and onSubmitFinished", async () => {
      const { request, waitForCall } = setup();
      const events = createEvents();
      const { result } = renderHook(() => useSubmitWithEvents(request, events));
      let promise: Promise<unknown> = Promise.resolve();

      act(() => {
        promise = result.current.submit({ payload: { name: "Maciej" } });
      });
      const call = await waitForCall(0);
      await act(async () => {
        call.succeed({ id: 1, name: "Maciej" });
        await promise;
      });

      expect(events.finished.mock.calls[0][0].response).toStrictEqual(events.success.mock.calls[0][0].response);
      expect(events.finished.mock.calls[0][0].requestId).toBe(call.requestId);
    });
    it("should pass the request to the start callbacks", async () => {
      const { request, waitForCall } = setup();
      const events = createEvents();
      const { result } = renderHook(() => useSubmitWithEvents(request, events));

      act(() => {
        result.current.submit({ payload: { name: "Maciej" } });
      });
      const call = await waitForCall(0);

      expect(events.requestStart).toHaveBeenCalledTimes(1);
      expect(events.requestStart.mock.calls[0][0].requestId).toBe(call.requestId);
      expect(events.requestStart.mock.calls[0][0].request.payload).toStrictEqual({ name: "Maciej" });
      expect(events.responseStart).not.toHaveBeenCalled();
    });
    it("should call the callbacks once for every submit", async () => {
      const { request, waitForCalls } = setup();
      const events = createEvents();
      const { result } = renderHook(() => useSubmitWithEvents(request, events));
      let promises: Promise<unknown>[] = [];

      act(() => {
        promises = ["First", "Second", "Third"].map((name) => result.current.submit({ payload: { name } }));
      });
      const calls = await waitForCalls(3);
      await act(async () => {
        calls.forEach((call, index) => call.succeed({ id: index, name: `User ${index}` }));
        await Promise.all(promises);
      });

      expect(events.requestStart).toHaveBeenCalledTimes(3);
      expect(events.success).toHaveBeenCalledTimes(3);
      expect(events.finished).toHaveBeenCalledTimes(3);
      expect(events.success.mock.calls.map(([params]) => params.requestId).toSorted()).toStrictEqual(
        calls.map((call) => call.requestId).toSorted(),
      );
    });
  });

  describe("when the submit fails", () => {
    it("should call the callbacks in the lifecycle order", async () => {
      const { request, waitForCall } = setup();
      const events = createEvents();
      const { result } = renderHook(() => useSubmitWithEvents(request, events));
      let promise: Promise<unknown> = Promise.resolve();

      act(() => {
        promise = result.current.submit({ payload: { name: "Maciej" } }).then(() => events.order.push("resolved"));
      });
      const call = await waitForCall(0);
      await act(async () => {
        call.fail({ message: "Nope" }, 400);
        await promise;
      });

      expect(events.order).toStrictEqual(["requestStart", "responseStart", "error", "finished", "resolved"]);
    });
    it("should not call the success callback", async () => {
      const { request, waitForCall } = setup();
      const events = createEvents();
      const { result } = renderHook(() => useSubmitWithEvents(request, events));
      let promise: Promise<unknown> = Promise.resolve();

      act(() => {
        promise = result.current.submit({ payload: { name: "Maciej" } });
      });
      const call = await waitForCall(0);
      await act(async () => {
        call.fail({ message: "Nope" }, 400);
        await promise;
      });

      expect(events.success).not.toHaveBeenCalled();
      expect(events.error).toHaveBeenCalledTimes(1);
      expect(events.finished).toHaveBeenCalledTimes(1);
    });
    it("should pass the error response as a single object", async () => {
      const { request, waitForCall } = setup();
      const events = createEvents();
      const { result } = renderHook(() => useSubmitWithEvents(request, events));
      let promise: Promise<unknown> = Promise.resolve();

      act(() => {
        promise = result.current.submit({ payload: { name: "Maciej" } });
      });
      const call = await waitForCall(0);
      await act(async () => {
        call.fail({ message: "Name is taken" }, 409);
        await promise;
      });

      const [params] = events.error.mock.calls[0];
      expect(events.error.mock.calls[0]).toHaveLength(1);
      expect(params.response.error).toStrictEqual({ message: "Name is taken" });
      expect(params.response.status).toBe(409);
      expect(params.response.success).toBeFalse();
      expect(params.response.data).toBeNull();
      expect(params.requestId).toBe(call.requestId);
      expect(params.details.willRetry).toBeFalse();
    });
    it("should report every failed attempt of a retried request", async () => {
      vi.useFakeTimers();
      const { request, calls } = setup({ retry: 2, retryTime: 5000 });
      const events = createEvents();
      const { result } = renderHook(() => useSubmitWithEvents(request, events));

      act(() => {
        result.current.submit({ payload: { name: "Maciej" } });
      });
      await advance();
      for (let attempt = 0; attempt < 3; attempt += 1) {
        calls[attempt].fail({ message: `Attempt ${attempt}` }, 500);
        // eslint-disable-next-line no-await-in-loop
        await advance(5000);
      }

      expect(events.error).toHaveBeenCalledTimes(3);
      expect(events.error.mock.calls.map(([params]) => params.details.willRetry)).toStrictEqual([true, true, false]);
      expect(events.error.mock.calls.map(([params]) => params.details.retries)).toStrictEqual([0, 1, 2]);
      expect(events.requestStart).toHaveBeenCalledTimes(3);
      expect(events.success).not.toHaveBeenCalled();
    });
    it("should call the success callback when the retry succeeds", async () => {
      vi.useFakeTimers();
      const { request, calls } = setup({ retry: 1, retryTime: 5000 });
      const events = createEvents();
      const { result } = renderHook(() => useSubmitWithEvents(request, events));

      act(() => {
        result.current.submit({ payload: { name: "Maciej" } });
      });
      await advance();
      calls[0].fail();
      await advance(5000);
      calls[1].succeed({ id: 1, name: "Maciej" });
      await advance();

      expect(events.order).toStrictEqual([
        "requestStart",
        "responseStart",
        "error",
        "finished",
        "requestStart",
        "responseStart",
        "success",
        "finished",
      ]);
      expect(events.success.mock.calls[0][0].details.retries).toBe(1);
    });
  });

  describe("when the request reports its progress", () => {
    it("should call the upload progress callback", async () => {
      const { request, waitForCall } = setup();
      const events = createEvents();
      const { result } = renderHook(() => useSubmitWithEvents(request, events));

      act(() => {
        result.current.submit({ payload: { name: "Maciej" } });
      });
      const call = await waitForCall(0);
      events.upload.mockClear();
      act(() => {
        call.upload(30, 100);
        call.upload(100, 100);
      });

      expect(events.upload).toHaveBeenCalledTimes(2);
      expect(events.upload.mock.calls[0][0]).toMatchObject({ loaded: 30, total: 100, progress: 30, sizeLeft: 70 });
      expect(events.upload.mock.calls[1][0]).toMatchObject({ loaded: 100, total: 100, progress: 100, sizeLeft: 0 });
      expect(events.upload.mock.calls[0][0].requestId).toBe(call.requestId);
    });
    it("should call the download progress callback", async () => {
      const { request, waitForCall } = setup();
      const events = createEvents();
      const { result } = renderHook(() => useSubmitWithEvents(request, events));

      act(() => {
        result.current.submit({ payload: { name: "Maciej" } });
      });
      const call = await waitForCall(0);
      act(() => {
        call.download(25, 50);
      });

      expect(events.download).toHaveBeenCalledTimes(1);
      expect(events.download.mock.calls[0][0]).toMatchObject({ loaded: 25, total: 50, progress: 50 });
    });
    it("should report the progress of every request in flight", async () => {
      const { request, waitForCalls } = setup();
      const events = createEvents();
      const { result } = renderHook(() => useSubmitWithEvents(request, events));

      act(() => {
        result.current.submit({ payload: { name: "First" } });
        result.current.submit({ payload: { name: "Second" } });
      });
      const calls = await waitForCalls(2);
      events.upload.mockClear();
      act(() => {
        calls[0].upload(10, 100);
        calls[1].upload(90, 100);
      });

      expect(events.upload.mock.calls.map(([params]) => [params.requestId, params.loaded])).toStrictEqual([
        [calls[0].requestId, 10],
        [calls[1].requestId, 90],
      ]);
    });
  });

  describe("when the callbacks change between renders", () => {
    it("should call the callback from the latest render", async () => {
      const { request, waitForCall } = setup();
      const seen: string[] = [];
      const { result, rerender } = renderHook(
        ({ label }: { label: string }) => {
          const view = useSubmit(request, { dependencyTracking: false });
          view.onSubmitSuccess(() => {
            seen.push(label);
          });
          return view;
        },
        { initialProps: { label: "first render" } },
      );
      let promise: Promise<unknown> = Promise.resolve();
      act(() => {
        promise = result.current.submit({ payload: { name: "Maciej" } });
      });
      const call = await waitForCall(0);

      rerender({ label: "latest render" });
      await act(async () => {
        call.succeed({ id: 1, name: "Maciej" });
        await promise;
      });

      expect(seen).toStrictEqual(["latest render"]);
    });
    it("should call the error callback from the latest render", async () => {
      const { request, waitForCall } = setup();
      const seen: string[] = [];
      const { result, rerender } = renderHook(
        ({ label }: { label: string }) => {
          const view = useSubmit(request, { dependencyTracking: false });
          view.onSubmitError(() => {
            seen.push(label);
          });
          return view;
        },
        { initialProps: { label: "first render" } },
      );
      let promise: Promise<unknown> = Promise.resolve();
      act(() => {
        promise = result.current.submit({ payload: { name: "Maciej" } });
      });
      const call = await waitForCall(0);

      rerender({ label: "latest render" });
      await act(async () => {
        call.fail();
        await promise;
      });

      expect(seen).toStrictEqual(["latest render"]);
    });
    it("should work without any callback registered", async () => {
      const { request, waitForCall } = setup();
      const { result } = renderHook(() => useSubmit(request, { dependencyTracking: false }));
      let promise: ReturnType<UseSubmitReturnType<typeof request>["submit"]> | null = null;

      act(() => {
        promise = result.current.submit({ payload: { name: "Maciej" } });
      });
      const call = await waitForCall(0);
      act(() => {
        call.succeed({ id: 1, name: "Maciej" });
      });

      const response = await promise!;
      expect(response.success).toBeTrue();
    });
  });

  describe("when the hook unmounts before the response", () => {
    it("should not call the callbacks", async () => {
      const { request, waitForCall } = setup();
      const events = createEvents();
      const { result, unmount } = renderHook(() => useSubmitWithEvents(request, events));
      let promise: Promise<unknown> = Promise.resolve();
      act(() => {
        promise = result.current.submit({ payload: { name: "Maciej" } });
      });
      const call = await waitForCall(0);
      events.upload.mockClear();

      unmount();
      call.upload(1, 2);
      call.succeed({ id: 1, name: "Maciej" });
      await promise;

      expect(events.success).not.toHaveBeenCalled();
      expect(events.finished).not.toHaveBeenCalled();
      expect(events.responseStart).not.toHaveBeenCalled();
      expect(events.upload).not.toHaveBeenCalled();
    });
    it("should not call the error callbacks", async () => {
      const { request, waitForCall } = setup();
      const events = createEvents();
      const { result, unmount } = renderHook(() => useSubmitWithEvents(request, events));
      let promise: Promise<unknown> = Promise.resolve();
      act(() => {
        promise = result.current.submit({ payload: { name: "Maciej" } });
      });
      const call = await waitForCall(0);

      unmount();
      call.fail();
      await promise;

      expect(events.error).not.toHaveBeenCalled();
      expect(events.finished).not.toHaveBeenCalled();
    });
  });

  describe("when two hooks use the same request", () => {
    it("should call the callbacks only in the hook that submitted", async () => {
      const { request, waitForCall } = setup();
      const submitterEvents = createEvents();
      const observerEvents = createEvents();
      const submitter = renderHook(() => useSubmitWithEvents(request, submitterEvents));
      renderHook(() => useSubmitWithEvents(request, observerEvents));
      let promise: Promise<unknown> = Promise.resolve();

      act(() => {
        promise = submitter.result.current.submit({ payload: { name: "Maciej" } });
      });
      const call = await waitForCall(0);
      await act(async () => {
        call.succeed({ id: 1, name: "Maciej" });
        await promise;
      });

      expect(submitterEvents.success).toHaveBeenCalledTimes(1);
      expect(submitterEvents.finished).toHaveBeenCalledTimes(1);
      expect(observerEvents.requestStart).not.toHaveBeenCalled();
      expect(observerEvents.success).not.toHaveBeenCalled();
      expect(observerEvents.finished).not.toHaveBeenCalled();
    });
  });

  describe("when a newer cancelable submit replaces the request", () => {
    it("should call the abort callback for the replaced request", async () => {
      const { request, waitForCall } = setup({ cancelable: true });
      const events = createEvents();
      const { result } = renderHook(() => useSubmitWithEvents(request, events));
      let promise: Promise<unknown> = Promise.resolve();
      act(() => {
        result.current.submit({ payload: { name: "First" } });
      });
      const firstCall = await waitForCall(0);

      act(() => {
        promise = result.current.submit({ payload: { name: "Second" } });
      });
      const secondCall = await waitForCall(1);
      await act(async () => {
        secondCall.succeed({ id: 2, name: "Second" });
        await promise;
      });

      expect(events.abort).toHaveBeenCalledTimes(1);
      expect(events.abort.mock.calls[0][0].requestId).toBe(firstCall.requestId);
      expect(events.abort.mock.calls[0][0].details.isCanceled).toBeTrue();
      expect(events.error).not.toHaveBeenCalled();
      expect(events.success).toHaveBeenCalledTimes(1);
      expect(events.success.mock.calls[0][0].requestId).toBe(secondCall.requestId);
      expect(events.finished).toHaveBeenCalledTimes(2);
    });
  });

  describe("when the application is offline", () => {
    it("should call the offline callback instead of the error callback", async () => {
      const { request, client, waitForCall } = setup();
      const events = createEvents();
      const { result } = renderHook(() => useSubmitWithEvents(request, events));
      act(() => {
        result.current.submit({ payload: { name: "Maciej" } });
      });
      const call = await waitForCall(0);

      act(() => {
        client.appManager.setOnline(false);
        call.fail({ message: "Network error" }, 0);
      });

      await waitFor(() => {
        expect(events.offline).toHaveBeenCalledTimes(1);
      });
      expect(events.offline.mock.calls[0][0].details.isOffline).toBeTrue();
      expect(events.error).not.toHaveBeenCalled();
      expect(events.finished).toHaveBeenCalledTimes(1);
    });
    it("should call the error callback for a request that does not wait for the network", async () => {
      const { request, client, waitForCall } = setup();
      const events = createEvents();
      const { result } = renderHook(() => useSubmitWithEvents(request.setOffline(false), events));
      act(() => {
        result.current.submit({ payload: { name: "Maciej" } });
      });
      const call = await waitForCall(0);

      act(() => {
        client.appManager.setOnline(false);
        call.fail({ message: "Network error" }, 0);
      });

      await waitFor(() => {
        expect(events.error).toHaveBeenCalledTimes(1);
      });
      expect(events.offline).not.toHaveBeenCalled();
    });
  });

  describe("when a callback submits another request", () => {
    it("should send the follow-up request from the success callback", async () => {
      const { request, client, waitForCall } = setup();
      const followUp = client.createRequest<{ response: { sent: boolean }; payload: { userId: number } }>()({
        endpoint: "/welcome-emails",
        method: "POST",
      });
      const finished: string[] = [];
      const { result } = renderHook(() => {
        const user = useSubmit(request, { dependencyTracking: false });
        const email = useSubmit(followUp, { dependencyTracking: false });
        user.onSubmitSuccess(({ response }) => {
          email.submit({ payload: { userId: response.data.id } });
        });
        user.onSubmitFinished(() => {
          finished.push("user");
        });
        email.onSubmitFinished(() => {
          finished.push("email");
        });
        return { user, email };
      });

      act(() => {
        result.current.user.submit({ payload: { name: "Maciej" } });
      });
      const userCall = await waitForCall(0);
      act(() => {
        userCall.succeed({ id: 7, name: "Maciej" });
      });
      const emailCall = await waitForCall(1);
      expect(emailCall.request.payload).toStrictEqual({ userId: 7 });
      act(() => {
        emailCall.succeed({ sent: true });
      });

      await waitFor(() => {
        expect(result.current.email.data).toStrictEqual({ sent: true });
      });
      expect(finished).toStrictEqual(["user", "email"]);
      expect(result.current.user.data).toStrictEqual({ id: 7, name: "Maciej" });
    });
  });

  describe("when a callback throws", () => {
    const setupThrowing = (
      register: (view: UseSubmitReturnType<ReturnType<typeof setup>["request"]>) => void,
      options?: Parameters<typeof setup>[0],
    ) => {
      const context = setup(options);
      const view = renderHook(() => {
        const submit = useSubmit(context.request, { dependencyTracking: false });
        register(submit);
        return submit;
      });
      return { ...context, view };
    };
    const fail = () => {
      throw new Error("Callback failed");
    };

    it("should still finish the request when onSubmitSuccess throws", async () => {
      const errors = collectReportedErrors();
      const { view, waitForCall, client, request } = setupThrowing((submit) => submit.onSubmitSuccess(fail));
      let promise: ReturnType<typeof view.result.current.submit> | null = null;
      act(() => {
        promise = view.result.current.submit({ payload: { name: "Maciej" } });
      });
      const call = await waitForCall(0);

      act(() => {
        call.succeed({ id: 1, name: "Maciej" });
      });

      const response = await promise!;
      expect(response.data).toStrictEqual({ id: 1, name: "Maciej" });
      await waitFor(() => {
        expect(view.result.current.data).toStrictEqual({ id: 1, name: "Maciej" });
      });
      expect(view.result.current.submitting).toBeFalse();
      expect(client.submitDispatcher.getQueue(request.queryKey).requests).toHaveLength(0);
      await waitFor(() => {
        expect(errors).toHaveLength(1);
      });
      expect((errors[0] as Error).message).toBe("Callback failed");
    });
    it("should still call onSubmitFinished when onSubmitSuccess throws", async () => {
      collectReportedErrors();
      const finished = vi.fn();
      const { view, waitForCall } = setupThrowing((submit) => {
        submit.onSubmitSuccess(fail);
        submit.onSubmitFinished(finished);
      });
      let promise: Promise<unknown> = Promise.resolve();
      act(() => {
        promise = view.result.current.submit({ payload: { name: "Maciej" } });
      });
      const call = await waitForCall(0);

      await act(async () => {
        call.succeed({ id: 1, name: "Maciej" });
        await promise;
      });

      expect(finished).toHaveBeenCalledTimes(1);
    });
    it("should still finish the request when onSubmitError throws", async () => {
      const errors = collectReportedErrors();
      const { view, waitForCall } = setupThrowing((submit) => submit.onSubmitError(fail));
      let promise: ReturnType<typeof view.result.current.submit> | null = null;
      act(() => {
        promise = view.result.current.submit({ payload: { name: "Maciej" } });
      });
      const call = await waitForCall(0);

      act(() => {
        call.fail({ message: "Nope" }, 400);
      });

      const response = await promise!;
      expect(response.error).toStrictEqual({ message: "Nope" });
      await waitFor(() => {
        expect(view.result.current.error).toStrictEqual({ message: "Nope" });
      });
      expect(view.result.current.submitting).toBeFalse();
      await waitFor(() => {
        expect(errors).toHaveLength(1);
      });
    });
    it("should still finish the request when onSubmitFinished throws", async () => {
      const errors = collectReportedErrors();
      const { view, waitForCall } = setupThrowing((submit) => submit.onSubmitFinished(fail));
      let promise: ReturnType<typeof view.result.current.submit> | null = null;
      act(() => {
        promise = view.result.current.submit({ payload: { name: "Maciej" } });
      });
      const call = await waitForCall(0);

      act(() => {
        call.succeed({ id: 1, name: "Maciej" });
      });

      const response = await promise!;
      expect(response.success).toBeTrue();
      await waitFor(() => {
        expect(view.result.current.submitting).toBeFalse();
      });
      await waitFor(() => {
        expect(errors).toHaveLength(1);
      });
    });
    it("should still send the request when onSubmitRequestStart throws", async () => {
      const errors = collectReportedErrors();
      const { view, waitForCall } = setupThrowing((submit) => submit.onSubmitRequestStart(fail));
      let promise: ReturnType<typeof view.result.current.submit> | null = null;
      act(() => {
        promise = view.result.current.submit({ payload: { name: "Maciej" } });
      });
      const call = await waitForCall(0);

      act(() => {
        call.succeed({ id: 1, name: "Maciej" });
      });

      const response = await promise!;
      expect(response.success).toBeTrue();
      expect(response.data).toStrictEqual({ id: 1, name: "Maciej" });
      await waitFor(() => {
        expect(errors).toHaveLength(1);
      });
    });
    it("should still finish the request when a progress callback throws", async () => {
      const errors = collectReportedErrors();
      const { view, waitForCall } = setupThrowing((submit) => submit.onSubmitDownloadProgress(fail));
      let promise: ReturnType<typeof view.result.current.submit> | null = null;
      act(() => {
        promise = view.result.current.submit({ payload: { name: "Maciej" } });
      });
      const call = await waitForCall(0);

      act(() => {
        call.download(1, 2);
        call.succeed({ id: 1, name: "Maciej" });
      });

      const response = await promise!;
      expect(response.success).toBeTrue();
      await waitFor(() => {
        expect(errors.length).toBeGreaterThanOrEqual(1);
      });
    });
    it("should allow to submit again after a callback threw", async () => {
      collectReportedErrors();
      const { view, waitForCall } = setupThrowing((submit) => submit.onSubmitSuccess(fail));
      let promise: Promise<unknown> = Promise.resolve();
      act(() => {
        promise = view.result.current.submit({ payload: { name: "First" } });
      });
      const firstCall = await waitForCall(0);
      await act(async () => {
        firstCall.succeed({ id: 1, name: "First" });
        await promise;
      });

      act(() => {
        view.result.current.submit({ payload: { name: "Second" } });
      });
      const secondCall = await waitForCall(1);
      act(() => {
        secondCall.succeed({ id: 2, name: "Second" });
      });

      await waitFor(() => {
        expect(view.result.current.data).toStrictEqual({ id: 2, name: "Second" });
      });
      expect(view.result.current.submitting).toBeFalse();
    });
    it("should not block the queued requests when a callback throws", async () => {
      collectReportedErrors();
      const { view, waitForCall } = setupThrowing((submit) => submit.onSubmitSuccess(fail), { queued: true });
      let promises: Promise<unknown>[] = [];
      act(() => {
        promises = ["First", "Second"].map((name) => view.result.current.submit({ payload: { name } }));
      });
      const firstCall = await waitForCall(0);

      act(() => {
        firstCall.succeed({ id: 1, name: "First" });
      });
      const secondCall = await waitForCall(1);
      await act(async () => {
        secondCall.succeed({ id: 2, name: "Second" });
        await Promise.all(promises);
      });

      expect(secondCall.request.payload).toStrictEqual({ name: "Second" });
      await waitFor(() => {
        expect(view.result.current.submitting).toBeFalse();
      });
    });
  });
});
