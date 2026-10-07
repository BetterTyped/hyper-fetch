import type { ExtractListenerDeliveredType } from "@hyper-fetch/sockets";
import { createDeliveryStrategy } from "@hyper-fetch/sockets";
import { createWebsocketMockingServer, waitForConnection } from "@hyper-fetch/testing";
import { act, renderHook } from "@testing-library/react";
import { useListener } from "hooks/use-listener";
import React, { useMemo, useState } from "react";
import { expectTypeOf } from "vitest";

import { createListener } from "../../utils/listener.utils";
import { renderUseListener } from "../../utils/use-listener.utils";

type Trade = { id: number };

describe("useListener [ Delivery ]", () => {
  const { startServer, stopServer, emitListenerEvent } = createWebsocketMockingServer();
  let listener = createListener<Trade>();

  beforeEach(async () => {
    startServer();
    listener = createListener<Trade>();
    await waitForConnection(listener.socket);
    vi.useFakeTimers({ toFake: ["setTimeout", "clearTimeout"] });
  });

  afterEach(() => {
    vi.useRealTimers();
    stopServer();
  });

  it("should deliver batched arrays to state and onEvent", async () => {
    const batched = listener.setDelivery({ strategy: "batch", interval: 100 });
    const spy = vi.fn();
    const view = renderUseListener(batched);
    act(() => {
      view.result.current.onEvent(({ data }) => spy(data));
    });

    act(() => {
      emitListenerEvent(batched, { id: 1 });
      emitListenerEvent(batched, { id: 2 });
    });
    expect(spy).not.toHaveBeenCalled();
    expect(view.result.current.data).toBeNull();

    act(() => {
      vi.advanceTimersByTime(100);
    });
    expect(spy).toHaveBeenCalledOnce();
    expect(spy).toHaveBeenCalledWith([{ id: 1 }, { id: 2 }]);
    expect(view.result.current.data).toEqual([{ id: 1 }, { id: 2 }]);
  });

  it("should sample with the latest strategy", async () => {
    const sampled = listener.setDelivery({ strategy: "latest", interval: 100 });
    const view = renderUseListener(sampled);

    act(() => {
      emitListenerEvent(sampled, { id: 1 });
      emitListenerEvent(sampled, { id: 2 });
      emitListenerEvent(sampled, { id: 3 });
    });
    expect(view.result.current.data).toEqual({ id: 1 });

    act(() => {
      vi.advanceTimersByTime(100);
    });
    expect(view.result.current.data).toEqual({ id: 3 });
  });

  it("should not update state after unmount", async () => {
    const batched = listener.setDelivery({ strategy: "batch", interval: 100 });
    const errorSpy = vi.spyOn(console, "error").mockImplementation(() => null);
    const spy = vi.fn();
    const view = renderUseListener(batched);
    act(() => {
      view.result.current.onEvent(spy);
    });
    act(() => {
      emitListenerEvent(batched, { id: 1 });
    });
    view.unmount();
    act(() => {
      vi.advanceTimersByTime(500);
    });
    expect(spy).not.toHaveBeenCalled();
    expect(errorSpy).not.toHaveBeenCalled();
    errorSpy.mockRestore();
  });

  it("should keep working in StrictMode", async () => {
    const batched = listener.setDelivery({ strategy: "batch", interval: 100 });
    const view = renderHook(() => useListener(batched, { dependencyTracking: false }), {
      wrapper: ({ children }) => <React.StrictMode>{children}</React.StrictMode>,
    });
    act(() => {
      emitListenerEvent(batched, { id: 1 });
      vi.advanceTimersByTime(100);
    });
    expect(view.result.current.data).toEqual([{ id: 1 }]);
    expect(batched.socket.adapter.listeners.get(batched.topic)?.size).toBe(1);
  });

  it("should re-subscribe when delivery changes", async () => {
    const view = renderHook(() => {
      const [rate, setRate] = useState(100);
      const live = useMemo(() => listener.setDelivery({ strategy: "latest", interval: rate }), [rate]);
      const result = useListener(live, { dependencyTracking: false });
      return { ...result, setRate, live };
    });

    act(() => {
      emitListenerEvent(listener, { id: 1 });
      emitListenerEvent(listener, { id: 2 });
    });
    expect(view.result.current.data).toEqual({ id: 1 });

    act(() => {
      view.result.current.setRate(10);
    });
    // The previous window (100ms) was disposed with the old subscription - a new one leads immediately.
    act(() => {
      emitListenerEvent(listener, { id: 3 });
    });
    expect(view.result.current.data).toEqual({ id: 3 });
    expect(listener.socket.adapter.listeners.get(listener.topic)?.size).toBe(1);
  });

  it("should keep one subscription when an equal preset is created inline on every render", () => {
    const spy = vi.fn();
    const view = renderHook(() => {
      const inline = listener.setDelivery({ strategy: "batch", interval: 100 });
      return useListener(inline, { dependencyTracking: false });
    });
    act(() => {
      view.result.current.onEvent(({ data }) => spy(data));
    });
    act(() => {
      emitListenerEvent(listener, { id: 1 });
    });
    view.rerender();
    view.rerender();
    act(() => {
      emitListenerEvent(listener, { id: 2 });
    });
    expect(listener.socket.adapter.listeners.get(listener.topic)?.size).toBe(1);
    act(() => {
      vi.advanceTimersByTime(100);
    });
    // Buffered message survived the re-renders because the subscription was not recreated.
    expect(spy).toHaveBeenCalledOnce();
    expect(spy).toHaveBeenCalledWith([{ id: 1 }, { id: 2 }]);
  });

  it("should re-subscribe when a custom strategy identity changes", () => {
    const makeStrategy = () =>
      createDeliveryStrategy<Trade, number>(({ deliver }) => ({
        push: ({ data, extra }) => deliver({ data: data.id * 10, extra }),
        dispose: () => null,
      }));
    const first = makeStrategy();
    const second = makeStrategy();
    const view = renderHook(
      ({ strategy }: { strategy: ReturnType<typeof makeStrategy> }) =>
        useListener(listener.setDelivery(strategy), { dependencyTracking: false }),
      { initialProps: { strategy: first } },
    );
    act(() => {
      emitListenerEvent(listener, { id: 1 });
    });
    expect(view.result.current.data).toBe(10);
    view.rerender({ strategy: second });
    expect(listener.socket.adapter.listeners.get(listener.topic)?.size).toBe(1);
    act(() => {
      emitListenerEvent(listener, { id: 2 });
    });
    expect(view.result.current.data).toBe(20);
  });

  it("should render once per flush, not once per message", () => {
    const batched = listener.setDelivery({ strategy: "batch", interval: 100 });
    let renders = 0;
    renderHook(() => {
      renders += 1;
      return useListener(batched, { dependencyTracking: false });
    });
    const initial = renders;
    act(() => {
      for (let i = 1; i <= 50; i += 1) {
        emitListenerEvent(batched, { id: i });
      }
    });
    expect(renders).toBe(initial);
    act(() => {
      vi.advanceTimersByTime(100);
    });
    expect(renders).toBe(initial + 1);
  });

  it("should deliver several windows in order to onEvent", () => {
    const batched = listener.setDelivery({ strategy: "batch", interval: 100 });
    const spy = vi.fn();
    const view = renderUseListener(batched);
    act(() => {
      view.result.current.onEvent(({ data }) => spy(data));
    });
    act(() => {
      emitListenerEvent(batched, { id: 1 });
      vi.advanceTimersByTime(100);
      emitListenerEvent(batched, { id: 2 });
      emitListenerEvent(batched, { id: 3 });
      vi.advanceTimersByTime(100);
      emitListenerEvent(batched, { id: 4 });
      vi.advanceTimersByTime(100);
    });
    expect(spy.mock.calls.map(([d]) => d)).toEqual([[{ id: 1 }], [{ id: 2 }, { id: 3 }], [{ id: 4 }]]);
    expect(view.result.current.data).toEqual([{ id: 4 }]);
  });

  it("should set extra and timestamp on flush only", () => {
    const batched = listener.setDelivery({ strategy: "batch", interval: 100 });
    const view = renderUseListener(batched);
    act(() => {
      emitListenerEvent(batched, { id: 1 });
    });
    expect(view.result.current.extra).toBeNull();
    expect(view.result.current.timestamp).toBeNull();
    act(() => {
      vi.advanceTimersByTime(100);
    });
    expect(view.result.current.extra).toBeObject();
    expect(view.result.current.timestamp).toBeNumber();
  });

  it("should drop the buffer when listen() is called manually again", () => {
    const batched = listener.setDelivery({ strategy: "batch", interval: 100 });
    const spy = vi.fn();
    const view = renderUseListener(batched);
    act(() => {
      view.result.current.onEvent(({ data }) => spy(data));
    });
    act(() => {
      emitListenerEvent(batched, { id: 1 });
    });
    act(() => {
      view.result.current.listen();
    });
    expect(batched.socket.adapter.listeners.get(batched.topic)?.size).toBe(1);
    act(() => {
      emitListenerEvent(batched, { id: 2 });
      vi.advanceTimersByTime(100);
    });
    expect(spy).toHaveBeenCalledOnce();
    expect(spy).toHaveBeenCalledWith([{ id: 2 }]);
  });

  it("should work with a custom strategy", () => {
    const summarize = createDeliveryStrategy<Trade, { count: number }>(({ deliver }) => {
      let count = 0;
      let timer: ReturnType<typeof setTimeout> | undefined;
      return {
        push: ({ extra }) => {
          count += 1;
          timer ??= setTimeout(() => {
            timer = undefined;
            deliver({ data: { count }, extra });
            count = 0;
          }, 50);
        },
        dispose: () => clearTimeout(timer),
      };
    });
    const summarized = listener.setDelivery(summarize);
    const view = renderUseListener(summarized);
    act(() => {
      emitListenerEvent(listener, { id: 1 });
      emitListenerEvent(listener, { id: 2 });
      emitListenerEvent(listener, { id: 3 });
      vi.advanceTimersByTime(50);
    });
    expect(view.result.current.data).toEqual({ count: 3 });
  });

  it("should respect leading: false with the latest strategy", () => {
    const sampled = listener.setDelivery({ strategy: "latest", interval: 100, leading: false });
    const view = renderUseListener(sampled);
    act(() => {
      emitListenerEvent(sampled, { id: 1 });
      emitListenerEvent(sampled, { id: 2 });
    });
    expect(view.result.current.data).toBeNull();
    act(() => {
      vi.advanceTimersByTime(100);
    });
    expect(view.result.current.data).toEqual({ id: 2 });
  });

  it("should work with dependency tracking enabled", () => {
    const batched = listener.setDelivery({ strategy: "batch", interval: 100 });
    const view = renderUseListener(batched, { dependencyTracking: true });
    // read data to track it
    expect(view.result.current.data).toBeNull();
    act(() => {
      emitListenerEvent(batched, { id: 1 });
      vi.advanceTimersByTime(100);
    });
    expect(view.result.current.data).toEqual([{ id: 1 }]);
  });

  it("should clean up the adapter registration on unmount", () => {
    const batched = listener.setDelivery({ strategy: "batch", interval: 100 });
    const view = renderUseListener(batched);
    expect(batched.socket.adapter.listeners.get(batched.topic)?.size).toBe(1);
    view.unmount();
    expect(batched.socket.adapter.listeners.get(batched.topic)?.size).toBe(0);
  });

  it("should type data by the delivered type", () => {
    const batched = listener.setDelivery({ strategy: "batch", interval: 100 });
    expectTypeOf<ExtractListenerDeliveredType<typeof batched>>().toEqualTypeOf<Trade[]>();
    const useTyped = () => {
      const { data, onEvent } = useListener(batched);
      expectTypeOf(data).toEqualTypeOf<Trade[] | null>();
      onEvent(({ data: received }) => expectTypeOf(received).toEqualTypeOf<Trade[]>());
      const plain = listener.socket.createListener<Trade>()({ topic: "plain" });
      const { data: plainData } = useListener(plain);
      expectTypeOf(plainData).toEqualTypeOf<Trade | null>();
    };
    expect(useTyped).toBeFunction();
  });
});
