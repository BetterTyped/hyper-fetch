import { SocketAdapter } from "adapter";
import { createDeliveryStrategy } from "delivery";
import type { ListenerCallbackType, ListenerOfAdapter } from "listener";
import { Socket } from "socket";

type Message = { text: string };
type RoomInput = { roomId: string };

type Subscription = {
  listener: ListenerOfAdapter<any>;
  callback: ListenerCallbackType<any, any>;
};

/**
 * Adapter with one server subscription per (topic, payload) that lets the test play the server:
 * confirm (`start`), push messages and end subscriptions, the way the tRPC and oRPC adapters do.
 */
const createLifecycleAdapter = ({ confirmsSubscriptions = true }: { confirmsSubscriptions?: boolean } = {}) => {
  const subscriptions: Subscription[] = [];
  const adapter = new SocketAdapter<{ subscription: string }>({
    name: "lifecycle-test",
    defaultConnected: true,
    confirmsSubscriptions,
  });
  type Bindings = Parameters<Parameters<typeof adapter.setConnector>[0]>[0];
  let bindings: Bindings | undefined;

  adapter.setConnector((connectorBindings) => {
    bindings = connectorBindings;
    return {
      connect: () => {},
      reconnect: () => {},
      disconnect: () => {},
      emit: () => {},
      listen: (listener, callback) => {
        const subscription = { listener, callback };
        subscriptions.push(subscription);
        return connectorBindings.onListen({
          listener,
          callback,
          onUnmount: () => subscriptions.splice(subscriptions.indexOf(subscription), 1),
        });
      },
    };
  });

  const callbacksOf = (topic: string, payload?: unknown) => {
    const key = JSON.stringify(payload);
    return new Set(
      subscriptions
        .filter((sub) => sub.listener.topic === topic && JSON.stringify(sub.listener.payload) === key)
        .map((sub) => sub.callback),
    );
  };

  const server = {
    start: (topic: string, payload?: unknown) =>
      bindings?.onListenerStart({ topic, callbacks: callbacksOf(topic, payload) }),
    push: (topic: string, payload: unknown, data: unknown) =>
      bindings?.onEvent({
        topic,
        data,
        extra: { subscription: JSON.stringify(payload) },
        callbacks: callbacksOf(topic, payload),
      }),
    end: (topic: string, payload?: unknown, error?: Error | null) =>
      bindings?.onListenerEnd({ topic, callbacks: callbacksOf(topic, payload), error }),
    bindings: () => bindings as Bindings,
  };

  return { adapter, subscriptions, server };
};

