import { ServerSentEventsAdapter } from "adapter-sse";
import { Socket } from "socket";

import {
  installControlledEventSource,
  openEventSource,
  uninstallControlledEventSource,
} from "../../utils/controlled-event-source";
import {
  ControlledWebSocket,
  flushPromises,
  installControlledWebSocket,
  openWebSocket,
  uninstallControlledWebSocket,
  waitForWebSocket,
} from "../../utils/controlled-websocket";

type ChatMessage = { text: string };

describe("Emitter [ Sending ]", () => {
  let socket: Socket;

  /** Collects everything a socket reports about failed emits */
  const trackFailures = (instance: Socket<any> = socket) => {
    const emitterErrors: { message: string; topic: string; payload: unknown }[] = [];
    const socketErrors: string[] = [];
    instance.events.onEmitterError(({ error, emitter }) => {
      emitterErrors.push({ message: error.message, topic: emitter.topic, payload: emitter.payload });
    });
    instance.onError(({ error }: { error: Error }) => socketErrors.push(error.message));
    return { emitterErrors, socketErrors };
  };

  beforeEach(() => {
    installControlledWebSocket();
  });

  afterEach(async () => {
    await socket?.disconnect();
    uninstallControlledWebSocket();
  });

  describe("When the connection is open", () => {
    let websocket: ControlledWebSocket;

    beforeEach(async () => {
      socket = new Socket({ url: "ws://emitter" });
      websocket = await openWebSocket();
    });

    it("should send the payload passed to emit", async () => {
      socket
        .createEmitter<ChatMessage>()({ topic: "chat" })
        .emit({ payload: { text: "hi" } });
      await flushPromises();

      expect(websocket.sentMessages).toStrictEqual([{ topic: "chat", data: { text: "hi" } }]);
    });

    it("should send the payload set on the emitter", async () => {
      socket.createEmitter<ChatMessage>()({ topic: "chat" }).setPayload({ text: "hi" }).emit();
      await flushPromises();

      expect(websocket.sentMessages).toStrictEqual([{ topic: "chat", data: { text: "hi" } }]);
    });

    it("should prefer the payload passed to emit over the one set on the emitter", async () => {
      socket
        .createEmitter<ChatMessage>()({ topic: "chat" })
        .setPayload({ text: "template" })
        .emit({ payload: { text: "override" } });
      await flushPromises();

      expect(websocket.sentMessages).toStrictEqual([{ topic: "chat", data: { text: "override" } }]);
    });

    it("should fill the topic params passed to emit", async () => {
      socket
        .createEmitter<ChatMessage>()({ topic: "rooms/:roomId/users/:userId" })
        .emit({ payload: { text: "hi" }, params: { roomId: 7, userId: "ann" } });
      await flushPromises();

      expect(websocket.sentMessages[0].topic).toBe("rooms/7/users/ann");
    });

    it.each([
      { name: "zero", payload: 0 },
      { name: "an empty string", payload: "" },
      { name: "false", payload: false },
      { name: "null", payload: null },
      { name: "an empty array", payload: [] },
    ])("should send $name as a payload", async ({ payload }) => {
      socket.createEmitter<unknown>()({ topic: "values" }).emit({ payload });
      await flushPromises();

      expect(websocket.sentMessages).toStrictEqual([{ topic: "values", data: payload }]);
    });

    it("should keep the order of many messages", async () => {
      const emitter = socket.createEmitter<number>()({ topic: "sequence" });

      for (let i = 0; i < 500; i += 1) {
        emitter.emit({ payload: i });
      }
      await flushPromises();

      expect(websocket.sentMessages.map((message) => message.data)).toStrictEqual(
        Array.from({ length: 500 }, (_, index) => index),
      );
    });

    it("should keep the order of messages emitted on different topics", async () => {
      const first = socket.createEmitter<number>()({ topic: "first" });
      const second = socket.createEmitter<number>()({ topic: "second" });

      first.emit({ payload: 1 });
      second.emit({ payload: 2 });
      first.emit({ payload: 3 });
      second.emit({ payload: 4 });
      await flushPromises();

      expect(websocket.sentMessages).toStrictEqual([
        { topic: "first", data: 1 },
        { topic: "second", data: 2 },
        { topic: "first", data: 3 },
        { topic: "second", data: 4 },
      ]);
    });

    it("should announce every sent message with the emitter start events", async () => {
      const emitter = socket.createEmitter<ChatMessage>()({ topic: "chat" });
      const global = vi.fn();
      const byTopic = vi.fn();
      const otherTopic = vi.fn();
      socket.events.onEmitterStartEvent(({ emitter: started }) => global(started.topic, started.payload));
      socket.events.onEmitterStartEventByTopic(emitter, ({ emitter: started }) => byTopic(started.payload));
      socket.events.onEmitterStartEventByTopic({ topic: "other" }, otherTopic);

      emitter.emit({ payload: { text: "hi" } });
      await flushPromises();

      expect(global).toHaveBeenCalledWith("chat", { text: "hi" });
      expect(byTopic).toHaveBeenCalledWith({ text: "hi" });
      expect(otherTopic).not.toHaveBeenCalled();
    });

    it("should not change the emitter used as a template", async () => {
      const emitter = socket.createEmitter<ChatMessage>()({ topic: "rooms/:roomId" });

      emitter.emit({ payload: { text: "hi" }, params: { roomId: 1 } });
      await flushPromises();

      expect(emitter.topic).toBe("rooms/:roomId");
      expect(emitter.payload).toBeUndefined();
      expect(emitter.params).toBeUndefined();
    });
  });

  describe("When mapping the payload", () => {
    let websocket: ControlledWebSocket;

    beforeEach(async () => {
      socket = new Socket({ url: "ws://emitter" });
      websocket = await openWebSocket();
    });

    it("should send the mapped payload", async () => {
      socket
        .createEmitter<ChatMessage>()({ topic: "chat" })
        .setPayloadMapper((payload) => ({ ...payload, version: 2 }))
        .emit({ payload: { text: "hi" } });
      await flushPromises();

      expect(websocket.sentMessages).toStrictEqual([{ topic: "chat", data: { text: "hi", version: 2 } }]);
    });

    it("should wait for an async payload mapper", async () => {
      socket
        .createEmitter<ChatMessage>()({ topic: "chat" })
        .setPayloadMapper(async (payload) => ({ ...payload, signed: true }))
        .emit({ payload: { text: "hi" } });
      await flushPromises();

      expect(websocket.sentMessages).toStrictEqual([{ topic: "chat", data: { text: "hi", signed: true } }]);
    });

    it("should keep the mapper on clones created by the emitter methods", async () => {
      socket
        .createEmitter<ChatMessage>()({ topic: "rooms/:roomId" })
        .setPayloadMapper((payload) => ({ ...payload, mapped: true }))
        .setParams({ roomId: 1 })
        .setPayload({ text: "hi" })
        .emit();
      await flushPromises();

      expect(websocket.sentMessages).toStrictEqual([{ topic: "rooms/1", data: { text: "hi", mapped: true } }]);
    });

    it("should map the payload once per emit", async () => {
      const mapper = vi.fn((payload: ChatMessage) => ({ ...payload, mapped: true }));
      const emitter = socket.createEmitter<ChatMessage>()({ topic: "chat" }).setPayloadMapper(mapper);

      emitter.emit({ payload: { text: "one" } });
      emitter.emit({ payload: { text: "two" } });
      await flushPromises();

      expect(mapper).toHaveBeenCalledTimes(2);
      expect(websocket.sentMessages.map((message) => message.data)).toStrictEqual([
        { text: "one", mapped: true },
        { text: "two", mapped: true },
      ]);
    });

    it("should report a throwing payload mapper and send nothing", async () => {
      const { emitterErrors, socketErrors } = trackFailures();

      socket
        .createEmitter<ChatMessage>()({ topic: "chat" })
        .setPayloadMapper(() => {
          throw new Error("Cannot serialize");
        })
        .emit({ payload: { text: "hi" } });
      await flushPromises();

      expect(websocket.sent).toStrictEqual([]);
      expect(emitterErrors).toStrictEqual([{ message: "Cannot serialize", topic: "chat", payload: { text: "hi" } }]);
      expect(socketErrors).toStrictEqual(["Cannot serialize"]);
    });

    it("should report a rejecting payload mapper and send nothing", async () => {
      const { emitterErrors } = trackFailures();

      socket
        .createEmitter<ChatMessage>()({ topic: "chat" })
        .setPayloadMapper(async () => {
          throw new Error("Cannot sign");
        })
        .emit({ payload: { text: "hi" } });
      await flushPromises();

      expect(websocket.sent).toStrictEqual([]);
      expect(emitterErrors.map((failure) => failure.message)).toStrictEqual(["Cannot sign"]);
    });
  });

  describe("When the connection is not open", () => {
    it("should drop the message and report it when the socket never connected", async () => {
      socket = new Socket({ url: "ws://emitter", adapterOptions: { autoConnect: false } });
      const { emitterErrors, socketErrors } = trackFailures();
      const started = vi.fn();
      socket.events.onEmitterStartEvent(started);

      socket
        .createEmitter<ChatMessage>()({ topic: "chat" })
        .emit({ payload: { text: "hi" } });
      await flushPromises();

      expect(emitterErrors).toStrictEqual([
        { message: "Cannot emit event when connection is not open", topic: "chat", payload: { text: "hi" } },
      ]);
      expect(socketErrors).toStrictEqual([]);
      expect(started).not.toHaveBeenCalled();
      expect(ControlledWebSocket.instances).toHaveLength(0);
    });

    it("should drop the message and report it while the socket is connecting", async () => {
      socket = new Socket({ url: "ws://emitter" });
      const websocket = await waitForWebSocket();
      const { emitterErrors } = trackFailures();

      socket
        .createEmitter<ChatMessage>()({ topic: "chat" })
        .emit({ payload: { text: "hi" } });
      await flushPromises();
      websocket.serverOpen();
      await flushPromises();

      expect(websocket.sent).toStrictEqual([]);
      expect(emitterErrors.map((failure) => failure.message)).toStrictEqual([
        "Cannot emit event when connection is not open",
      ]);
    });

    it("should drop the message and report it after a disconnect", async () => {
      socket = new Socket({ url: "ws://emitter" });
      const websocket = await openWebSocket();
      await socket.disconnect();
      const { emitterErrors } = trackFailures();

      socket
        .createEmitter<ChatMessage>()({ topic: "chat" })
        .emit({ payload: { text: "hi" } });
      await flushPromises();

      expect(websocket.sent).toStrictEqual([]);
      expect(emitterErrors).toHaveLength(1);
    });

    it("should report the dropped message only to the subscribers of its topic", async () => {
      socket = new Socket({ url: "ws://emitter", adapterOptions: { autoConnect: false } });
      const emitter = socket.createEmitter<ChatMessage>()({ topic: "chat" });
      const sameTopic = vi.fn();
      const otherTopic = vi.fn();
      socket.events.onEmitterErrorByTopic(emitter, sameTopic);
      socket.events.onEmitterErrorByTopic({ topic: "other" }, otherTopic);

      emitter.emit({ payload: { text: "hi" } });
      await flushPromises();

      expect(sameTopic).toHaveBeenCalledTimes(1);
      expect(otherTopic).not.toHaveBeenCalled();
    });

    it("should not run the payload mapper or the interceptors for a dropped message", async () => {
      const mapper = vi.fn((payload: ChatMessage) => payload);
      const interceptor = vi.fn(({ emitter }) => emitter);
      socket = new Socket({ url: "ws://emitter", adapterOptions: { autoConnect: false } }).onSend(interceptor);

      socket
        .createEmitter<ChatMessage>()({ topic: "chat" })
        .setPayloadMapper(mapper)
        .emit({ payload: { text: "hi" } });
      await flushPromises();

      expect(mapper).not.toHaveBeenCalled();
      expect(interceptor).not.toHaveBeenCalled();
    });

    it("should not send dropped messages once the connection opens", async () => {
      socket = new Socket({ url: "ws://emitter", adapterOptions: { autoConnect: false } });
      const emitter = socket.createEmitter<ChatMessage>()({ topic: "chat" });
      trackFailures();

      emitter.emit({ payload: { text: "too early" } });
      const connecting = socket.connect();
      const websocket = await openWebSocket();
      await connecting;
      emitter.emit({ payload: { text: "on time" } });
      await flushPromises();

      expect(websocket.sentMessages).toStrictEqual([{ topic: "chat", data: { text: "on time" } }]);
    });

    it("should send again after reconnecting", async () => {
      socket = new Socket({ url: "ws://emitter" });
      await openWebSocket();
      const emitter = socket.createEmitter<ChatMessage>()({ topic: "chat" });

      const reconnecting = socket.reconnect();
      const next = await openWebSocket(2);
      await reconnecting;
      emitter.emit({ payload: { text: "back" } });
      await flushPromises();

      expect(next.sentMessages).toStrictEqual([{ topic: "chat", data: { text: "back" } }]);
    });
  });

  describe("When the transport cannot send the message", () => {
    it("should report an encoder failure for the emitter and the socket", async () => {
      socket = new Socket({
        url: "ws://emitter",
        adapterOptions: {
          encode: () => {
            throw new Error("Cannot encode");
          },
        },
      });
      const websocket = await openWebSocket();
      const { emitterErrors, socketErrors } = trackFailures();

      socket
        .createEmitter<ChatMessage>()({ topic: "chat" })
        .emit({ payload: { text: "hi" } });
      await flushPromises();

      expect(websocket.sent).toStrictEqual([]);
      expect(emitterErrors.map((failure) => failure.message)).toStrictEqual(["Cannot encode"]);
      expect(socketErrors).toStrictEqual(["Cannot encode"]);
    });

    it("should report a payload that cannot be serialized", async () => {
      socket = new Socket({ url: "ws://emitter" });
      const websocket = await openWebSocket();
      const { emitterErrors } = trackFailures();
      const circular: Record<string, unknown> = {};
      circular.self = circular;

      socket.createEmitter<unknown>()({ topic: "chat" }).emit({ payload: circular });
      await flushPromises();

      expect(websocket.sent).toStrictEqual([]);
      expect(emitterErrors).toHaveLength(1);
      expect(socket.adapter.connected).toBeTrue();
    });

    it("should report a transport that throws on send", async () => {
      socket = new Socket({ url: "ws://emitter" });
      const websocket = await openWebSocket();
      const { emitterErrors, socketErrors } = trackFailures();
      websocket.send = () => {
        throw new Error("Buffer is full");
      };

      socket
        .createEmitter<ChatMessage>()({ topic: "chat" })
        .emit({ payload: { text: "hi" } });
      await flushPromises();

      expect(emitterErrors.map((failure) => failure.message)).toStrictEqual(["Buffer is full"]);
      expect(socketErrors).toStrictEqual(["Buffer is full"]);
    });

    it("should keep sending the next messages after a failure", async () => {
      socket = new Socket({
        url: "ws://emitter",
        adapterOptions: {
          encode: ({ topic, payload }) => {
            if (payload === "bad") {
              throw new Error("Cannot encode");
            }
            return JSON.stringify({ topic, data: payload });
          },
        },
      });
      const websocket = await openWebSocket();
      trackFailures();
      const emitter = socket.createEmitter<string>()({ topic: "chat" });

      emitter.emit({ payload: "good" });
      emitter.emit({ payload: "bad" });
      emitter.emit({ payload: "good again" });
      await flushPromises();

      expect(websocket.sentMessages.map((message) => message.data)).toStrictEqual(["good", "good again"]);
    });
  });

  describe("When the adapter cannot emit at all", () => {
    afterEach(() => {
      uninstallControlledEventSource();
    });

    it("should throw from emit on a Server-Sent Events socket", async () => {
      installControlledEventSource();
      const sseSocket = new Socket({ url: "http://emitter", adapter: ServerSentEventsAdapter });
      await openEventSource();

      expect(() =>
        sseSocket
          .createEmitter<ChatMessage>()({ topic: "chat" })
          .emit({ payload: { text: "hi" } }),
      ).toThrow("Cannot emit events in SSE adapter");
      await sseSocket.disconnect();
    });

    it("should report the rejection of a custom adapter instead of leaving it unhandled", async () => {
      socket = new Socket({ url: "ws://emitter" });
      await openWebSocket();
      const { emitterErrors, socketErrors } = trackFailures();
      socket.adapter.emit = async () => {
        throw new Error("Cannot emit from this adapter");
      };

      expect(() =>
        socket
          .createEmitter<ChatMessage>()({ topic: "chat" })
          .emit({ payload: { text: "hi" } }),
      ).not.toThrow();
      await flushPromises();

      expect(emitterErrors).toStrictEqual([
        { message: "Cannot emit from this adapter", topic: "chat", payload: { text: "hi" } },
      ]);
      expect(socketErrors).toStrictEqual(["Cannot emit from this adapter"]);
    });

    it("should wrap a non-error rejection of a custom adapter", async () => {
      socket = new Socket({ url: "ws://emitter" });
      await openWebSocket();
      const { emitterErrors } = trackFailures();
      // eslint-disable-next-line prefer-promise-reject-errors
      socket.adapter.emit = () => Promise.reject("plain text failure");

      socket
        .createEmitter<ChatMessage>()({ topic: "chat" })
        .emit({ payload: { text: "hi" } });
      await flushPromises();

      expect(emitterErrors.map((failure) => failure.message)).toStrictEqual(["plain text failure"]);
    });
  });
});
