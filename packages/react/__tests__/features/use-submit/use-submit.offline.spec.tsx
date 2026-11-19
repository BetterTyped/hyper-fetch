import { act, renderHook, waitFor } from "@testing-library/react";
import { useSubmit } from "hooks/use-submit";

import { createGatedClient } from "../../utils/gated-client.utils";

type User = { id: number; name: string };

const setup = (options?: { queued?: boolean; offline?: boolean }) => {
  const gated = createGatedClient();
  const request = gated.client.createRequest<{ response: User; payload: { name: string } }>()({
    endpoint: "/users",
    method: "POST",
    queued: options?.queued ?? false,
    offline: options?.offline ?? true,
  });
  const setOnline = (isOnline: boolean) => {
    act(() => {
      gated.client.appManager.setOnline(isOnline);
    });
  };
  const renderSubmit = () => {
    const spies = { success: vi.fn(), error: vi.fn(), offline: vi.fn(), finished: vi.fn(), requestStart: vi.fn() };
    const view = renderHook(() => {
      const submit = useSubmit(request, { dependencyTracking: false });
      submit.onSubmitSuccess(spies.success);
      submit.onSubmitError(spies.error);
      submit.onSubmitOfflineError(spies.offline);
      submit.onSubmitFinished(spies.finished);
      submit.onSubmitRequestStart(spies.requestStart);
      return submit;
    });
    return { ...view, spies };
  };
  return { ...gated, request, setOnline, renderSubmit };
};

/** Run the pending timers and promise callbacks - for the tests using fake timers */
const advance = async (time = 0) => {
  await act(async () => {
    await vi.advanceTimersByTimeAsync(time);
  });
};