describe("Listener [ Lifecycle ]", () => {
  let setup: ReturnType<typeof createLifecycleAdapter>;
  let socket: Socket<SocketAdapter<{ subscription: string }>>;

  const createRoomListener = () => socket.createListener<Message, RoomInput>()({ topic: "chat.onMessage" });

  beforeEach(() => {
    setup = createLifecycleAdapter();
    socket = new Socket({ url: "ws://lifecycle", adapter: setup.adapter });
  });

  afterEach(() => {
    vi.useRealTimers();
  });

  describe("When the adapter does not confirm subscriptions", () => {
    beforeEach(() => {
      setup = createLifecycleAdapter({ confirmsSubscriptions: false });
      socket = new Socket({ url: "ws://lifecycle", adapter: setup.adapter });
    });

    it("should start the subscription right after listen", () => {
      const onStart = vi.fn();
      socket.createListener<Message>()({ topic: "news" }).listen(vi.fn(), { onStart });

      expect(onStart).toHaveBeenCalledTimes(1);
      expect(onStart).toHaveBeenCalledWith({ topic: "news" });
    });

    it("should start the default adapters right away", () => {
      const defaultSocket = new Socket({ url: "ws://default", adapterOptions: { autoConnect: false } });
      const onStart = vi.fn();
      defaultSocket.createListener<Message>()({ topic: "news" }).listen(vi.fn(), { onStart });

      expect(defaultSocket.adapter.confirmsSubscriptions).toBeFalse();
      expect(onStart).toHaveBeenCalledTimes(1);
    });
  });

  describe("When the server confirms the subscription", () => {
    it("should not start before the confirmation", () => {
      const onStart = vi.fn();
      createRoomListener().listen(vi.fn(), { payload: { roomId: "1" }, onStart });

      expect(onStart).not.toHaveBeenCalled();
    });

    it("should start when the server confirms it", () => {
      const onStart = vi.fn();
      createRoomListener().listen(vi.fn(), { payload: { roomId: "1" }, onStart });

      setup.server.start("chat.onMessage", { roomId: "1" });

      expect(onStart).toHaveBeenCalledTimes(1);
      expect(onStart).toHaveBeenCalledWith({ topic: "chat.onMessage" });
    });

    it("should start only the subscription of the confirmed payload", () => {
      const roomOne = vi.fn();
      const roomTwo = vi.fn();
      createRoomListener().listen(vi.fn(), { payload: { roomId: "1" }, onStart: roomOne });
      createRoomListener().listen(vi.fn(), { payload: { roomId: "2" }, onStart: roomTwo });

      setup.server.start("chat.onMessage", { roomId: "2" });

      expect(roomOne).not.toHaveBeenCalled();
      expect(roomTwo).toHaveBeenCalledTimes(1);
    });

    it("should start again when the subscription is restarted", () => {
      const onStart = vi.fn();
      createRoomListener().setPayload({ roomId: "1" }).listen(vi.fn(), { onStart });

      setup.server.start("chat.onMessage", { roomId: "1" });
      setup.server.start("chat.onMessage", { roomId: "1" });

      expect(onStart).toHaveBeenCalledTimes(2);
    });

    it("should keep the start and end callbacks of a listen payload", () => {
      const onStart = vi.fn();
      const onEnd = vi.fn();
      const listener = createRoomListener();
      listener.listen(vi.fn(), { payload: { roomId: "1" }, onStart, onEnd });

      setup.server.start("chat.onMessage", { roomId: "1" });
      setup.server.end("chat.onMessage", { roomId: "1" });

      expect(onStart).toHaveBeenCalledTimes(1);
      expect(onEnd).toHaveBeenCalledTimes(1);
    });

    it("should ignore callbacks that are not registered on the topic", () => {
      const onError = vi.fn();
      socket.onError(onError);
      const stranger = vi.fn();

      setup.server.bindings().onListenerStart({ topic: "chat.onMessage", callbacks: new Set([stranger]) });

      expect(onError).not.toHaveBeenCalled();
    });

    it("should report the start to the socket events", () => {
      const all = vi.fn();
      const byTopic = vi.fn();
      const listener = createRoomListener();
      socket.events.onListenerStart(all);
      socket.events.onListenerStartByTopic(listener, byTopic);
      listener.listen(vi.fn(), { payload: { roomId: "1" } });

      setup.server.start("chat.onMessage", { roomId: "1" });

      expect(all).toHaveBeenCalledWith({ topic: "chat.onMessage" });
      expect(byTopic).toHaveBeenCalledWith({ topic: "chat.onMessage" });
    });
  });

  describe("When the server ends the subscription", () => {
    it("should call onEnd without an error when it finished", () => {
      const onEnd = vi.fn();
      createRoomListener().listen(vi.fn(), { payload: { roomId: "1" }, onEnd });

      setup.server.end("chat.onMessage", { roomId: "1" });

      expect(onEnd).toHaveBeenCalledTimes(1);
      expect(onEnd).toHaveBeenCalledWith({ topic: "chat.onMessage", error: null });
    });

    it("should call onEnd with the error when it failed", () => {
      const onEnd = vi.fn();
      const error = new Error("Forbidden");
      createRoomListener().listen(vi.fn(), { payload: { roomId: "1" }, onEnd });

      setup.server.end("chat.onMessage", { roomId: "1" }, error);

      expect(onEnd).toHaveBeenCalledWith({ topic: "chat.onMessage", error });
    });

    it("should unsubscribe the listener", () => {
      const removed = vi.fn();
      socket.events.onListenerRemove(removed);
      const callback = vi.fn();
      createRoomListener().listen(callback, { payload: { roomId: "1" } });

      setup.server.end("chat.onMessage", { roomId: "1" });
      setup.server.push("chat.onMessage", { roomId: "1" }, { text: "late" });

      expect(callback).not.toHaveBeenCalled();
      expect(setup.subscriptions).toHaveLength(0);
      expect(socket.adapter.listeners.get("chat.onMessage")?.size ?? 0).toBe(0);
      expect(socket.adapter.listenerLifecycle.has("chat.onMessage")).toBeFalse();
      expect(removed).toHaveBeenCalledTimes(1);
    });

    it("should unsubscribe before onEnd runs", () => {
      let registered = -1;
      createRoomListener().listen(vi.fn(), {
        payload: { roomId: "1" },
        onEnd: () => {
          registered = socket.adapter.listeners.get("chat.onMessage")?.size ?? 0;
        },
      });

      setup.server.end("chat.onMessage", { roomId: "1" });

      expect(registered).toBe(0);
    });

    it("should do nothing when the returned unsubscribe runs after the end", () => {
      const removed = vi.fn();
      socket.events.onListenerRemove(removed);
      const stop = createRoomListener().listen(vi.fn(), { payload: { roomId: "1" } });

      setup.server.end("chat.onMessage", { roomId: "1" });
      stop();

      expect(removed).toHaveBeenCalledTimes(1);
    });

    it("should end only the subscription of the ended payload", () => {
      const roomOne = vi.fn();
      const roomTwo = vi.fn();
      const roomTwoData = vi.fn();
      createRoomListener().listen(vi.fn(), { payload: { roomId: "1" }, onEnd: roomOne });
      createRoomListener().listen(({ data }) => roomTwoData(data), { payload: { roomId: "2" }, onEnd: roomTwo });

      setup.server.end("chat.onMessage", { roomId: "1" });
      setup.server.push("chat.onMessage", { roomId: "2" }, { text: "still here" });

      expect(roomOne).toHaveBeenCalledTimes(1);
      expect(roomTwo).not.toHaveBeenCalled();
      expect(roomTwoData).toHaveBeenCalledWith({ text: "still here" });
    });

    it("should end every callback that shares the subscription", () => {
      const first = vi.fn();
      const second = vi.fn();
      const listener = createRoomListener().setPayload({ roomId: "1" });
      listener.listen(vi.fn(), { onEnd: first });
      listener.listen(vi.fn(), { onEnd: second });

      setup.server.end("chat.onMessage", { roomId: "1" });

      expect(first).toHaveBeenCalledTimes(1);
      expect(second).toHaveBeenCalledTimes(1);
      expect(setup.subscriptions).toHaveLength(0);
    });

    it("should not call onEnd when the listener unsubscribes itself", () => {
      const onEnd = vi.fn();
      const stop = createRoomListener().listen(vi.fn(), { payload: { roomId: "1" }, onEnd });

      stop();
      setup.server.end("chat.onMessage", { roomId: "1" });

      expect(onEnd).not.toHaveBeenCalled();
    });

    it("should allow to listen again from onEnd", () => {
      const listener = createRoomListener().setPayload({ roomId: "1" });
      const callback = vi.fn();
      listener.listen(vi.fn(), {
        onEnd: () => {
          listener.listen(callback);
        },
      });

      setup.server.end("chat.onMessage", { roomId: "1" });
      setup.server.push("chat.onMessage", { roomId: "1" }, { text: "again" });

      expect(setup.subscriptions).toHaveLength(1);
      expect(callback).toHaveBeenCalledWith({ data: { text: "again" }, extra: { subscription: '{"roomId":"1"}' } });
    });

    it("should report a throwing onEnd and still end the other callbacks", () => {
      const onError = vi.fn();
      socket.onError(onError);
      const failure = new Error("onEnd failed");
      const second = vi.fn();
      const listener = createRoomListener().setPayload({ roomId: "1" });
      listener.listen(vi.fn(), {
        onEnd: () => {
          throw failure;
        },
      });
      listener.listen(vi.fn(), { onEnd: second });

      setup.server.end("chat.onMessage", { roomId: "1" });

      expect(onError).toHaveBeenCalledWith({ error: failure });
      expect(second).toHaveBeenCalledTimes(1);
      expect(setup.subscriptions).toHaveLength(0);
    });

    it("should report a non-error thrown by onStart as an error", () => {
      const onError = vi.fn();
      socket.onError(onError);
      createRoomListener().listen(vi.fn(), {
        payload: { roomId: "1" },
        onStart: () => {
          // eslint-disable-next-line @typescript-eslint/only-throw-error
          throw "start failed";
        },
      });

      setup.server.start("chat.onMessage", { roomId: "1" });

      expect(onError).toHaveBeenCalledWith({ error: new Error("start failed") });
    });

    it("should remove a callback registered without a listener", () => {
      const callback = vi.fn();
      const listener = createRoomListener().setPayload({ roomId: "1" });
      socket.adapter.listen(listener, callback);

      setup.server.end("chat.onMessage", { roomId: "1" });

      expect(socket.adapter.listeners.get("chat.onMessage")?.size ?? 0).toBe(0);
    });

    it("should report the end to the socket events", () => {
      const all = vi.fn();
      const byTopic = vi.fn();
      const listener = createRoomListener();
      const error = new Error("Gone");
      socket.events.onListenerEnd(all);
      socket.events.onListenerEndByTopic(listener, byTopic);
      listener.listen(vi.fn(), { payload: { roomId: "1" } });

      setup.server.end("chat.onMessage", { roomId: "1" }, error);

      expect(all).toHaveBeenCalledWith({ topic: "chat.onMessage", error });
      expect(byTopic).toHaveBeenCalledWith({ topic: "chat.onMessage", error });
    });

    it("should default the error to null", () => {
      const all = vi.fn();
      socket.events.onListenerEnd(all);
      createRoomListener().listen(vi.fn(), { payload: { roomId: "1" } });

      setup.server.bindings().onListenerEnd({ topic: "chat.onMessage", callbacks: new Set() });

      expect(all).toHaveBeenCalledWith({ topic: "chat.onMessage", error: null });
    });
  });

  describe("When a delivery strategy holds messages at the end", () => {
    beforeEach(() => {
      vi.useFakeTimers();
    });

    it("should deliver the pending batch before onEnd", () => {
      const order: string[] = [];
      createRoomListener()
        .setDelivery({ strategy: "batch", interval: 100 })
        .listen(({ data }) => order.push(`data:${data.map((item) => item.text).join(",")}`), {
          payload: { roomId: "1" },
          onEnd: () => order.push("end"),
        });

      setup.server.push("chat.onMessage", { roomId: "1" }, { text: "a" });
      setup.server.push("chat.onMessage", { roomId: "1" }, { text: "b" });
      setup.server.end("chat.onMessage", { roomId: "1" });
      vi.advanceTimersByTime(200);

      expect(order).toStrictEqual(["data:a,b", "end"]);
    });

    it("should deliver the pending latest message before onEnd", () => {
      const order: string[] = [];
      createRoomListener()
        .setDelivery({ strategy: "latest", interval: 100 })
        .listen(({ data }) => order.push(`data:${data.text}`), {
          payload: { roomId: "1" },
          onEnd: () => order.push("end"),
        });

      setup.server.push("chat.onMessage", { roomId: "1" }, { text: "a" });
      setup.server.push("chat.onMessage", { roomId: "1" }, { text: "b" });
      setup.server.push("chat.onMessage", { roomId: "1" }, { text: "c" });
      setup.server.end("chat.onMessage", { roomId: "1" });
      vi.advanceTimersByTime(200);

      expect(order).toStrictEqual(["data:a", "data:c", "end"]);
    });

    it("should drop the pending messages of a strategy without flush", () => {
      const deliver = vi.fn();
      const strategy = createDeliveryStrategy<Message, Message>(({ deliver: send }) => {
        let pending: Parameters<typeof send>[0] | undefined;
        const timer = setInterval(() => {
          if (pending) {
            send(pending);
          }
        }, 100);
        return {
          push: (message) => {
            pending = message;
          },
          dispose: () => clearInterval(timer),
        };
      });
      const onEnd = vi.fn();
      createRoomListener()
        .setDelivery(strategy)
        .listen(({ data }) => deliver(data), { payload: { roomId: "1" }, onEnd });

      setup.server.push("chat.onMessage", { roomId: "1" }, { text: "a" });
      setup.server.end("chat.onMessage", { roomId: "1" });
      vi.advanceTimersByTime(200);

      expect(deliver).not.toHaveBeenCalled();
      expect(onEnd).toHaveBeenCalledTimes(1);
    });
  });
});
