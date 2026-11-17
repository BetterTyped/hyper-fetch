import { DeletedError } from "@hyper-fetch/core";
import { act, renderHook } from "@testing-library/react";
import { useStream } from "hooks/use-stream";

import { createControlledClient, createDeferred, createSignal } from "../../utils/streaming.utils";
import type { ControlledCall } from "../../utils/streaming.utils";

/**
 * Render the hook and wait for its state through its own renders - no polling, the fake timers stay untouched.
 */
const renderStream = (request: Parameters<typeof useStream>[0]) => {
  const signal = createSignal();
  let current: ReturnType<typeof useStream> | null = null;
  const hook = renderHook(() => {
    const stream = useStream(request);
    current = stream;
    signal.notify();
    return stream;
  });
  const until = (predicate: (stream: ReturnType<typeof useStream>) => boolean) =>
    act(async () => {
      await signal.until(() => current !== null && predicate(current));
    });
  return { ...hook, until };
};

/**
 * A stream is not always running: between two attempts it waits for the retry timer, and without a network it
 * waits in the dispatcher queue. There is no connection to abort then - the request has to be taken out of the
 * queue, otherwise it is sent later behind the back of a hook that already gave up on it.
 */
describe("useStream [ Waiting requests ]", () => {
  const RETRY_TIME = 30_000;

  beforeEach(() => {
    // The retry timer is the only timer these tests care about
    vi.useFakeTimers({ toFake: ["setTimeout", "clearTimeout"] });
  });

  afterEach(() => {
    vi.useRealTimers();
  });

  const setup = () => {
    const controlled = createControlledClient();
    const { client } = controlled;
    const request = client
      .createRequest<{ response: string; error: { message: string } }>()({ endpoint: "/stream", method: "POST" })
      .setRetry(1)
      .setRetryTime(RETRY_TIME);
    const queued = () => client.submitDispatcher.getQueue(request.queryKey).requests;

    /** Fail the given attempt and wait until the dispatcher has processed the failure. */
    const failAttempt = async (call: ControlledCall) => {
      const processed = createDeferred();
      const unmount = client.requestManager.events.onResponseById(call.requestId, () => processed.resolve());
      await act(async () => {
        call.fail({ message: "dropped" }, 500);
        await processed.promise;
      });
      unmount();
    };

    /** Let the retry timer fire and give a re-sent request the chance to reach the adapter. */
    const passRetryTime = async () => {
      await act(async () => {
        await vi.advanceTimersByTimeAsync(RETRY_TIME * 2);
      });
    };

    return { ...controlled, request, queued, failAttempt, passRetryTime };
  };

  describe("when the stream waits for a retry", () => {
    const startAndFail = async () => {
      const context = setup();
      const hook = renderStream(context.request);

      act(() => {
        hook.result.current.start();
      });
      const call = await context.next();
      act(() => {
        call.open();
        call.chunk("partial");
      });
      await context.failAttempt(call);

      // Still streaming from the hook's point of view: the request will be sent again
      expect(hook.result.current.streaming).toBe(true);
      expect(hook.result.current.error).toBeNull();
      expect(context.queued()).toHaveLength(1);
      expect(context.client.submitDispatcher.hasRunningRequests(context.request.queryKey)).toBe(false);

      return { ...context, hook };
    };

    it("should send the request again when nothing stops it", async () => {
      const { hook, next, calls, passRetryTime } = await startAndFail();

      await passRetryTime();
      const retried = await next();
      await act(async () => {
        retried.open();
        retried.chunk("fresh");
        retried.succeed("fresh");
        await Promise.resolve();
      });
      await hook.until((stream) => stream.done);

      expect(calls).toHaveLength(2);
      expect(hook.result.current.text).toBe("fresh");
    });

    it("should not send the request again after abort", async () => {
      const { hook, calls, queued, passRetryTime } = await startAndFail();

      act(() => {
        hook.result.current.abort();
      });
      expect(queued()).toHaveLength(0);
      await passRetryTime();

      expect(calls).toHaveLength(1);
      expect(hook.result.current).toMatchObject({ aborted: true, streaming: false, done: false, error: null });
      expect(hook.result.current.text).toBe("partial");
    });

    it("should not send the request again after reset", async () => {
      const { hook, calls, queued, passRetryTime } = await startAndFail();

      act(() => {
        hook.result.current.reset();
      });
      expect(queued()).toHaveLength(0);
      await passRetryTime();

      expect(calls).toHaveLength(1);
      expect(hook.result.current).toMatchObject({ aborted: false, streaming: false, done: false, text: "" });
    });

    it("should not send the request again after the component unmounted", async () => {
      const { hook, calls, queued, passRetryTime } = await startAndFail();

      hook.unmount();
      expect(queued()).toHaveLength(0);
      await passRetryTime();

      expect(calls).toHaveLength(1);
    });

    it("should only run the new stream when started again after an abort", async () => {
      const { hook, calls, next, passRetryTime } = await startAndFail();

      act(() => {
        hook.result.current.abort();
      });
      act(() => {
        hook.result.current.start();
      });
      const fresh = await next();
      await passRetryTime();
      await act(async () => {
        fresh.open();
        fresh.chunk("new stream");
        fresh.succeed("new stream");
        await Promise.resolve();
      });
      await hook.until((stream) => stream.done);

      // The first attempt and the new stream - the abandoned retry never ran
      expect(calls).toHaveLength(2);
      expect(hook.result.current.text).toBe("new stream");
      expect(hook.result.current.aborted).toBe(false);
    });

    it("should resolve the abandoned send call instead of leaving it pending", async () => {
      const { hook, client, request } = await startAndFail();
      const removed = vi.fn();
      client.requestManager.events.onRemove(removed);

      act(() => {
        hook.result.current.abort();
      });

      expect(removed).toHaveBeenCalledTimes(1);
      // The removal resolved the send call: the dispatcher has nothing left for this request
      expect(client.submitDispatcher.getQueue(request.queryKey).requests).toHaveLength(0);
      expect(hook.result.current.error).not.toBeInstanceOf(DeletedError);
    });
  });

  describe("when the stream waits for the network", () => {
    it("should not send a request started offline after abort", async () => {
      const { client, request, calls, queued } = setup();
      client.appManager.setOnline(false);
      const { result } = renderStream(request);

      act(() => {
        result.current.start();
      });
      expect(result.current.streaming).toBe(true);
      expect(queued()).toHaveLength(1);
      expect(calls).toHaveLength(0);

      act(() => {
        result.current.abort();
      });
      expect(queued()).toHaveLength(0);
      await act(async () => {
        client.appManager.setOnline(true);
        await Promise.resolve();
      });

      expect(calls).toHaveLength(0);
      expect(result.current).toMatchObject({ aborted: true, streaming: false });
    });

    it("should not send a request started offline after the component unmounted", async () => {
      const { client, request, calls, queued } = setup();
      client.appManager.setOnline(false);
      const { result, unmount } = renderStream(request);

      act(() => {
        result.current.start();
      });
      unmount();
      expect(queued()).toHaveLength(0);
      await act(async () => {
        client.appManager.setOnline(true);
        await Promise.resolve();
      });

      expect(calls).toHaveLength(0);
    });

    it("should not send a request started offline after reset", async () => {
      const { client, request, calls, queued } = setup();
      client.appManager.setOnline(false);
      const { result } = renderStream(request);

      act(() => {
        result.current.start();
      });
      act(() => {
        result.current.reset();
      });
      expect(queued()).toHaveLength(0);
      await act(async () => {
        client.appManager.setOnline(true);
        await Promise.resolve();
      });

      expect(calls).toHaveLength(0);
      expect(result.current).toMatchObject({ aborted: false, streaming: false, text: "" });
    });

    it("should stream once the network is back when nothing stopped the request", async () => {
      const { client, request, calls, next } = setup();
      client.appManager.setOnline(false);
      const { result, until } = renderStream(request);

      act(() => {
        result.current.start();
      });
      expect(calls).toHaveLength(0);
      act(() => {
        client.appManager.setOnline(true);
      });
      const call = await next();
      await act(async () => {
        call.open();
        call.chunk("online");
        call.succeed("online");
        await Promise.resolve();
      });
      await until((stream) => stream.done);

      expect(result.current.text).toBe("online");
    });
  });

  describe("when the stream waits for its turn in a queue", () => {
    it("should not start a queued stream that was aborted before its turn", async () => {
      const { client, calls, next } = setup();
      const request = client
        .createRequest<{ response: string }>()({ endpoint: "/queued", method: "POST" })
        .setQueued(true);
      const running = renderStream(request);
      const waiting = renderStream(request);

      act(() => {
        running.result.current.start();
      });
      const call = await next();
      act(() => {
        waiting.result.current.start();
      });
      expect(client.submitDispatcher.getQueue(request.queryKey).requests).toHaveLength(2);

      act(() => {
        waiting.result.current.abort();
      });
      expect(client.submitDispatcher.getQueue(request.queryKey).requests).toHaveLength(1);
      await act(async () => {
        call.open();
        call.chunk("first");
        call.succeed("first");
        await Promise.resolve();
      });
      await running.until((stream) => stream.done);

      expect(calls).toHaveLength(1);
      expect(call.isAborted()).toBe(false);
      expect(waiting.result.current).toMatchObject({ aborted: true, streaming: false, text: "" });
    });
  });

  describe("when the stream is running", () => {
    it("should abort the running request, which is where a transport closes its connection", async () => {
      const { client, request, next, calls } = setup();
      const { result } = renderStream(request);
      const removed = createDeferred();
      client.requestManager.events.onRemove(() => removed.resolve());

      act(() => {
        result.current.start();
      });
      const call = await next();
      act(() => {
        call.open();
        call.chunk("partial");
      });
      act(() => {
        result.current.abort();
      });
      await act(async () => {
        await call.aborted;
        await removed.promise;
      });

      expect(call.isAborted()).toBe(true);
      expect(calls).toHaveLength(1);
      expect(result.current).toMatchObject({ aborted: true, streaming: false, text: "partial", error: null });
    });
  });
});
