import { SocketAdapter } from "adapter";
import type { ListenerCallbackType, ListenerModel, ListenerOfAdapter } from "listener";
import { createSocketSdk } from "sdk";
import { Socket } from "socket";

type Message = { text: string };
type RoomInput = { roomId: string };

type Subscription = {
  listener: ListenerOfAdapter<any>;
  callback: ListenerCallbackType<any, any>;
};

/**
 * Adapter that keeps one server subscription per (topic, payload) - the same shape tRPC and oRPC adapters use.
 * `serverPush` delivers a message to the callbacks of one subscription only.
 */
const createPayloadAdapter = () => {
  const subscriptions: Subscription[] = [];
  let onEvent: ((event: Parameters<Bindings["onEvent"]>[0]) => void) | undefined;

  const adapter = new SocketAdapter<{ subscription: string }>({ name: "payload-test", defaultConnected: true });
  type Bindings = Parameters<Parameters<typeof adapter.setConnector>[0]>[0];
  adapter.setConnector((connectorBindings) => {
    ({ onEvent } = connectorBindings);
    const { onListen } = connectorBindings;
    return {
      connect: () => {},
      reconnect: () => {},
      disconnect: () => {},
      emit: () => {},
      listen: (listener, callback) => {
        const subscription = { listener, callback };
        subscriptions.push(subscription);
        return onListen({
          listener,
          callback,
          onUnmount: () => subscriptions.splice(subscriptions.indexOf(subscription), 1),
        });
      },
    };
  });

  const serverPush = (topic: string, payload: unknown, data: unknown) => {
    const key = JSON.stringify(payload);
    const callbacks = new Set(
      subscriptions
        .filter((sub) => sub.listener.topic === topic && JSON.stringify(sub.listener.payload) === key)
        .map((sub) => sub.callback),
    );
    onEvent?.({ topic, data, extra: { subscription: key }, callbacks });
  };

  return { adapter, subscriptions, serverPush };
};

