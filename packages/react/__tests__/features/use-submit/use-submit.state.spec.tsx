import type { RequestInstance } from "@hyper-fetch/core";
import { getErrorMessage } from "@hyper-fetch/core";
import { act, fireEvent, render, renderHook, screen, waitFor } from "@testing-library/react";
import { useSubmit } from "hooks/use-submit";
import { StrictMode, useEffect } from "react";

import { createGatedClient } from "../../utils/gated-client.utils";

type User = { id: number; name: string };

const setup = (options?: { retry?: number; retryTime?: number; endpoint?: string }) => {
  const gated = createGatedClient();
  const request = gated.client.createRequest<{ response: User; payload: { name: string } }>()({
    endpoint: options?.endpoint ?? "/users",
    method: "POST",
    retry: options?.retry ?? 0,
    retryTime: options?.retryTime ?? 0,
  });
  return { ...gated, request };
};

/** The tests read the state outside of the render, so the hook has to rerender on every change */
const useUntrackedSubmit = <T extends RequestInstance>(request: T) => useSubmit(request, { dependencyTracking: false });

/** Run the pending timers and promise callbacks - for the tests using fake timers */
const advance = async (time = 0) => {
  await act(async () => {
    await vi.advanceTimersByTimeAsync(time);
  });
};

describe("useSubmit [ State ]", () => {
  afterEach(() => {
    vi.useRealTimers();
  });

  describe("given the hook is idle", () => {
    it("should start with an empty state", () => {
      const { request } = setup();
      const { result } = renderHook(() => useUntrackedSubmit(request));

      expect(result.current.data).toBeNull();
      expect(result.current.error).toBeNull();
      expect(result.current.status).toBeNull();
      expect(result.current.success).toBeFalse();
      expect(result.current.submitting).toBeFalse();
      expect(result.current.retries).toBe(0);
      expect(result.current.requestTimestamp).toBeNull();
      expect(result.current.responseTimestamp).toBeNull();
      expect(result.current.extra).toStrictEqual(request.client.adapter.defaultExtra);
    });
    it("should not send any request on mount", async () => {
      vi.useFakeTimers();
      const { request, calls } = setup();
      renderHook(() => useUntrackedSubmit(request));

      await advance(1000);

      expect(calls).toHaveLength(0);
    });
    it("should not send any request on rerender", async () => {
      vi.useFakeTimers();
      const { request, calls } = setup();
      const { rerender } = renderHook(() => useUntrackedSubmit(request));

      rerender();
      rerender();
      await advance(1000);

      expect(calls).toHaveLength(0);
    });
    it("should not be in the bounce state", () => {
      const { request } = setup();
      const { result } = renderHook(() => useUntrackedSubmit(request));

      expect(result.current.bounce.active).toBeFalse();
    });
  });

  describe("when the submit succeeds", () => {
    it("should be submitting while the request is in flight", async () => {
      const { request, waitForCall } = setup();
      const { result } = renderHook(() => useUntrackedSubmit(request));

      act(() => {
        result.current.submit({ payload: { name: "Maciej" } });
      });
      await waitForCall(0);

      expect(result.current.submitting).toBeTrue();
      expect(result.current.data).toBeNull();
      expect(result.current.error).toBeNull();
    });
    it("should turn on submitting right when submit is called", () => {
      const { request } = setup();
      const { result } = renderHook(() => useUntrackedSubmit(request));

      act(() => {
        result.current.submit({ payload: { name: "Maciej" } });
      });

      expect(result.current.submitting).toBeTrue();
    });
    it("should expose the response", async () => {
      const { request, waitForCall } = setup();
      const { result } = renderHook(() => useUntrackedSubmit(request));
      act(() => {
        result.current.submit({ payload: { name: "Maciej" } });
      });
      const call = await waitForCall(0);

      act(() => {
        call.succeed({ id: 1, name: "Maciej" }, 201);
      });

      await waitFor(() => {
        expect(result.current.data).toStrictEqual({ id: 1, name: "Maciej" });
      });
      expect(result.current.submitting).toBeFalse();
      expect(result.current.success).toBeTrue();
      expect(result.current.status).toBe(201);
      expect(result.current.error).toBeNull();
      expect(result.current.retries).toBe(0);
      expect(result.current.extra).toStrictEqual({ headers: { "content-type": "application/json" } });
      expect(result.current.requestTimestamp).toBeDate();
      expect(result.current.responseTimestamp).toBeDate();
    });
    it("should keep the previous data while the next submit is in flight", async () => {
      const { request, waitForCall } = setup();
      const { result } = renderHook(() => useUntrackedSubmit(request));
      act(() => {
        result.current.submit({ payload: { name: "First" } });
      });
      const firstCall = await waitForCall(0);
      act(() => {
        firstCall.succeed({ id: 1, name: "First" });
      });
      await waitFor(() => {
        expect(result.current.submitting).toBeFalse();
      });

      act(() => {
        result.current.submit({ payload: { name: "Second" } });
      });
      await waitForCall(1);

      expect(result.current.submitting).toBeTrue();
      expect(result.current.data).toStrictEqual({ id: 1, name: "First" });
    });
    it("should replace the data with the response of the next submit", async () => {
      const { request, waitForCall } = setup();
      const { result } = renderHook(() => useUntrackedSubmit(request));

      for (let index = 0; index < 3; index += 1) {
        act(() => {
          result.current.submit({ payload: { name: `User ${index}` } });
        });
        // eslint-disable-next-line no-await-in-loop
        const call = await waitForCall(index);
        act(() => {
          call.succeed({ id: index, name: `User ${index}` });
        });
        // eslint-disable-next-line no-await-in-loop
        await waitFor(() => {
          expect(result.current.data).toStrictEqual({ id: index, name: `User ${index}` });
        });
        expect(result.current.submitting).toBeFalse();
      }
    });
    it("should go through idle, submitting and success exactly once", async () => {
      const { request, waitForCall } = setup();
      const renders: string[] = [];
      const { result } = renderHook(() => {
        const view = useSubmit(request);
        const snapshot = `${view.submitting}:${view.success}:${view.data?.id ?? null}`;
        if (renders.at(-1) !== snapshot) {
          renders.push(snapshot);
        }
        return view;
      });

      act(() => {
        result.current.submit({ payload: { name: "Maciej" } });
      });
      const call = await waitForCall(0);
      act(() => {
        call.succeed({ id: 1, name: "Maciej" });
      });
      await waitFor(() => {
        expect(result.current.success).toBeTrue();
      });

      expect(renders).toStrictEqual(["false:false:null", "true:false:null", "false:true:1"]);
    });
  });

  describe("when the submit fails", () => {
    it("should expose the error", async () => {
      const { request, waitForCall } = setup();
      const { result } = renderHook(() => useUntrackedSubmit(request));
      act(() => {
        result.current.submit({ payload: { name: "Maciej" } });
      });
      const call = await waitForCall(0);

      act(() => {
        call.fail({ message: "Name is taken" }, 409);
      });

      await waitFor(() => {
        expect(result.current.error).toStrictEqual({ message: "Name is taken" });
      });
      expect(result.current.submitting).toBeFalse();
      expect(result.current.success).toBeFalse();
      expect(result.current.status).toBe(409);
      expect(result.current.data).toBeNull();
      expect(result.current.requestTimestamp).toBeDate();
      expect(result.current.responseTimestamp).toBeDate();
    });
    it("should clear the error after a later successful submit", async () => {
      const { request, waitForCall } = setup();
      const { result } = renderHook(() => useUntrackedSubmit(request));
      act(() => {
        result.current.submit({ payload: { name: "Maciej" } });
      });
      const failedCall = await waitForCall(0);
      act(() => {
        failedCall.fail({ message: "Name is taken" }, 409);
      });
      await waitFor(() => {
        expect(result.current.error).not.toBeNull();
      });

      act(() => {
        result.current.submit({ payload: { name: "Kacper" } });
      });
      const call = await waitForCall(1);
      act(() => {
        call.succeed({ id: 2, name: "Kacper" });
      });

      await waitFor(() => {
        expect(result.current.data).toStrictEqual({ id: 2, name: "Kacper" });
      });
      expect(result.current.error).toBeNull();
      expect(result.current.success).toBeTrue();
      expect(result.current.status).toBe(200);
    });
    it("should keep the error while the next submit is in flight", async () => {
      const { request, waitForCall } = setup();
      const { result } = renderHook(() => useUntrackedSubmit(request));
      act(() => {
        result.current.submit({ payload: { name: "Maciej" } });
      });
      const failedCall = await waitForCall(0);
      act(() => {
        failedCall.fail({ message: "Name is taken" }, 409);
      });
      await waitFor(() => {
        expect(result.current.error).not.toBeNull();
      });

      act(() => {
        result.current.submit({ payload: { name: "Kacper" } });
      });
      await waitForCall(1);

      expect(result.current.submitting).toBeTrue();
      expect(result.current.error).toStrictEqual({ message: "Name is taken" });
    });
    it("should keep the data of the previous successful submit", async () => {
      const { request, waitForCall } = setup();
      const { result } = renderHook(() => useUntrackedSubmit(request));
      act(() => {
        result.current.submit({ payload: { name: "Maciej" } });
      });
      const call = await waitForCall(0);
      act(() => {
        call.succeed({ id: 1, name: "Maciej" });
      });
      await waitFor(() => {
        expect(result.current.success).toBeTrue();
      });

      act(() => {
        result.current.submit({ payload: { name: "Kacper" } });
      });
      const failedCall = await waitForCall(1);
      act(() => {
        failedCall.fail({ message: "Server error" }, 500);
      });

      await waitFor(() => {
        expect(result.current.error).toStrictEqual({ message: "Server error" });
      });
      expect(result.current.data).toStrictEqual({ id: 1, name: "Maciej" });
      expect(result.current.success).toBeFalse();
    });
  });

  describe("when the submit is retried", () => {
    it("should not retry a request without the retry option", async () => {
      vi.useFakeTimers();
      const { request, calls } = setup();
      const { result } = renderHook(() => useUntrackedSubmit(request));
      act(() => {
        result.current.submit({ payload: { name: "Maciej" } });
      });
      await advance();

      calls[0].fail();
      await advance(10_000);

      expect(calls).toHaveLength(1);
      expect(result.current.submitting).toBeFalse();
    });
    it("should send the request again after the retry time", async () => {
      vi.useFakeTimers();
      const { request, calls } = setup({ retry: 1, retryTime: 5000 });
      const { result } = renderHook(() => useUntrackedSubmit(request));
      act(() => {
        result.current.submit({ payload: { name: "Maciej" } });
      });
      await advance();
      calls[0].fail();

      await advance(4999);
      expect(calls).toHaveLength(1);

      await advance(1);
      expect(calls).toHaveLength(2);
      expect(calls[1].requestId).toBe(calls[0].requestId);
    });
    it("should end with the success state when the retry succeeds", async () => {
      vi.useFakeTimers();
      const { request, calls } = setup({ retry: 1, retryTime: 5000 });
      const { result } = renderHook(() => useUntrackedSubmit(request));
      act(() => {
        result.current.submit({ payload: { name: "Maciej" } });
      });
      await advance();
      calls[0].fail({ message: "Temporary" }, 503);
      await advance(5000);

      calls[1].succeed({ id: 1, name: "Maciej" });
      await advance();

      expect(result.current.data).toStrictEqual({ id: 1, name: "Maciej" });
      expect(result.current.error).toBeNull();
      expect(result.current.success).toBeTrue();
      expect(result.current.submitting).toBeFalse();
      expect(result.current.retries).toBe(1);
    });
    it("should be submitting again while the retry is in flight", async () => {
      vi.useFakeTimers();
      const { request, calls } = setup({ retry: 1, retryTime: 5000 });
      const { result } = renderHook(() => useUntrackedSubmit(request));
      act(() => {
        result.current.submit({ payload: { name: "Maciej" } });
      });
      await advance();
      calls[0].fail({ message: "Temporary" }, 503);
      await advance(5000);

      expect(result.current.submitting).toBeTrue();
    });
    it("should end with the error state when every attempt fails", async () => {
      vi.useFakeTimers();
      const { request, calls } = setup({ retry: 2, retryTime: 5000 });
      const { result } = renderHook(() => useUntrackedSubmit(request));
      act(() => {
        result.current.submit({ payload: { name: "Maciej" } });
      });
      await advance();

      for (let attempt = 0; attempt < 3; attempt += 1) {
        calls[attempt].fail({ message: `Attempt ${attempt}` }, 500);
        // eslint-disable-next-line no-await-in-loop
        await advance(5000);
      }

      expect(calls).toHaveLength(3);
      expect(result.current.error).toStrictEqual({ message: "Attempt 2" });
      expect(result.current.submitting).toBeFalse();
      expect(result.current.retries).toBe(2);
      expect(result.current.success).toBeFalse();
    });
    it("should stop retrying once an attempt succeeds", async () => {
      vi.useFakeTimers();
      const { request, calls } = setup({ retry: 5, retryTime: 5000 });
      const { result } = renderHook(() => useUntrackedSubmit(request));
      act(() => {
        result.current.submit({ payload: { name: "Maciej" } });
      });
      await advance();
      calls[0].fail();
      await advance(5000);
      calls[1].succeed({ id: 1, name: "Maciej" });

      await advance(60_000);

      expect(calls).toHaveLength(2);
      expect(result.current.success).toBeTrue();
    });
    it("should not retry when retryOnError rejects the response", async () => {
      vi.useFakeTimers();
      const { request, calls } = setup({ retry: 3, retryTime: 5000 });
      const pickyRequest = request.setRetryOnError((response) => response.status !== 422);
      const { result } = renderHook(() => useUntrackedSubmit(pickyRequest));
      act(() => {
        result.current.submit({ payload: { name: "Maciej" } });
      });
      await advance();

      calls[0].fail({ message: "Invalid" }, 422);
      await advance(60_000);

      expect(calls).toHaveLength(1);
      expect(result.current.error).toStrictEqual({ message: "Invalid" });
      expect(result.current.submitting).toBeFalse();
    });
  });

  describe("when the submit is aborted", () => {
    it("should cancel the request in flight", async () => {
      const { request, waitForCall } = setup();
      const { result } = renderHook(() => useUntrackedSubmit(request));
      act(() => {
        result.current.submit({ payload: { name: "Maciej" } });
      });
      const call = await waitForCall(0);

      act(() => {
        result.current.abort();
      });

      expect(call.aborted).toBeTrue();
    });
    it("should stop submitting and expose the abort error", async () => {
      const { request, waitForCall } = setup();
      const { result } = renderHook(() => useUntrackedSubmit(request));
      act(() => {
        result.current.submit({ payload: { name: "Maciej" } });
      });
      await waitForCall(0);

      act(() => {
        result.current.abort();
      });

      await waitFor(() => {
        expect(result.current.error).toStrictEqual(getErrorMessage("abort"));
      });
      expect(result.current.submitting).toBeFalse();
      expect(result.current.success).toBeFalse();
      expect(result.current.data).toBeNull();
    });
    it("should cancel every request of the hook that is in flight", async () => {
      const { request, waitForCalls } = setup();
      const { result } = renderHook(() => useUntrackedSubmit(request));
      act(() => {
        result.current.submit({ payload: { name: "First" } });
        result.current.submit({ payload: { name: "Second" } });
      });
      const calls = await waitForCalls(2);

      act(() => {
        result.current.abort();
      });

      expect(calls.map((call) => call.aborted)).toStrictEqual([true, true]);
      await waitFor(() => {
        expect(result.current.submitting).toBeFalse();
      });
    });
    it("should cancel a request sent with dynamic params", async () => {
      const { client, waitForCall } = setup();
      const request = client.createRequest<{ response: User }>()({ endpoint: "/users/:userId", method: "DELETE" });
      const { result } = renderHook(() => useUntrackedSubmit(request));
      act(() => {
        result.current.submit({ params: { userId: 1 } });
      });
      const call = await waitForCall(0);

      act(() => {
        result.current.abort();
      });

      expect(call.aborted).toBeTrue();
    });
    it("should not touch the requests of other hooks", async () => {
      const { request, client, waitForCalls } = setup();
      const otherRequest = client.createRequest<{ response: User }>()({ endpoint: "/teams", method: "POST" });
      const view = renderHook(() => useUntrackedSubmit(request));
      const other = renderHook(() => useUntrackedSubmit(otherRequest));
      act(() => {
        view.result.current.submit({ payload: { name: "Maciej" } });
        other.result.current.submit();
      });
      const calls = await waitForCalls(2);

      act(() => {
        view.result.current.abort();
      });

      expect(calls[0].aborted).toBeTrue();
      expect(calls[1].aborted).toBeFalse();
      expect(other.result.current.submitting).toBeTrue();
    });
    it("should do nothing when there is no request in flight", () => {
      const { request } = setup();
      const { result } = renderHook(() => useUntrackedSubmit(request));

      act(() => {
        result.current.abort();
      });

      expect(result.current.submitting).toBeFalse();
      expect(result.current.error).toBeNull();
    });
    it("should allow to submit again after the abort", async () => {
      const { request, waitForCall } = setup();
      const { result } = renderHook(() => useUntrackedSubmit(request));
      act(() => {
        result.current.submit({ payload: { name: "Maciej" } });
      });
      await waitForCall(0);
      act(() => {
        result.current.abort();
      });
      await waitFor(() => {
        expect(result.current.submitting).toBeFalse();
      });

      act(() => {
        result.current.submit({ payload: { name: "Maciej" } });
      });
      const call = await waitForCall(1);
      act(() => {
        call.succeed({ id: 1, name: "Maciej" });
      });

      await waitFor(() => {
        expect(result.current.data).toStrictEqual({ id: 1, name: "Maciej" });
      });
      expect(result.current.error).toBeNull();
      expect(result.current.success).toBeTrue();
    });
  });

  describe("when the hook unmounts during the submit", () => {
    it("should let the request finish", async () => {
      const { request, waitForCall } = setup();
      const { result, unmount } = renderHook(() => useUntrackedSubmit(request));
      act(() => {
        result.current.submit({ payload: { name: "Maciej" } });
      });
      const call = await waitForCall(0);

      unmount();

      expect(call.aborted).toBeFalse();
      expect(call.settled).toBeFalse();
    });
    it("should not update the state or warn after the unmount", async () => {
      const errorSpy = vi.spyOn(console, "error").mockImplementation(() => null);
      const { request, waitForCall, client } = setup();
      const { result, unmount } = renderHook(() => useUntrackedSubmit(request));
      let promise: Promise<unknown> = Promise.resolve();
      act(() => {
        promise = result.current.submit({ payload: { name: "Maciej" } });
      });
      const call = await waitForCall(0);

      unmount();
      call.succeed({ id: 1, name: "Maciej" });
      await promise;
      await waitFor(() => {
        expect(client.submitDispatcher.getAllRunningRequests()).toHaveLength(0);
      });

      expect(result.current.data).toBeNull();
      expect(errorSpy).not.toHaveBeenCalled();
      errorSpy.mockRestore();
    });
    it("should show the response to a hook mounted afterwards", async () => {
      const { request, waitForCall } = setup();
      const first = renderHook(() => useUntrackedSubmit(request));
      let promise: Promise<unknown> = Promise.resolve();
      act(() => {
        promise = first.result.current.submit({ payload: { name: "Maciej" } });
      });
      const call = await waitForCall(0);
      first.unmount();
      call.succeed({ id: 1, name: "Maciej" });
      await promise;

      const second = renderHook(() => useUntrackedSubmit(request));

      await waitFor(() => {
        expect(second.result.current.data).toStrictEqual({ id: 1, name: "Maciej" });
      });
      expect(second.result.current.submitting).toBeFalse();
    });
    it("should start in the submitting state when mounted during a request in flight", async () => {
      const { request, waitForCall } = setup();
      const first = renderHook(() => useUntrackedSubmit(request));
      act(() => {
        first.result.current.submit({ payload: { name: "Maciej" } });
      });
      await waitForCall(0);
      first.unmount();

      const second = renderHook(() => useUntrackedSubmit(request));

      expect(second.result.current.submitting).toBeTrue();
    });
    it("should remove its listeners", async () => {
      const { request, client, waitForCall } = setup();
      const countListeners = () =>
        client.requestManager.emitter
          .eventNames()
          .reduce((sum, name) => sum + client.requestManager.emitter.listenerCount(name), 0) +
        client.cache.emitter.eventNames().reduce((sum, name) => sum + client.cache.emitter.listenerCount(name), 0);
      const baseline = countListeners();
      const { result, unmount } = renderHook(() => useUntrackedSubmit(request));
      let promise: Promise<unknown> = Promise.resolve();
      act(() => {
        promise = result.current.submit({ payload: { name: "Maciej" } });
      });
      const call = await waitForCall(0);

      unmount();
      call.succeed({ id: 1, name: "Maciej" });
      await promise;

      expect(countListeners()).toBe(baseline);
    });
  });

  describe("when the hook is rendered in StrictMode", () => {
    it("should start with an empty state", () => {
      const { request } = setup();
      const { result } = renderHook(() => useUntrackedSubmit(request), { wrapper: StrictMode });

      expect(result.current.submitting).toBeFalse();
      expect(result.current.data).toBeNull();
    });
    it("should send a single request for a single submit", async () => {
      const { request, waitForCall, calls } = setup();
      const { result } = renderHook(() => useUntrackedSubmit(request), { wrapper: StrictMode });

      act(() => {
        result.current.submit({ payload: { name: "Maciej" } });
      });
      const call = await waitForCall(0);
      act(() => {
        call.succeed({ id: 1, name: "Maciej" });
      });
      await waitFor(() => {
        expect(result.current.success).toBeTrue();
      });

      expect(calls).toHaveLength(1);
    });
    it("should follow the state of the request after the double mount", async () => {
      const { request, waitForCall } = setup();
      const { result } = renderHook(() => useUntrackedSubmit(request), { wrapper: StrictMode });

      act(() => {
        result.current.submit({ payload: { name: "Maciej" } });
      });
      const call = await waitForCall(0);
      expect(result.current.submitting).toBeTrue();
      act(() => {
        call.succeed({ id: 1, name: "Maciej" });
      });

      await waitFor(() => {
        expect(result.current.data).toStrictEqual({ id: 1, name: "Maciej" });
      });
      expect(result.current.submitting).toBeFalse();
    });
    it("should expose the error", async () => {
      const { request, waitForCall } = setup();
      const { result } = renderHook(() => useUntrackedSubmit(request), { wrapper: StrictMode });

      act(() => {
        result.current.submit({ payload: { name: "Maciej" } });
      });
      const call = await waitForCall(0);
      act(() => {
        call.fail({ message: "Nope" }, 400);
      });

      await waitFor(() => {
        expect(result.current.error).toStrictEqual({ message: "Nope" });
      });
      expect(result.current.submitting).toBeFalse();
    });
    it("should settle the state of a submit made in a mount effect", async () => {
      const { request, waitForCalls } = setup();
      function Page() {
        const { submit, data, submitting } = useSubmit(request);
        useEffect(() => {
          submit({ payload: { name: "Maciej" } });
        }, [submit]);
        return (
          <div data-testid="state">
            {String(submitting)}:{data?.name ?? "none"}
          </div>
        );
      }

      render(
        <StrictMode>
          <Page />
        </StrictMode>,
      );
      // StrictMode runs the effect twice, so the request is sent twice
      const calls = await waitForCalls(2);
      expect(screen.getByTestId("state").textContent).toBe("true:none");
      act(() => {
        calls.forEach((call) => call.succeed({ id: 1, name: "Maciej" }));
      });

      await waitFor(() => {
        expect(screen.getByTestId("state").textContent).toBe("false:Maciej");
      });
    });
  });

  describe("when submit is called from a component", () => {
    it("should submit from an event handler", async () => {
      const { request, waitForCall } = setup();
      function Page() {
        const { submit, data, submitting } = useSubmit(request);
        return (
          <button type="button" disabled={submitting} onClick={() => submit({ payload: { name: "Maciej" } })}>
            {data ? `Created ${data.name}` : "Create"}
          </button>
        );
      }
      render(<Page />);

      fireEvent.click(screen.getByRole("button"));
      const call = await waitForCall(0);
      expect(screen.getByRole("button")).toBeDisabled();
      act(() => {
        call.succeed({ id: 1, name: "Maciej" });
      });

      await waitFor(() => {
        expect(screen.getByRole("button").textContent).toBe("Created Maciej");
      });
      expect(screen.getByRole("button")).toBeEnabled();
    });
    it("should submit once from a mount effect", async () => {
      const { request, waitForCall, calls } = setup();
      function Page() {
        const { submit, data } = useSubmit(request);
        useEffect(() => {
          submit({ payload: { name: "Maciej" } });
        }, [submit]);
        return <div data-testid="state">{data?.name ?? "none"}</div>;
      }
      render(<Page />);

      const call = await waitForCall(0);
      act(() => {
        call.succeed({ id: 1, name: "Maciej" });
      });

      await waitFor(() => {
        expect(screen.getByTestId("state").textContent).toBe("Maciej");
      });
      expect(calls).toHaveLength(1);
    });
    it("should keep the submit function stable between renders", async () => {
      const { request, waitForCall } = setup();
      const { result, rerender } = renderHook(() => useUntrackedSubmit(request));
      const initialSubmit = result.current.submit;

      rerender();
      act(() => {
        result.current.submit({ payload: { name: "Maciej" } });
      });
      const call = await waitForCall(0);
      act(() => {
        call.succeed({ id: 1, name: "Maciej" });
      });
      await waitFor(() => {
        expect(result.current.success).toBeTrue();
      });

      expect(result.current.submit).toBe(initialSubmit);
    });
    it("should keep the refetch function stable between renders", () => {
      const { request } = setup();
      const { result, rerender } = renderHook(() => useUntrackedSubmit(request));
      const initialRefetch = result.current.refetch;

      rerender();

      expect(result.current.refetch).toBe(initialRefetch);
    });
    it("should send the request from the latest render with a submit function taken earlier", async () => {
      const { client, waitForCall } = setup();
      const request = client.createRequest<{ response: User }>()({ endpoint: "/users/:userId", method: "DELETE" });
      const { result, rerender } = renderHook(
        ({ userId }: { userId: number }) => useUntrackedSubmit(request.setParams({ userId })),
        {
          initialProps: { userId: 1 },
        },
      );
      const initialSubmit = result.current.submit;

      rerender({ userId: 2 });
      act(() => {
        initialSubmit();
      });

      const call = await waitForCall(0);
      expect(call.request.endpoint).toBe("/users/2");
    });
  });

  describe("when the request passed to the hook changes", () => {
    const setupUsers = () => {
      const gated = createGatedClient();
      const request = gated.client.createRequest<{ response: User }>()({ endpoint: "/users/:userId", method: "PATCH" });
      return { ...gated, request };
    };

    it("should start with an empty state for the new request", async () => {
      const { request, waitForCall } = setupUsers();
      const { result, rerender } = renderHook(
        ({ userId }: { userId: number }) => useUntrackedSubmit(request.setParams({ userId })),
        {
          initialProps: { userId: 1 },
        },
      );
      act(() => {
        result.current.submit();
      });
      const call = await waitForCall(0);
      act(() => {
        call.succeed({ id: 1, name: "Maciej" });
      });
      await waitFor(() => {
        expect(result.current.data).toStrictEqual({ id: 1, name: "Maciej" });
      });

      rerender({ userId: 2 });

      expect(result.current.data).toBeNull();
      expect(result.current.success).toBeFalse();
      expect(result.current.submitting).toBeFalse();
    });
    it("should not show the response of the previous request", async () => {
      const { request, waitForCall, client } = setupUsers();
      const { result, rerender } = renderHook(
        ({ userId }: { userId: number }) => useUntrackedSubmit(request.setParams({ userId })),
        {
          initialProps: { userId: 1 },
        },
      );
      let promise: Promise<unknown> = Promise.resolve();
      act(() => {
        promise = result.current.submit();
      });
      const call = await waitForCall(0);

      rerender({ userId: 2 });
      await act(async () => {
        call.succeed({ id: 1, name: "Maciej" });
        await promise;
      });
      await waitFor(() => {
        expect(client.submitDispatcher.getAllRunningRequests()).toHaveLength(0);
      });

      expect(result.current.data).toBeNull();
      expect(result.current.success).toBeFalse();
    });
    it("should follow the submits of the new request made by another hook", async () => {
      const { request, waitForCall } = setupUsers();
      const view = renderHook(({ userId }: { userId: number }) => useUntrackedSubmit(request.setParams({ userId })), {
        initialProps: { userId: 1 },
      });
      const other = renderHook(() => useUntrackedSubmit(request.setParams({ userId: 2 })));

      view.rerender({ userId: 2 });
      act(() => {
        other.result.current.submit();
      });
      const call = await waitForCall(0);
      expect(view.result.current.submitting).toBeTrue();
      act(() => {
        call.succeed({ id: 2, name: "Kacper" });
      });

      await waitFor(() => {
        expect(view.result.current.data).toStrictEqual({ id: 2, name: "Kacper" });
      });
      expect(view.result.current.submitting).toBeFalse();
    });
    it("should show the data cached for the new request", async () => {
      const { request, waitForCall } = setupUsers();
      const other = renderHook(() => useUntrackedSubmit(request.setParams({ userId: 2 })));
      act(() => {
        other.result.current.submit();
      });
      const call = await waitForCall(0);
      act(() => {
        call.succeed({ id: 2, name: "Kacper" });
      });
      await waitFor(() => {
        expect(other.result.current.success).toBeTrue();
      });
      const view = renderHook(({ userId }: { userId: number }) => useUntrackedSubmit(request.setParams({ userId })), {
        initialProps: { userId: 1 },
      });

      view.rerender({ userId: 2 });

      await waitFor(() => {
        expect(view.result.current.data).toStrictEqual({ id: 2, name: "Kacper" });
      });
    });
  });

  describe("when two hooks use the same request", () => {
    it("should share the submitting state", async () => {
      const { request, waitForCall } = setup();
      const first = renderHook(() => useUntrackedSubmit(request));
      const second = renderHook(() => useUntrackedSubmit(request));

      act(() => {
        first.result.current.submit({ payload: { name: "Maciej" } });
      });
      await waitForCall(0);

      expect(first.result.current.submitting).toBeTrue();
      expect(second.result.current.submitting).toBeTrue();
    });
    it("should share the response", async () => {
      const { request, waitForCall } = setup();
      const first = renderHook(() => useUntrackedSubmit(request));
      const second = renderHook(() => useUntrackedSubmit(request));
      act(() => {
        first.result.current.submit({ payload: { name: "Maciej" } });
      });
      const call = await waitForCall(0);

      act(() => {
        call.succeed({ id: 1, name: "Maciej" });
      });

      await waitFor(() => {
        expect(second.result.current.data).toStrictEqual({ id: 1, name: "Maciej" });
      });
      expect(first.result.current.data).toStrictEqual({ id: 1, name: "Maciej" });
      expect(second.result.current.submitting).toBeFalse();
    });
    it("should share the error", async () => {
      const { request, waitForCall } = setup();
      const first = renderHook(() => useUntrackedSubmit(request));
      const second = renderHook(() => useUntrackedSubmit(request));
      act(() => {
        first.result.current.submit({ payload: { name: "Maciej" } });
      });
      const call = await waitForCall(0);

      act(() => {
        call.fail({ message: "Nope" }, 400);
      });

      await waitFor(() => {
        expect(second.result.current.error).toStrictEqual({ message: "Nope" });
      });
      expect(first.result.current.error).toStrictEqual({ message: "Nope" });
    });
    it("should keep the hooks of different requests apart", async () => {
      const { request, client, waitForCall } = setup();
      const otherRequest = client.createRequest<{ response: User }>()({ endpoint: "/teams", method: "POST" });
      const first = renderHook(() => useUntrackedSubmit(request));
      const second = renderHook(() => useUntrackedSubmit(otherRequest));
      act(() => {
        first.result.current.submit({ payload: { name: "Maciej" } });
      });
      const call = await waitForCall(0);
      expect(second.result.current.submitting).toBeFalse();

      act(() => {
        call.succeed({ id: 1, name: "Maciej" });
      });
      await waitFor(() => {
        expect(first.result.current.success).toBeTrue();
      });

      expect(second.result.current.data).toBeNull();
      expect(second.result.current.success).toBeFalse();
    });
    it("should keep the hooks of different clients apart", async () => {
      const one = setup();
      const two = setup();
      const first = renderHook(() => useUntrackedSubmit(one.request));
      const second = renderHook(() => useUntrackedSubmit(two.request));
      act(() => {
        first.result.current.submit({ payload: { name: "Maciej" } });
      });
      const call = await one.waitForCall(0);
      act(() => {
        call.succeed({ id: 1, name: "Maciej" });
      });
      await waitFor(() => {
        expect(first.result.current.success).toBeTrue();
      });

      expect(second.result.current.data).toBeNull();
      expect(two.calls).toHaveLength(0);
    });
  });
});
