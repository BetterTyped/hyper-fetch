import { createWebsocketMockingServer, waitForConnection } from "@hyper-fetch/testing";
import { createDeliveryStrategy } from "delivery";

import { createListener } from "../../utils/listener.utils";
import { createSocket } from "../../utils/socket.utils";

type DataType = { price: number };

describe("Listener [ Delivery ]", () => {
  const { startServer, stopServer, emitListenerEvent } = createWebsocketMockingServer();
  let socket = createSocket();

  beforeEach(async () => {
    startServer();
    socket = createSocket();
    await waitForConnection(socket);
    vi.useFakeTimers({ toFake: ["setTimeout", "clearTimeout"] });
  });

  afterEach(() => {
    vi.useRealTimers();
    stopServer();
  });

  it("should register the original callback when no delivery is configured", () => {
    const listener = createListener<DataType>(socket);
    const spy = vi.fn();
    const stop = listener.listen(spy);
    expect(socket.adapter.listeners.get(listener.topic)?.has(spy)).toBeTrue();
    stop();
    expect(socket.adapter.listeners.get(listener.topic)?.has(spy)).toBeFalse();
  });

  it("should register a wrapper and remove it on unsubscribe when delivery is configured", () => {
    const listener = createListener<DataType>(socket, { delivery: { strategy: "latest", interval: 100 } });
    const spy = vi.fn();
    const stop = listener.listen(spy);
    const group = socket.adapter.listeners.get(listener.topic);
    expect(group?.size).toBe(1);
    expect(group?.has(spy)).toBeFalse();
    stop();
    expect(group?.size).toBe(0);
  });

  it("should sample messages with the latest strategy", () => {
    const listener = createListener<DataType>(socket, { delivery: { strategy: "latest", interval: 100 } });
    const spy = vi.fn();
    listener.listen(({ data }) => spy(data));

    emitListenerEvent(listener, { price: 1 });
    emitListenerEvent(listener, { price: 2 });
    emitListenerEvent(listener, { price: 3 });
    expect(spy).toHaveBeenCalledOnce();
    expect(spy).toHaveBeenCalledWith({ price: 1 });

    vi.advanceTimersByTime(100);
    expect(spy).toHaveBeenCalledTimes(2);
    expect(spy).toHaveBeenLastCalledWith({ price: 3 });
  });

  it("should batch messages with the batch strategy", () => {
    const listener = createListener<DataType>(socket, { delivery: { strategy: "batch", interval: 100 } });
    const spy = vi.fn();
    listener.listen(({ data, extra }) => spy(data, extra));

    emitListenerEvent(listener, { price: 1 });
    emitListenerEvent(listener, { price: 2 });
    expect(spy).not.toHaveBeenCalled();

    vi.advanceTimersByTime(100);
    expect(spy).toHaveBeenCalledOnce();
    expect(spy.mock.calls[0][0]).toEqual([{ price: 1 }, { price: 2 }]);
    expect(spy.mock.calls[0][1]).toHaveProperty("data");
  });

  it("should not deliver after unsubscribe", () => {
    const listener = createListener<DataType>(socket, { delivery: { strategy: "batch", interval: 100 } });
    const spy = vi.fn();
    const stop = listener.listen(spy);
    emitListenerEvent(listener, { price: 1 });
    stop();
    vi.advanceTimersByTime(500);
    emitListenerEvent(listener, { price: 2 });
    vi.advanceTimersByTime(500);
    expect(spy).not.toHaveBeenCalled();
  });

  it("should run a custom strategy", () => {
    const summarize = createDeliveryStrategy<DataType, { count: number; max: number }>(({ deliver }) => {
      let count = 0;
      let max = -Infinity;
      let timer: ReturnType<typeof setTimeout> | undefined;
      return {
        push: ({ data, extra }) => {
          count += 1;
          max = Math.max(max, data.price);
          timer ??= setTimeout(() => {
            timer = undefined;
            deliver({ data: { count, max }, extra });
            count = 0;
            max = -Infinity;
          }, 50);
        },
        dispose: () => clearTimeout(timer),
      };
    });
    const listener = createListener<DataType>(socket, { delivery: summarize });
    const spy = vi.fn();
    listener.listen(({ data }) => spy(data));

    emitListenerEvent(listener, { price: 5 });
    emitListenerEvent(listener, { price: 9 });
    emitListenerEvent(listener, { price: 2 });
    vi.advanceTimersByTime(50);
    expect(spy).toHaveBeenCalledOnce();
    expect(spy).toHaveBeenCalledWith({ count: 3, max: 9 });
  });

  it("should give every listen() call its own controller", () => {
    const listener = createListener<DataType>(socket, { delivery: { strategy: "batch", interval: 100 } });
    const first = vi.fn();
    const second = vi.fn();
    const stopFirst = listener.listen(first);
    listener.listen(second);
    emitListenerEvent(listener, { price: 1 });
    stopFirst();
    vi.advanceTimersByTime(100);
    expect(first).not.toHaveBeenCalled();
    expect(second).toHaveBeenCalledOnce();
  });

  it("should carry delivery through setParams, setOptions and clone", () => {
    const delivery = { strategy: "latest", interval: 16 } as const;
    const listener = socket.createListener<DataType>()({ topic: "prices/:symbol", delivery });
    expect(listener.setParams({ symbol: "BTC" }).delivery).toStrictEqual(delivery);
    expect(listener.setOptions(undefined).delivery).toStrictEqual(delivery);
    expect(listener.clone().delivery).toStrictEqual(delivery);
  });

  it("should return a clone from setDelivery and allow clearing it", () => {
    const listener = createListener<DataType>(socket);
    const batched = listener.setDelivery({ strategy: "batch", interval: 100 });
    expect(batched).not.toBe(listener);
    expect(listener.delivery).toBeUndefined();
    expect(batched.delivery).toStrictEqual({ strategy: "batch", interval: 100 });
    expect(batched.setDelivery(undefined).delivery).toBeUndefined();
  });

  it("should throw on an unknown strategy at creation time", () => {
    expect(() =>
      socket.createListener<DataType>()({ topic: "prices", delivery: { strategy: "nope", interval: 1 } as any }),
    ).toThrow(/Unknown delivery strategy/);
  });

  it("should wrap adapters that call the callback directly (Firebase-style)", () => {
    const listener = createListener<DataType>(socket, { delivery: { strategy: "batch", interval: 100 } });
    const spy = vi.fn();
    listener.listen(({ data }) => spy(data));
    const [registered] = [...socket.adapter.listeners.get(listener.topic)!.keys()];

    // Simulate an adapter invoking the registered callback directly, bypassing triggerListeners.
    registered({ data: { price: 1 }, extra: null as any });
    registered({ data: { price: 2 }, extra: null as any });
    expect(spy).not.toHaveBeenCalled();
    vi.advanceTimersByTime(100);
    expect(spy).toHaveBeenCalledWith([{ price: 1 }, { price: 2 }]);
  });

  it("should run onMessage interceptors per raw message before batching", () => {
    const interceptor = vi.fn(({ event }) => event);
    socket.onMessage(interceptor);
    const listener = createListener<DataType>(socket, { delivery: { strategy: "batch", interval: 100 } });
    listener.listen(() => null);
    emitListenerEvent(listener, { price: 1 });
    emitListenerEvent(listener, { price: 2 });
    expect(interceptor).toHaveBeenCalledTimes(2);
  });

  it("should expose params on the listener", () => {
    const listener = socket.createListener<DataType>()({ topic: "prices/:symbol" }).setParams({ symbol: "BTC" });
    expect(listener.params).toStrictEqual({ symbol: "BTC" });
    expect(listener.topic).toBe("prices/BTC");
  });

  it("should keep socket.events broadcasts unthrottled", () => {
    const listener = createListener<DataType>(socket, { delivery: { strategy: "batch", interval: 100 } });
    const callback = vi.fn();
    const byTopic = vi.fn();
    const global = vi.fn();
    listener.listen(callback);
    socket.events.onListenerEventByTopic(listener, byTopic);
    socket.events.onListenerEvent(global);

    emitListenerEvent(listener, { price: 1 });
    emitListenerEvent(listener, { price: 2 });
    emitListenerEvent(listener, { price: 3 });

    expect(callback).not.toHaveBeenCalled();
    expect(byTopic).toHaveBeenCalledTimes(3);
    expect(global).toHaveBeenCalledTimes(3);
    vi.advanceTimersByTime(100);
    expect(callback).toHaveBeenCalledOnce();
  });

  it("should isolate delivery per dynamic topic", () => {
    const template = socket.createListener<DataType>()({
      topic: "prices/:symbol",
      delivery: { strategy: "batch", interval: 100 },
    });
    const btc = template.setParams({ symbol: "BTC" });
    const eth = template.setParams({ symbol: "ETH" });
    const btcSpy = vi.fn();
    const ethSpy = vi.fn();
    btc.listen(({ data }) => btcSpy(data));
    eth.listen(({ data }) => ethSpy(data));

    emitListenerEvent(btc, { price: 1 });
    emitListenerEvent(eth, { price: 10 });
    emitListenerEvent(btc, { price: 2 });
    vi.advanceTimersByTime(100);

    expect(btcSpy).toHaveBeenCalledWith([{ price: 1 }, { price: 2 }]);
    expect(ethSpy).toHaveBeenCalledWith([{ price: 10 }]);
  });

  it("should not affect listeners on other topics", () => {
    const batched = createListener<DataType>(socket, { delivery: { strategy: "batch", interval: 100 } });
    const immediate = createListener<DataType>(socket);
    const batchedSpy = vi.fn();
    const immediateSpy = vi.fn();
    batched.listen(batchedSpy);
    immediate.listen(immediateSpy);

    emitListenerEvent(batched, { price: 1 });
    emitListenerEvent(immediate, { price: 2 });
    expect(batchedSpy).not.toHaveBeenCalled();
    expect(immediateSpy).toHaveBeenCalledOnce();
  });

  it("should allow mixing immediate and delivered subscriptions on one topic", () => {
    const listener = createListener<DataType>(socket);
    const immediateSpy = vi.fn();
    const batchedSpy = vi.fn();
    listener.listen(immediateSpy);
    listener.setDelivery({ strategy: "batch", interval: 100 }).listen(batchedSpy);

    emitListenerEvent(listener, { price: 1 });
    emitListenerEvent(listener, { price: 2 });
    expect(immediateSpy).toHaveBeenCalledTimes(2);
    expect(batchedSpy).not.toHaveBeenCalled();
    vi.advanceTimersByTime(100);
    expect(batchedSpy).toHaveBeenCalledOnce();
  });

  it("should create independent subscriptions for the same callback passed twice", () => {
    const listener = createListener<DataType>(socket, { delivery: { strategy: "latest", interval: 100 } });
    const spy = vi.fn();
    const stopFirst = listener.listen(spy);
    const stopSecond = listener.listen(spy);
    expect(socket.adapter.listeners.get(listener.topic)?.size).toBe(2);

    emitListenerEvent(listener, { price: 1 });
    expect(spy).toHaveBeenCalledTimes(2);

    stopFirst();
    expect(socket.adapter.listeners.get(listener.topic)?.size).toBe(1);
    emitListenerEvent(listener, { price: 2 });
    vi.advanceTimersByTime(100);
    expect(spy).toHaveBeenCalledTimes(3);
    stopSecond();
    expect(socket.adapter.listeners.get(listener.topic)?.size).toBe(0);
  });

  it("should unsubscribe safely from inside the callback", () => {
    const listener = createListener<DataType>(socket, { delivery: { strategy: "batch", interval: 100 } });
    const spy = vi.fn();
    const stop = listener.listen(({ data }) => {
      spy(data);
      stop();
    });
    emitListenerEvent(listener, { price: 1 });
    vi.advanceTimersByTime(100);
    emitListenerEvent(listener, { price: 2 });
    vi.advanceTimersByTime(100);
    expect(spy).toHaveBeenCalledOnce();
    expect(socket.adapter.listeners.get(listener.topic)?.size).toBe(0);
  });

  it("should handle a large burst with the latest strategy", () => {
    const listener = createListener<DataType>(socket, { delivery: { strategy: "latest", interval: 16 } });
    const spy = vi.fn();
    listener.listen(({ data }) => spy(data));
    for (let i = 1; i <= 500; i += 1) {
      emitListenerEvent(listener, { price: i });
    }
    expect(spy).toHaveBeenCalledOnce();
    vi.advanceTimersByTime(16);
    expect(spy).toHaveBeenCalledTimes(2);
    expect(spy).toHaveBeenLastCalledWith({ price: 500 });
  });

  it("should handle a large burst with the batch strategy and maxSize", () => {
    const listener = createListener<DataType>(socket, {
      delivery: { strategy: "batch", interval: 100, maxSize: 100 },
    });
    const spy = vi.fn();
    listener.listen(({ data }) => spy(data));
    for (let i = 1; i <= 250; i += 1) {
      emitListenerEvent(listener, { price: i });
    }
    expect(spy).toHaveBeenCalledTimes(2);
    vi.advanceTimersByTime(100);
    expect(spy).toHaveBeenCalledTimes(3);
    const all = spy.mock.calls.flatMap(([batch]) => batch.map((m: DataType) => m.price));
    expect(all).toEqual(Array.from({ length: 250 }, (_, i) => i + 1));
  });

  it("should expose delivery on listenerOptions and keep options untouched", () => {
    const delivery = { strategy: "batch", interval: 100 } as const;
    const listener = createListener<DataType>(socket, { delivery });
    expect(listener.listenerOptions.delivery).toStrictEqual(delivery);
    expect(listener.options).toBeUndefined();
    expect(listener.setOptions({ anything: true } as any).delivery).toStrictEqual(delivery);
  });

  it("should allow overriding delivery through clone", () => {
    const listener = createListener<DataType>(socket, { delivery: { strategy: "batch", interval: 100 } });
    const cloned = listener.clone({ delivery: { strategy: "latest", interval: 16 } });
    expect(cloned.delivery).toStrictEqual({ strategy: "latest", interval: 16 });
    expect(listener.delivery).toStrictEqual({ strategy: "batch", interval: 100 });
  });

  it("should accept a custom strategy through setDelivery", () => {
    const listener = createListener<DataType>(socket);
    const passthrough = createDeliveryStrategy<DataType, number>(({ deliver }) => ({
      push: ({ data, extra }) => deliver({ data: data.price * 2, extra }),
      dispose: () => null,
    }));
    const spy = vi.fn();
    listener.setDelivery(passthrough).listen(({ data }) => spy(data));
    emitListenerEvent(listener, { price: 21 });
    expect(spy).toHaveBeenCalledWith(42);
  });

  it("should call a custom strategy factory once per listen()", () => {
    const factory = vi.fn((_context: unknown) => ({ push: vi.fn(), dispose: vi.fn() }));
    const listener = createListener<DataType>(socket, { delivery: factory as any });
    const stopA = listener.listen(() => null);
    const stopB = listener.listen(() => null);
    expect(factory).toHaveBeenCalledTimes(2);
    expect(factory.mock.calls[0][0]).toHaveProperty("deliver");
    stopA();
    stopB();
    expect(factory.mock.results[0].value.dispose).toHaveBeenCalledOnce();
    expect(factory.mock.results[1].value.dispose).toHaveBeenCalledOnce();
  });

  it("should restore immediate delivery after setDelivery(undefined)", () => {
    const listener = createListener<DataType>(socket, { delivery: { strategy: "batch", interval: 100 } });
    const spy = vi.fn();
    listener.setDelivery(undefined).listen(spy);
    emitListenerEvent(listener, { price: 1 });
    expect(spy).toHaveBeenCalledOnce();
    expect(socket.adapter.listeners.get(listener.topic)?.has(spy)).toBeTrue();
  });

  it("should keep delivering after the socket reconnects", async () => {
    vi.useRealTimers();
    const listener = createListener<DataType>(socket, { delivery: { strategy: "batch", interval: 20 } });
    const spy = vi.fn();
    listener.listen(({ data }) => spy(data));

    socket.disconnect();
    socket.connect();
    await waitForConnection(socket);

    emitListenerEvent(listener, { price: 1 });
    emitListenerEvent(listener, { price: 2 });
    await new Promise((resolve) => {
      setTimeout(resolve, 60);
    });
    expect(spy).toHaveBeenCalledOnce();
    expect(spy).toHaveBeenCalledWith([{ price: 1 }, { price: 2 }]);
  });
});
