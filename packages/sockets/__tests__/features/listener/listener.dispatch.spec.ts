import { getAdapterBindings } from "adapter";
import { Socket } from "socket";

import type { ControlledWebSocket } from "../../utils/controlled-websocket";
import {
  installControlledWebSocket,
  openWebSocket,
  uninstallControlledWebSocket,
} from "../../utils/controlled-websocket";

type Tick = { value: number };

describe("Listener [ Dispatch ]", () => {
  let socket: Socket;
  let websocket: ControlledWebSocket;

  beforeEach(async () => {
    installControlledWebSocket();
    socket = new Socket({ url: "ws://dispatch", reconnectTime: 100 });
    websocket = await openWebSocket();
  });

  afterEach(async () => {
    await socket.disconnect();
    uninstallControlledWebSocket();
  });

  describe("When many callbacks listen to one topic", () => {
    it("should call every callback once per message", () => {
      const listener = socket.createListener<Tick>()({ topic: "ticks" });
      const spies = [vi.fn(), vi.fn(), vi.fn()];
      spies.forEach((spy) => listener.listen(({ data }) => spy(data)));

      websocket.serverEmit("ticks", { value: 1 });

      spies.forEach((spy) => {
        expect(spy).toHaveBeenCalledTimes(1);
        expect(spy).toHaveBeenCalledWith({ value: 1 });
      });
    });

    it("should call the callbacks in the order they subscribed", () => {
      const listener = socket.createListener<Tick>()({ topic: "ticks" });
      const order: string[] = [];
      listener.listen(() => order.push("first"));
      listener.listen(() => order.push("second"));
      listener.listen(() => order.push("third"));

      websocket.serverEmit("ticks", { value: 1 });

      expect(order).toStrictEqual(["first", "second", "third"]);
    });

    it("should stop only the unsubscribed callback", () => {
      const listener = socket.createListener<Tick>()({ topic: "ticks" });
      const first = vi.fn();
      const second = vi.fn();
      const third = vi.fn();
      listener.listen(first);
      const stopSecond = listener.listen(second);
      listener.listen(third);

      stopSecond();
      websocket.serverEmit("ticks", { value: 1 });

      expect(first).toHaveBeenCalledTimes(1);
      expect(second).not.toHaveBeenCalled();
      expect(third).toHaveBeenCalledTimes(1);
    });

    it("should share the callbacks registered through separate listener instances of the same topic", () => {
      const first = vi.fn();
      const second = vi.fn();
      socket.createListener<Tick>()({ topic: "ticks" }).listen(first);
      socket.createListener<Tick>()({ topic: "ticks" }).listen(second);

      websocket.serverEmit("ticks", { value: 1 });

      expect(first).toHaveBeenCalledTimes(1);
      expect(second).toHaveBeenCalledTimes(1);
      expect(socket.adapter.listeners.get("ticks")?.size).toBe(2);
    });

    it("should keep the messages of every topic apart", () => {
      const ticks = vi.fn();
      const tocks = vi.fn();
      socket
        .createListener<Tick>()({ topic: "ticks" })
        .listen(({ data }) => ticks(data));
      socket
        .createListener<Tick>()({ topic: "tocks" })
        .listen(({ data }) => tocks(data));

      websocket.serverEmit("ticks", { value: 1 });
      websocket.serverEmit("tocks", { value: 2 });
      websocket.serverEmit("ticks", { value: 3 });

      expect(ticks.mock.calls).toStrictEqual([[{ value: 1 }], [{ value: 3 }]]);
      expect(tocks.mock.calls).toStrictEqual([[{ value: 2 }]]);
    });

    it("should not treat a topic as a prefix or a pattern", () => {
      const spy = vi.fn();
      socket.createListener<Tick>()({ topic: "ticks" }).listen(spy);
      socket.createListener<Tick>()({ topic: "*" }).listen(spy);

      websocket.serverEmit("ticks/1", { value: 1 });
      websocket.serverEmit("tick", { value: 1 });
      websocket.serverEmit("TICKS", { value: 1 });

      expect(spy).not.toHaveBeenCalled();
    });

    it("should keep 10000 messages in order", () => {
      const received: number[] = [];
      socket
        .createListener<Tick>()({ topic: "ticks" })
        .listen(({ data }) => received.push(data.value));

      for (let i = 0; i < 10_000; i += 1) {
        websocket.serverEmit("ticks", { value: i });
      }

      expect(received).toHaveLength(10_000);
      expect(received.every((value, index) => value === index)).toBeTrue();
    });
  });

  describe("When a callback changes the subscriptions during a dispatch", () => {
    it("should let a callback unsubscribe itself and listen only once", () => {
      const listener = socket.createListener<Tick>()({ topic: "ticks" });
      const spy = vi.fn();
      const stop = listener.listen(({ data }) => {
        spy(data);
        stop();
      });

      websocket.serverEmit("ticks", { value: 1 });
      websocket.serverEmit("ticks", { value: 2 });

      expect(spy).toHaveBeenCalledTimes(1);
      expect(spy).toHaveBeenCalledWith({ value: 1 });
    });

    it("should still call the callbacks registered after the one that unsubscribed itself", () => {
      const listener = socket.createListener<Tick>()({ topic: "ticks" });
      const after = vi.fn();
      const stop = listener.listen(() => stop());
      listener.listen(after);

      websocket.serverEmit("ticks", { value: 1 });

      expect(after).toHaveBeenCalledTimes(1);
    });

    it("should not call a callback that was unsubscribed earlier in the same dispatch", () => {
      const listener = socket.createListener<Tick>()({ topic: "ticks" });
      const removed = vi.fn();
      let stopRemoved: () => void = () => null;
      listener.listen(() => stopRemoved());
      stopRemoved = listener.listen(removed);

      websocket.serverEmit("ticks", { value: 1 });

      expect(removed).not.toHaveBeenCalled();
    });

    it("should deliver the next message, not the current one, to a callback added during a dispatch", () => {
      const listener = socket.createListener<Tick>()({ topic: "ticks" });
      const late = vi.fn();
      let added = false;
      listener.listen(() => {
        if (!added) {
          added = true;
          listener.listen(({ data }) => late(data));
        }
      });

      websocket.serverEmit("ticks", { value: 1 });
      expect(late).not.toHaveBeenCalled();

      websocket.serverEmit("ticks", { value: 2 });
      expect(late.mock.calls).toStrictEqual([[{ value: 2 }]]);
    });

    it("should not loop when every callback subscribes another one", () => {
      const listener = socket.createListener<Tick>()({ topic: "ticks" });
      const subscribe = () => {
        listener.listen(() => subscribe());
      };
      subscribe();

      websocket.serverEmit("ticks", { value: 1 });

      expect(socket.adapter.listeners.get("ticks")?.size).toBe(2);
    });
  });

  describe("When a callback throws", () => {
    it("should still call the other callbacks of the topic", () => {
      const listener = socket.createListener<Tick>()({ topic: "ticks" });
      const before = vi.fn();
      const after = vi.fn();
      listener.listen(before);
      listener.listen(() => {
        throw new Error("Broken callback");
      });
      listener.listen(after);

      expect(() => socket.adapter.triggerListeners({ topic: "ticks", data: { value: 1 }, extra: {} as any })).toThrow(
        "Broken callback",
      );

      expect(before).toHaveBeenCalledTimes(1);
      expect(after).toHaveBeenCalledTimes(1);
    });

    it("should still publish the message on the socket events", () => {
      const listener = socket.createListener<Tick>()({ topic: "ticks" });
      const global = vi.fn();
      const byTopic = vi.fn();
      listener.listen(() => {
        throw new Error("Broken callback");
      });
      socket.events.onListenerEvent(global);
      socket.events.onListenerEventByTopic(listener, byTopic);

      const { onEvent } = getAdapterBindings(socket);

      expect(() => onEvent({ topic: "ticks", data: { value: 1 }, extra: {} as any })).toThrow("Broken callback");

      expect(global).toHaveBeenCalledTimes(1);
      expect(byTopic).toHaveBeenCalledTimes(1);
    });

    it("should keep the connection and deliver the next messages", () => {
      const listener = socket.createListener<Tick>()({ topic: "ticks" });
      const spy = vi.fn();
      listener.listen(({ data }) => {
        if (data.value === 1) {
          throw new Error("Broken callback");
        }
        spy(data);
      });

      const { onEvent } = getAdapterBindings(socket);
      expect(() => onEvent({ topic: "ticks", data: { value: 1 }, extra: {} as any })).toThrow("Broken callback");
      websocket.serverEmit("ticks", { value: 2 });

      expect(spy).toHaveBeenCalledWith({ value: 2 });
      expect(socket.adapter.connected).toBeTrue();
    });
  });

  describe("When unsubscribing", () => {
    it("should emit the remove event once, also when unsubscribe is called twice", () => {
      const listener = socket.createListener<Tick>()({ topic: "ticks" });
      const removed = vi.fn();
      const removedByTopic = vi.fn();
      socket.events.onListenerRemove(removed);
      socket.events.onListenerRemoveByTopic(listener, removedByTopic);
      const stop = listener.listen(() => null);

      stop();
      stop();

      expect(removed).toHaveBeenCalledTimes(1);
      expect(removed).toHaveBeenCalledWith({ topic: "ticks" });
      expect(removedByTopic).toHaveBeenCalledTimes(1);
    });

    it("should report whether a callback was removed", () => {
      const listener = socket.createListener<Tick>()({ topic: "ticks" });
      const callback = () => null;
      listener.listen(callback);

      expect(socket.adapter.removeListener({ topic: "ticks", callback })).toBeTrue();
      expect(socket.adapter.removeListener({ topic: "ticks", callback })).toBeFalse();
      expect(socket.adapter.removeListener({ topic: "unknown", callback })).toBeFalse();
    });

    it("should not remove the callbacks of other topics", () => {
      const callback = vi.fn();
      const stopTicks = socket.createListener<Tick>()({ topic: "ticks" }).listen(callback);
      socket.createListener<Tick>()({ topic: "tocks" }).listen(callback);

      stopTicks();
      websocket.serverEmit("ticks", { value: 1 });
      websocket.serverEmit("tocks", { value: 2 });

      expect(callback).toHaveBeenCalledTimes(1);
      expect(callback.mock.calls[0][0].data).toStrictEqual({ value: 2 });
    });

    it("should leave no callbacks after every subscription was stopped", () => {
      const listener = socket.createListener<Tick>()({ topic: "ticks" });
      const stops = Array.from({ length: 50 }, () => listener.listen(() => null));

      stops.forEach((stop) => stop());

      expect(socket.adapter.listeners.get("ticks")?.size).toBe(0);
    });

    it("should allow subscribing again after unsubscribing", () => {
      const listener = socket.createListener<Tick>()({ topic: "ticks" });
      const spy = vi.fn();
      listener.listen(spy)();
      listener.listen(spy);

      websocket.serverEmit("ticks", { value: 1 });

      expect(spy).toHaveBeenCalledTimes(1);
    });
  });

  describe("When the connection changes", () => {
    it("should allow subscribing before the socket is connected", async () => {
      const lazy = new Socket({ url: "ws://lazy", adapterOptions: { autoConnect: false } });
      const spy = vi.fn();
      lazy
        .createListener<Tick>()({ topic: "ticks" })
        .listen(({ data }) => spy(data));

      const connecting = lazy.connect();
      const lazyWebsocket = await openWebSocket(2);
      await connecting;
      lazyWebsocket.serverEmit("ticks", { value: 1 });

      expect(spy).toHaveBeenCalledWith({ value: 1 });
      await lazy.disconnect();
    });

    it("should keep every subscription exactly once after a reconnect", async () => {
      const listener = socket.createListener<Tick>()({ topic: "ticks" });
      const first = vi.fn();
      const second = vi.fn();
      listener.listen(first);
      listener.listen(second);

      const reconnecting = socket.reconnect();
      const next = await openWebSocket(2);
      await reconnecting;
      next.serverEmit("ticks", { value: 1 });

      expect(first).toHaveBeenCalledTimes(1);
      expect(second).toHaveBeenCalledTimes(1);
      expect(socket.adapter.listeners.get("ticks")?.size).toBe(2);
    });

    it("should keep the subscriptions after disconnecting and connecting again", async () => {
      const spy = vi.fn();
      socket.createListener<Tick>()({ topic: "ticks" }).listen(spy);

      await socket.disconnect();
      const connecting = socket.connect();
      const next = await openWebSocket(2);
      await connecting;
      next.serverEmit("ticks", { value: 1 });

      expect(spy).toHaveBeenCalledTimes(1);
    });

    it("should allow unsubscribing while the socket is disconnected", async () => {
      const spy = vi.fn();
      const stop = socket.createListener<Tick>()({ topic: "ticks" }).listen(spy);

      await socket.disconnect();
      stop();
      const connecting = socket.connect();
      const next = await openWebSocket(2);
      await connecting;
      next.serverEmit("ticks", { value: 1 });

      expect(spy).not.toHaveBeenCalled();
    });
  });

  describe("When the server sends malformed frames", () => {
    it.each([
      { name: "text that is not JSON", frame: "not json at all" },
      { name: "an empty frame", frame: "" },
      { name: "a JSON null", frame: "null" },
      { name: "a JSON number", frame: "42" },
      { name: "a JSON array", frame: "[1,2,3]" },
      { name: "an object without a topic", frame: JSON.stringify({ data: { value: 1 } }) },
      { name: "a binary frame", frame: new Uint8Array([1, 2, 3]).buffer },
      { name: "a blob", frame: new Blob(["binary"]) },
    ])("should ignore $name and keep the connection", ({ frame }) => {
      const spy = vi.fn();
      const errors = vi.fn();
      socket.onError(errors);
      socket
        .createListener<Tick>()({ topic: "ticks" })
        .listen(({ data }) => spy(data));

      expect(() => websocket.serverSend(frame)).not.toThrow();
      websocket.serverEmit("ticks", { value: 1 });

      expect(spy.mock.calls).toStrictEqual([[{ value: 1 }]]);
      expect(errors).not.toHaveBeenCalled();
      expect(socket.adapter.connected).toBeTrue();
    });

    it("should deliver a message without data as undefined", () => {
      const spy = vi.fn();
      socket
        .createListener<undefined>()({ topic: "ping" })
        .listen(({ data }) => spy(data));

      websocket.serverSend(JSON.stringify({ topic: "ping" }));

      expect(spy).toHaveBeenCalledWith(undefined);
    });

    it("should pass the raw MessageEvent as extra", () => {
      const extras: MessageEvent[] = [];
      socket
        .createListener<Tick>()({ topic: "ticks" })
        .listen(({ extra }) => extras.push(extra));

      websocket.serverEmit("ticks", { value: 1 });

      expect(extras[0]).toBeInstanceOf(MessageEvent);
      expect(extras[0].data).toBe(JSON.stringify({ topic: "ticks", data: { value: 1 } }));
    });
  });
});