describe("Listener [ Payload ]", () => {
  let setup: ReturnType<typeof createPayloadAdapter>;
  let socket: Socket<SocketAdapter<{ subscription: string }>>;

  beforeEach(() => {
    setup = createPayloadAdapter();
    socket = new Socket({ url: "ws://payload", adapter: setup.adapter });
  });

  describe("When setting the payload", () => {
    it("should start without a payload", () => {
      const listener = socket.createListener<Message, RoomInput>()({ topic: "chat.onMessage" });
      expect(listener.payload).toBeUndefined();
    });

    it("should return a clone with the payload", () => {
      const listener = socket.createListener<Message, RoomInput>()({ topic: "chat.onMessage" });
      const withPayload = listener.setPayload({ roomId: "1" });

      expect(withPayload).not.toBe(listener);
      expect(withPayload.payload).toStrictEqual({ roomId: "1" });
      expect(listener.payload).toBeUndefined();
    });

    it("should replace the payload when it is set again", () => {
      const listener = socket.createListener<Message, RoomInput>()({ topic: "chat.onMessage" });
      const first = listener.setPayload({ roomId: "1" });
      const second = first.setPayload({ roomId: "2" });

      expect(first.payload).toStrictEqual({ roomId: "1" });
      expect(second.payload).toStrictEqual({ roomId: "2" });
    });

    it("should keep the payload through other setters", () => {
      const listener = socket
        .createListener<Message, RoomInput>()({ topic: "rooms/:org/onMessage" })
        .setPayload({ roomId: "1" })
        .setParams({ org: "acme" })
        .setOptions(undefined)
        .setDelivery({ strategy: "latest", interval: 10 });

      expect(listener.payload).toStrictEqual({ roomId: "1" });
      expect(listener.topic).toBe("rooms/acme/onMessage");
    });

    it("should keep falsy payloads", () => {
      const listener = socket.createListener<Message, number | string | boolean>()({ topic: "numbers" });

      expect(listener.setPayload(0).payload).toBe(0);
      expect(listener.setPayload("").payload).toBe("");
      expect(listener.setPayload(false).payload).toBe(false);
    });
  });

  describe("When listening", () => {
    it("should pass the payload to the adapter", () => {
      const listener = socket.createListener<Message, RoomInput>()({ topic: "chat.onMessage" });
      listener.setPayload({ roomId: "1" }).listen(() => {});

      expect(setup.subscriptions).toHaveLength(1);
      expect(setup.subscriptions[0].listener.payload).toStrictEqual({ roomId: "1" });
      expect(setup.subscriptions[0].listener.topic).toBe("chat.onMessage");
    });

    it("should subscribe with the payload passed to listen and leave the listener unchanged", () => {
      const listener = socket.createListener<Message, RoomInput>()({ topic: "chat.onMessage" });
      listener.listen(() => {}, { payload: { roomId: "7" } });

      expect(setup.subscriptions[0].listener.payload).toStrictEqual({ roomId: "7" });
      expect(listener.payload).toBeUndefined();
    });

    it("should prefer the payload passed to listen over the one set before", () => {
      const listener = socket.createListener<Message, RoomInput>()({ topic: "chat.onMessage" }).setPayload({
        roomId: "1",
      });
      listener.listen(() => {}, { payload: { roomId: "2" } });

      expect(setup.subscriptions[0].listener.payload).toStrictEqual({ roomId: "2" });
    });

    it("should unsubscribe the listener started with the listen payload", () => {
      const listener = socket.createListener<Message, RoomInput>()({ topic: "chat.onMessage" });
      const stop = listener.listen(() => {}, { payload: { roomId: "7" } });

      stop();

      expect(setup.subscriptions).toHaveLength(0);
      expect(socket.adapter.listeners.get("chat.onMessage")?.size ?? 0).toBe(0);
    });
  });

  describe("When subscriptions of one topic have different payloads", () => {
    it("should deliver every message only to its own subscription", () => {
      const listener = socket.createListener<Message, RoomInput>()({ topic: "chat.onMessage" });
      const roomOne = vi.fn();
      const roomTwo = vi.fn();
      listener.setPayload({ roomId: "1" }).listen(({ data }) => roomOne(data));
      listener.setPayload({ roomId: "2" }).listen(({ data }) => roomTwo(data));

      setup.serverPush("chat.onMessage", { roomId: "1" }, { text: "one" });
      setup.serverPush("chat.onMessage", { roomId: "2" }, { text: "two" });

      expect(roomOne).toHaveBeenCalledTimes(1);
      expect(roomOne).toHaveBeenCalledWith({ text: "one" });
      expect(roomTwo).toHaveBeenCalledTimes(1);
      expect(roomTwo).toHaveBeenCalledWith({ text: "two" });
    });

    it("should deliver to every callback that shares the payload", () => {
      const listener = socket.createListener<Message, RoomInput>()({ topic: "chat.onMessage" });
      const first = vi.fn();
      const second = vi.fn();
      const other = vi.fn();
      listener.setPayload({ roomId: "1" }).listen(first);
      listener.setPayload({ roomId: "1" }).listen(second);
      listener.setPayload({ roomId: "2" }).listen(other);

      setup.serverPush("chat.onMessage", { roomId: "1" }, { text: "one" });

      expect(first).toHaveBeenCalledTimes(1);
      expect(second).toHaveBeenCalledTimes(1);
      expect(other).not.toHaveBeenCalled();
    });

    it("should run the message interceptors for targeted messages", () => {
      socket.onMessage<Message>(({ event }) => ({ text: `${event.text}!` }));
      const callback = vi.fn();
      socket
        .createListener<Message, RoomInput>()({ topic: "chat.onMessage" })
        .setPayload({ roomId: "1" })
        .listen(({ data }) => callback(data));

      setup.serverPush("chat.onMessage", { roomId: "1" }, { text: "one" });

      expect(callback).toHaveBeenCalledWith({ text: "one!" });
    });

    it("should report targeted messages to the socket listener events", () => {
      const spy = vi.fn();
      socket.events.onListenerEvent(spy);
      socket
        .createListener<Message, RoomInput>()({ topic: "chat.onMessage" })
        .setPayload({ roomId: "1" })
        .listen(vi.fn());

      setup.serverPush("chat.onMessage", { roomId: "1" }, { text: "one" });

      expect(spy).toHaveBeenCalledWith(
        expect.objectContaining({
          topic: "chat.onMessage",
          data: { text: "one" },
          extra: { subscription: '{"roomId":"1"}' },
        }),
      );
    });

    it("should deliver nothing when no callback matches", () => {
      const callback = vi.fn();
      socket
        .createListener<Message, RoomInput>()({ topic: "chat.onMessage" })
        .setPayload({ roomId: "1" })
        .listen(callback);

      setup.serverPush("chat.onMessage", { roomId: "3" }, { text: "three" });

      expect(callback).not.toHaveBeenCalled();
    });

    it("should deliver to the delivery strategy of the subscription", () => {
      vi.useFakeTimers();
      const callback = vi.fn();
      socket
        .createListener<Message, RoomInput>()({ topic: "chat.onMessage" })
        .setDelivery({ strategy: "batch", interval: 50 })
        .setPayload({ roomId: "1" })
        .listen(({ data }) => callback(data));

      setup.serverPush("chat.onMessage", { roomId: "1" }, { text: "a" });
      setup.serverPush("chat.onMessage", { roomId: "2" }, { text: "other" });
      setup.serverPush("chat.onMessage", { roomId: "1" }, { text: "b" });
      vi.advanceTimersByTime(50);

      expect(callback).toHaveBeenCalledTimes(1);
      expect(callback).toHaveBeenCalledWith([{ text: "a" }, { text: "b" }]);
      vi.useRealTimers();
    });
  });

  describe("When one callback listens more than once", () => {
    it("should keep a separate subscription for every payload", () => {
      const listener = socket.createListener<Message, RoomInput>()({ topic: "chat.onMessage" });
      const callback = vi.fn();
      const stopFirst = listener.setPayload({ roomId: "1" }).listen(callback);
      listener.setPayload({ roomId: "2" }).listen(callback);

      expect(setup.subscriptions.map((sub) => sub.listener.payload)).toStrictEqual([{ roomId: "1" }, { roomId: "2" }]);

      stopFirst();

      expect(setup.subscriptions.map((sub) => sub.listener.payload)).toStrictEqual([{ roomId: "2" }]);
      setup.serverPush("chat.onMessage", { roomId: "2" }, { text: "two" });
      expect(callback).toHaveBeenCalledTimes(1);
    });

    it("should stop only the subscription of the returned unsubscribe", () => {
      const listener = socket.createListener<Message>()({ topic: "news" });
      const callback = vi.fn();
      const stopFirst = listener.listen(callback);
      const stopSecond = listener.listen(callback);

      socket.adapter.triggerListeners({ topic: "news", data: { text: "a" }, extra: { subscription: "" } });
      expect(callback).toHaveBeenCalledTimes(2);

      stopFirst();
      socket.adapter.triggerListeners({ topic: "news", data: { text: "b" }, extra: { subscription: "" } });
      expect(callback).toHaveBeenCalledTimes(3);

      stopSecond();
      expect(socket.adapter.listeners.get("news")?.size ?? 0).toBe(0);
    });
  });

  describe("When triggering listeners directly", () => {
    it("should call every callback of the topic without the callbacks filter", () => {
      const first = vi.fn();
      const second = vi.fn();
      socket.createListener<Message>()({ topic: "news" }).listen(first);
      socket.createListener<Message>()({ topic: "news" }).listen(second);

      socket.adapter.triggerListeners({ topic: "news", data: { text: "hi" }, extra: { subscription: "" } });

      expect(first).toHaveBeenCalledTimes(1);
      expect(second).toHaveBeenCalledTimes(1);
    });

    it("should call only the given callbacks with the callbacks filter", () => {
      const first = vi.fn();
      const second = vi.fn();
      socket.createListener<Message>()({ topic: "news" }).listen(first);
      socket.createListener<Message>()({ topic: "news" }).listen(second);

      socket.adapter.triggerListeners({
        topic: "news",
        data: { text: "hi" },
        extra: { subscription: "" },
        callbacks: new Set([second]),
      });

      expect(first).not.toHaveBeenCalled();
      expect(second).toHaveBeenCalledTimes(1);
    });

    it("should skip a filtered callback that is not registered on the topic", () => {
      const registered = vi.fn();
      const stranger = vi.fn();
      socket.createListener<Message>()({ topic: "news" }).listen(registered);

      socket.adapter.triggerListeners({
        topic: "news",
        data: { text: "hi" },
        extra: { subscription: "" },
        callbacks: new Set([stranger]),
      });

      expect(registered).not.toHaveBeenCalled();
      expect(stranger).not.toHaveBeenCalled();
    });
  });

  describe("When using the socket sdk", () => {
    type Schema = {
      chat: {
        onMessage: {
          $listener: ListenerModel<{ response: Message; payload: RoomInput; topic: "chat/onMessage" }>;
        };
      };
    };

    it("should create listeners that take the payload", () => {
      const sdk = createSocketSdk<typeof socket, Schema>(socket, { camelCaseToKebabCase: false });
      const callback = vi.fn();
      sdk.chat.onMessage.$listener.setPayload({ roomId: "1" }).listen(({ data }) => callback(data));

      expect(setup.subscriptions[0].listener.payload).toStrictEqual({ roomId: "1" });
      setup.serverPush("chat/onMessage", { roomId: "1" }, { text: "one" });
      expect(callback).toHaveBeenCalledWith({ text: "one" });
    });

    it("should type the sdk listener payload", () => {
      const sdk = createSocketSdk<typeof socket, Schema>(socket, { camelCaseToKebabCase: false });
      expectTypeOf(sdk.chat.onMessage.$listener.setPayload).parameter(0).toEqualTypeOf<RoomInput>();
      // @ts-expect-error payload is required
      sdk.chat.onMessage.$listener.listen(() => {});
      expect(true).toBeTrue();
    });
  });
});
