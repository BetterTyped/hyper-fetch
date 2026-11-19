import { Socket } from "socket";

import {
  ControlledWebSocket,
  flushPromises,
  installControlledWebSocket,
  openWebSocket,
  uninstallControlledWebSocket,
} from "../../utils/controlled-websocket";

type Message = { value: number; seenBy?: string[] };

describe("Socket [ Interceptors ]", () => {
  let socket: Socket;

  const connect = async () => {
    socket = new Socket({ url: "ws://interceptors" });
    return openWebSocket();
  };

  beforeEach(() => {
    installControlledWebSocket();
  });

  afterEach(async () => {
    await socket?.disconnect();
    uninstallControlledWebSocket();
  });

  describe("When intercepting incoming messages with onMessage", () => {
    it("should deliver the data returned by the interceptor to the listeners", async () => {
      const websocket = await connect();
      socket.onMessage<Message>(({ event }) => ({ ...event, value: event.value * 2 }));
      const spy = vi.fn();
      socket
        .createListener<Message>()({ topic: "numbers" })
        .listen(({ data }) => spy(data));

      websocket.serverEmit("numbers", { value: 21 });

      expect(spy).toHaveBeenCalledTimes(1);
      expect(spy).toHaveBeenCalledWith({ value: 42 });
    });

    it("should keep the message untouched when the interceptor returns it as is", async () => {
      const websocket = await connect();
      socket.onMessage(({ event }) => event);
      const spy = vi.fn();
      socket
        .createListener<Message>()({ topic: "numbers" })
        .listen(({ data }) => spy(data));

      websocket.serverEmit("numbers", { value: 1 });

      expect(spy).toHaveBeenCalledWith({ value: 1 });
    });

    it("should keep the original MessageEvent as extra", async () => {
      const websocket = await connect();
      socket.onMessage(({ event }) => event);
      const extras: MessageEvent[] = [];
      socket
        .createListener<Message>()({ topic: "numbers" })
        .listen(({ extra }) => extras.push(extra));

      websocket.serverEmit("numbers", { value: 1 });

      expect(extras).toHaveLength(1);
      expect(extras[0]).toBeInstanceOf(MessageEvent);
      expect(JSON.parse(extras[0].data)).toStrictEqual({ topic: "numbers", data: { value: 1 } });
    });

    it("should pass the result of every interceptor to the next one", async () => {
      const websocket = await connect();
      socket
        .onMessage<Message>(({ event }) => ({ ...event, seenBy: [...(event.seenBy ?? []), "first"] }))
        .onMessage<Message>(({ event }) => ({ ...event, seenBy: [...(event.seenBy ?? []), "second"] }))
        .onMessage<Message>(({ event }) => ({ ...event, seenBy: [...(event.seenBy ?? []), "third"] }));
      const spy = vi.fn();
      socket
        .createListener<Message>()({ topic: "numbers" })
        .listen(({ data }) => spy(data));

      websocket.serverEmit("numbers", { value: 1 });

      expect(spy).toHaveBeenCalledWith({ value: 1, seenBy: ["first", "second", "third"] });
    });

    it("should run the interceptors once per message, not once per listener", async () => {
      const websocket = await connect();
      const interceptor = vi.fn(({ event }) => event);
      socket.onMessage(interceptor);
      const listener = socket.createListener<Message>()({ topic: "numbers" });
      listener.listen(() => null);
      listener.listen(() => null);
      listener.listen(() => null);

      websocket.serverEmit("numbers", { value: 1 });

      expect(interceptor).toHaveBeenCalledTimes(1);
    });

    it("should run the interceptors for messages without any listener", async () => {
      const websocket = await connect();
      const interceptor = vi.fn(({ event }) => event);
      socket.onMessage(interceptor);

      websocket.serverEmit("nobody-listens", { value: 1 });

      expect(interceptor).toHaveBeenCalledWith({ event: { value: 1 } });
    });

    it("should pass the intercepted data to the socket events", async () => {
      const websocket = await connect();
      socket.onMessage<Message>(({ event }) => ({ ...event, value: event.value + 1 }));
      const global = vi.fn();
      const byTopic = vi.fn();
      const listener = socket.createListener<Message>()({ topic: "numbers" });
      socket.events.onListenerEvent(global);
      socket.events.onListenerEventByTopic(listener, byTopic);

      websocket.serverEmit("numbers", { value: 1 });

      expect(global).toHaveBeenCalledWith(expect.objectContaining({ topic: "numbers", data: { value: 2 } }));
      expect(byTopic).toHaveBeenCalledWith(expect.objectContaining({ topic: "numbers", data: { value: 2 } }));
      expect(global.mock.calls[0][0].extra).toBeInstanceOf(MessageEvent);
    });

    it.each([
      { name: "zero", data: 0 },
      { name: "an empty string", data: "" },
      { name: "false", data: false },
      { name: "null", data: null },
    ])("should deliver $name passed through an interceptor", async ({ data }) => {
      const websocket = await connect();
      socket.onMessage(({ event }) => event);
      const spy = vi.fn();
      socket
        .createListener<unknown>()({ topic: "falsy" })
        .listen(({ data: received }) => spy(received));

      websocket.serverEmit("falsy", data);

      expect(spy).toHaveBeenCalledTimes(1);
      expect(spy).toHaveBeenCalledWith(data);
    });

    it("should report an interceptor that drops the data and skip the message", async () => {
      const websocket = await connect();
      const errors: Error[] = [];
      socket.onError<Error>(({ error }) => errors.push(error));
      socket.onMessage(() => undefined as any);
      const spy = vi.fn();
      socket.createListener<Message>()({ topic: "numbers" }).listen(spy);

      websocket.serverEmit("numbers", { value: 1 });

      expect(spy).not.toHaveBeenCalled();
      expect(errors.map((error) => error.message)).toStrictEqual(["Listener modifier must return data"]);
      expect(socket.adapter.connected).toBeTrue();
    });

    it("should report a throwing interceptor and keep receiving the next messages", async () => {
      const websocket = await connect();
      const errors: Error[] = [];
      socket.onError<Error>(({ error }) => errors.push(error));
      socket.onMessage<Message>(({ event }) => {
        if (event.value === 1) {
          throw new Error("Cannot map the message");
        }
        return event;
      });
      const spy = vi.fn();
      socket
        .createListener<Message>()({ topic: "numbers" })
        .listen(({ data }) => spy(data));

      websocket.serverEmit("numbers", { value: 1 });
      websocket.serverEmit("numbers", { value: 2 });

      expect(errors.map((error) => error.message)).toStrictEqual(["Cannot map the message"]);
      expect(spy).toHaveBeenCalledTimes(1);
      expect(spy).toHaveBeenCalledWith({ value: 2 });
    });

    it("should not share interceptors between sockets", async () => {
      const websocket = await connect();
      const other = new Socket({ url: "ws://other" });
      const otherWebsocket = await openWebSocket(2);
      socket.onMessage<Message>(({ event }) => ({ ...event, value: 100 }));
      const spy = vi.fn();
      const otherSpy = vi.fn();
      socket
        .createListener<Message>()({ topic: "numbers" })
        .listen(({ data }) => spy(data));
      other
        .createListener<Message>()({ topic: "numbers" })
        .listen(({ data }) => otherSpy(data));

      websocket.serverEmit("numbers", { value: 1 });
      otherWebsocket.serverEmit("numbers", { value: 1 });

      expect(spy).toHaveBeenCalledWith({ value: 100 });
      expect(otherSpy).toHaveBeenCalledWith({ value: 1 });
      await other.disconnect();
    });
  });

  describe("When intercepting outgoing messages with onSend", () => {
    it("should send the emitter returned by the interceptor", async () => {
      const websocket = await connect();
      socket.onSend(({ emitter }) => emitter.setPayload({ ...emitter.payload, token: "secret" }));

      socket
        .createEmitter<{ text: string }>()({ topic: "chat" })
        .emit({ payload: { text: "hi" } });
      await flushPromises();

      expect(websocket.sentMessages).toStrictEqual([{ topic: "chat", data: { text: "hi", token: "secret" } }]);
    });

    it("should pass the result of every interceptor to the next one", async () => {
      const websocket = await connect();
      socket
        .onSend(({ emitter }) => emitter.setPayload({ ...emitter.payload, first: true }))
        .onSend(({ emitter }) => emitter.setPayload({ ...emitter.payload, second: true }))
        .onSend(({ emitter }) => emitter.setPayload({ ...emitter.payload, third: true }));

      socket
        .createEmitter<{ text: string }>()({ topic: "chat" })
        .emit({ payload: { text: "hi" } });
      await flushPromises();

      expect(websocket.sentMessages).toStrictEqual([
        { topic: "chat", data: { text: "hi", first: true, second: true, third: true } },
      ]);
    });

    it("should run the payload mapper before the interceptors", async () => {
      const websocket = await connect();
      const seen = vi.fn();
      socket.onSend(({ emitter }) => {
        seen(emitter.payload);
        return emitter;
      });

      socket
        .createEmitter<{ text: string }>()({ topic: "chat" })
        .setPayloadMapper((payload) => ({ ...payload, mapped: true }))
        .emit({ payload: { text: "hi" } });
      await flushPromises();

      expect(seen).toHaveBeenCalledWith({ text: "hi", mapped: true });
      expect(websocket.sentMessages).toStrictEqual([{ topic: "chat", data: { text: "hi", mapped: true } }]);
    });

    it("should announce the intercepted emitter in the emitter start event", async () => {
      await connect();
      socket.onSend(({ emitter }) => emitter.setPayload({ ...emitter.payload, token: "secret" }));
      const started = vi.fn();
      socket.events.onEmitterStartEvent(({ emitter }) => started(emitter.payload));

      socket
        .createEmitter<{ text: string }>()({ topic: "chat" })
        .emit({ payload: { text: "hi" } });
      await flushPromises();

      expect(started).toHaveBeenCalledWith({ text: "hi", token: "secret" });
    });

    it("should not leak interceptor changes into the emitter template", async () => {
      await connect();
      socket.onSend(({ emitter }) => emitter.setPayload({ ...emitter.payload, token: "secret" }));
      const emitter = socket.createEmitter<{ text: string }>()({ topic: "chat" }).setPayload({ text: "hi" });

      emitter.emit();
      emitter.emit();
      await flushPromises();

      expect(emitter.payload).toStrictEqual({ text: "hi" });
      expect(ControlledWebSocket.last.sentMessages).toStrictEqual([
        { topic: "chat", data: { text: "hi", token: "secret" } },
        { topic: "chat", data: { text: "hi", token: "secret" } },
      ]);
    });

    it("should report a throwing interceptor instead of leaving an unhandled rejection", async () => {
      const websocket = await connect();
      const errors: Error[] = [];
      const emitterErrors = vi.fn();
      socket.onError<Error>(({ error }) => errors.push(error));
      socket.events.onEmitterError(({ error, emitter }) => emitterErrors(error.message, emitter.topic));
      socket.onSend(() => {
        throw new Error("Cannot sign the message");
      });

      expect(() =>
        socket
          .createEmitter<{ text: string }>()({ topic: "chat" })
          .emit({ payload: { text: "hi" } }),
      ).not.toThrow();
      await flushPromises();

      expect(websocket.sent).toStrictEqual([]);
      expect(errors.map((error) => error.message)).toStrictEqual(["Cannot sign the message"]);
      expect(emitterErrors).toHaveBeenCalledTimes(1);
      expect(emitterErrors).toHaveBeenCalledWith("Cannot sign the message", "chat");
    });

    it("should report an interceptor that does not return the emitter", async () => {
      const websocket = await connect();
      const errors: Error[] = [];
      socket.onError<Error>(({ error }) => errors.push(error));
      socket.onSend(() => undefined as any);

      socket
        .createEmitter<{ text: string }>()({ topic: "chat" })
        .emit({ payload: { text: "hi" } });
      await flushPromises();

      expect(websocket.sent).toStrictEqual([]);
      expect(errors.map((error) => error.message)).toStrictEqual(["Send modifier must return emitter"]);
    });

    it("should keep sending after an interceptor failure", async () => {
      const websocket = await connect();
      socket.onError(() => null);
      socket.onSend(({ emitter }) => {
        if (emitter.payload.fail) {
          throw new Error("Cannot sign the message");
        }
        return emitter;
      });
      const emitter = socket.createEmitter<{ fail: boolean }>()({ topic: "chat" });

      emitter.emit({ payload: { fail: true } });
      emitter.emit({ payload: { fail: false } });
      await flushPromises();

      expect(websocket.sentMessages).toStrictEqual([{ topic: "chat", data: { fail: false } }]);
    });
  });

  describe("When intercepting connections with onConnect", () => {
    it("should apply the interceptors chained on the constructor to the automatic first connection", async () => {
      socket = new Socket({ url: "ws://interceptors" }).onConnect(({ connection }) => ({
        ...connection,
        queryParams: { token: "abc" },
      }));

      const websocket = await openWebSocket();

      expect(websocket.url).toBe("ws://interceptors?token=abc");
    });

    it("should wait for async interceptors before creating the transport", async () => {
      let resolveToken: (token: string) => void = () => null;
      socket = new Socket({ url: "ws://interceptors" }).onConnect(async ({ connection }) => {
        const token = await new Promise<string>((resolve) => {
          resolveToken = resolve;
        });
        return { ...connection, queryParams: { token } };
      });
      await flushPromises();

      expect(ControlledWebSocket.instances).toHaveLength(0);
      expect(socket.adapter.connecting).toBeTrue();

      resolveToken("late");
      const websocket = await openWebSocket();

      expect(websocket.url).toBe("ws://interceptors?token=late");
      expect(socket.adapter.connected).toBeTrue();
    });

    it("should let an interceptor replace the url and the protocols", async () => {
      socket = new Socket({ url: "ws://interceptors", adapterOptions: { protocols: "v1" } }).onConnect(
        ({ connection }) => ({
          ...connection,
          url: "ws://other-region",
          adapterOptions: { ...connection.adapterOptions, protocols: ["v2", "auth-token"] },
        }),
      );

      const websocket = await openWebSocket();

      expect(websocket.url).toBe("ws://other-region");
      expect(websocket.protocols).toStrictEqual(["v2", "auth-token"]);
    });

    it("should not change the socket defaults when an interceptor changes the connection", async () => {
      socket = new Socket({ url: "ws://interceptors", queryParams: { a: 1 } }).onConnect(({ connection }) => ({
        ...connection,
        url: "ws://other-region",
        queryParams: { b: 2 },
      }));

      await openWebSocket();

      expect(socket.url).toBe("ws://interceptors");
      expect(socket.adapter.queryParams).toStrictEqual({ a: 1 });
    });

    it("should report a throwing interceptor and leave the socket ready for another attempt", async () => {
      let shouldFail = true;
      const errors: Error[] = [];
      socket = new Socket({ url: "ws://interceptors", adapterOptions: { autoConnect: false } })
        .onError<Error>(({ error }) => errors.push(error))
        .onConnect(({ connection }) => {
          if (shouldFail) {
            throw new Error("No token");
          }
          return connection;
        });

      await socket.connect();

      expect(errors.map((error) => error.message)).toStrictEqual(["No token"]);
      expect(ControlledWebSocket.instances).toHaveLength(0);
      expect(socket.adapter.connecting).toBeFalse();

      shouldFail = false;
      const connecting = socket.connect();
      await openWebSocket();
      await connecting;

      expect(socket.adapter.connected).toBeTrue();
    });
  });
});