describe("useSubmit [ Offline ]", () => {
  afterEach(() => {
    vi.useRealTimers();
  });

  describe("when submitting while the application is offline", () => {
    it("should hold the request until the connection is back", async () => {
      vi.useFakeTimers();
      const { calls, setOnline, renderSubmit, client, request } = setup();
      const { result } = renderSubmit();
      setOnline(false);

      act(() => {
        result.current.submit({ payload: { name: "Maciej" } });
      });
      await advance(10_000);

      expect(calls).toHaveLength(0);
      expect(client.submitDispatcher.getQueue(request.queryKey).requests).toHaveLength(1);
    });
    it("should keep the submit promise pending while offline", async () => {
      vi.useFakeTimers();
      const { setOnline, renderSubmit } = setup();
      const { result } = renderSubmit();
      const settled = vi.fn();
      setOnline(false);

      act(() => {
        result.current.submit({ payload: { name: "Maciej" } }).then(settled);
      });
      await advance(10_000);

      expect(settled).not.toHaveBeenCalled();
    });
    it("should send the request when the connection is back", async () => {
      const { waitForCall, setOnline, renderSubmit } = setup();
      const { result } = renderSubmit();
      setOnline(false);
      act(() => {
        result.current.submit({ payload: { name: "Maciej" } });
      });

      setOnline(true);

      const call = await waitForCall(0);
      expect(call.request.payload).toStrictEqual({ name: "Maciej" });
      expect(result.current.submitting).toBeTrue();
    });
    it("should resolve the submit and update the state once the held request is answered", async () => {
      const { waitForCall, setOnline, renderSubmit } = setup();
      const { result, spies } = renderSubmit();
      let promise: ReturnType<typeof result.current.submit> | null = null;
      setOnline(false);
      act(() => {
        promise = result.current.submit({ payload: { name: "Maciej" } });
      });
      setOnline(true);
      const call = await waitForCall(0);

      act(() => {
        call.succeed({ id: 1, name: "Maciej" });
      });

      const response = await promise!;
      expect(response.data).toStrictEqual({ id: 1, name: "Maciej" });
      await waitFor(() => {
        expect(result.current.data).toStrictEqual({ id: 1, name: "Maciej" });
      });
      expect(result.current.submitting).toBeFalse();
      expect(spies.success).toHaveBeenCalledTimes(1);
      expect(spies.offline).not.toHaveBeenCalled();
      expect(spies.error).not.toHaveBeenCalled();
    });
    it("should send every held request when the connection is back", async () => {
      const { waitForCalls, setOnline, renderSubmit } = setup();
      const { result } = renderSubmit();
      setOnline(false);
      act(() => {
        result.current.submit({ payload: { name: "First" } });
        result.current.submit({ payload: { name: "Second" } });
        result.current.submit({ payload: { name: "Third" } });
      });

      setOnline(true);

      const calls = await waitForCalls(3);
      expect(calls.map((call) => call.request.payload)).toStrictEqual([
        { name: "First" },
        { name: "Second" },
        { name: "Third" },
      ]);
    });
    it("should send the held queued requests one by one in order", async () => {
      const { waitForCall, calls, setOnline, renderSubmit } = setup({ queued: true });
      const { result } = renderSubmit();
      setOnline(false);
      act(() => {
        result.current.submit({ payload: { name: "First" } });
        result.current.submit({ payload: { name: "Second" } });
      });

      setOnline(true);
      const firstCall = await waitForCall(0);
      expect(calls).toHaveLength(1);
      act(() => {
        firstCall.succeed({ id: 1, name: "First" });
      });

      const secondCall = await waitForCall(1);
      expect(firstCall.request.payload).toStrictEqual({ name: "First" });
      expect(secondCall.request.payload).toStrictEqual({ name: "Second" });
    });
    it("should send the held request even when the hook unmounted in the meantime", async () => {
      const { waitForCall, setOnline, renderSubmit } = setup();
      const { result, unmount } = renderSubmit();
      let promise: ReturnType<typeof result.current.submit> | null = null;
      setOnline(false);
      act(() => {
        promise = result.current.submit({ payload: { name: "Maciej" } });
      });

      unmount();
      setOnline(true);
      const call = await waitForCall(0);
      call.succeed({ id: 1, name: "Maciej" });

      const response = await promise!;
      expect(response.data).toStrictEqual({ id: 1, name: "Maciej" });
    });
  });

  describe("when the connection drops during the request", () => {
    it("should call the offline callback and keep the request for later", async () => {
      const { waitForCall, setOnline, renderSubmit, client, request } = setup();
      const { result, spies } = renderSubmit();
      act(() => {
        result.current.submit({ payload: { name: "Maciej" } });
      });
      const call = await waitForCall(0);

      setOnline(false);
      act(() => {
        call.fail({ message: "Network error" }, 0);
      });

      await waitFor(() => {
        expect(spies.offline).toHaveBeenCalledTimes(1);
      });
      expect(spies.error).not.toHaveBeenCalled();
      expect(client.submitDispatcher.getQueue(request.queryKey).requests).toHaveLength(1);
    });
    it("should keep the submit promise pending until the request is sent again", async () => {
      const { waitForCall, setOnline, renderSubmit } = setup();
      const { result, spies } = renderSubmit();
      const settled = vi.fn();
      act(() => {
        result.current.submit({ payload: { name: "Maciej" } }).then(settled);
      });
      const call = await waitForCall(0);

      setOnline(false);
      act(() => {
        call.fail({ message: "Network error" }, 0);
      });
      await waitFor(() => {
        expect(spies.offline).toHaveBeenCalledTimes(1);
      });

      expect(settled).not.toHaveBeenCalled();
    });
    it("should send the request again when the connection is back", async () => {
      const { waitForCall, setOnline, renderSubmit } = setup();
      const { result, spies } = renderSubmit();
      let promise: ReturnType<typeof result.current.submit> | null = null;
      act(() => {
        promise = result.current.submit({ payload: { name: "Maciej" } });
      });
      const call = await waitForCall(0);
      setOnline(false);
      act(() => {
        call.fail({ message: "Network error" }, 0);
      });
      await waitFor(() => {
        expect(spies.offline).toHaveBeenCalledTimes(1);
      });

      setOnline(true);
      const retried = await waitForCall(1);
      act(() => {
        retried.succeed({ id: 1, name: "Maciej" });
      });

      const response = await promise!;
      expect(retried.requestId).toBe(call.requestId);
      expect(response.data).toStrictEqual({ id: 1, name: "Maciej" });
      await waitFor(() => {
        expect(result.current.data).toStrictEqual({ id: 1, name: "Maciej" });
      });
      expect(result.current.error).toBeNull();
      expect(spies.success).toHaveBeenCalledTimes(1);
      expect(spies.requestStart).toHaveBeenCalledTimes(2);
    });
    it("should fail right away when the request does not wait for the network", async () => {
      const { waitForCall, setOnline, renderSubmit, client, request } = setup({ offline: false });
      const { result, spies } = renderSubmit();
      let promise: ReturnType<typeof result.current.submit> | null = null;
      act(() => {
        promise = result.current.submit({ payload: { name: "Maciej" } });
      });
      const call = await waitForCall(0);

      setOnline(false);
      act(() => {
        call.fail({ message: "Network error" }, 0);
      });

      const response = await promise!;
      expect(response.success).toBeFalse();
      expect(response.error).toStrictEqual({ message: "Network error" });
      expect(spies.error).toHaveBeenCalledTimes(1);
      expect(spies.offline).not.toHaveBeenCalled();
      expect(client.submitDispatcher.getQueue(request.queryKey).requests).toHaveLength(0);
    });
    it("should not send the failed request again when it does not wait for the network", async () => {
      vi.useFakeTimers();
      const { calls, setOnline, renderSubmit } = setup({ offline: false });
      const { result } = renderSubmit();
      act(() => {
        result.current.submit({ payload: { name: "Maciej" } });
      });
      await advance();
      setOnline(false);
      calls[0].fail({ message: "Network error" }, 0);
      await advance();

      setOnline(true);
      await advance(10_000);

      expect(calls).toHaveLength(1);
    });
  });
});
