import type { ServerSentEventsAdapterType } from "adapter-sse";
import { ServerSentEventsAdapter } from "adapter-sse";
import { Socket } from "socket";

import {
  ControlledEventSource,
  installControlledEventSource,
  openEventSource,
  uninstallControlledEventSource,
  waitForEventSource,
} from "../../utils/controlled-event-source";
import { flushPromises } from "../../utils/controlled-websocket";

const url = "http://sse-lifecycle/events";
const reconnectTime = 1000;

type SseSocket = Socket<ServerSentEventsAdapterType>;

describe("SSE Adapter [ Lifecycle ]", () => {
  const sockets: SseSocket[] = [];

  const createSocket = (options?: Partial<ConstructorParameters<typeof Socket<ServerSentEventsAdapterType>>[0]>) => {
    const socket = new Socket<ServerSentEventsAdapterType>({
      url,
      reconnectTime,
      adapter: ServerSentEventsAdapter,
      ...options,
    });
    sockets.push(socket);
    return socket;
  };

  const createConnectedSocket = async (
    options?: Partial<ConstructorParameters<typeof Socket<ServerSentEventsAdapterType>>[0]>,
  ) => {
    const socket = createSocket(options);
    const source = await openEventSource();
    return { socket, source };
  };

  const trackEvents = (socket: SseSocket) => {
    const events: string[] = [];
    socket.events.onConnecting(({ connecting }) => events.push(`connecting:${connecting}`));
    socket.events.onConnected(() => events.push("connected"));
    socket.events.onDisconnected(() => events.push("disconnected"));
    socket.events.onReconnecting(({ attempts }) => events.push(`reconnecting:${attempts}`));
    socket.events.onReconnectingFailed(({ attempts }) => events.push(`failed:${attempts}`));
    socket.events.onError(() => events.push("error"));
    return events;
  };

  const waitForReconnectAttempt = async () => {
    await vi.advanceTimersByTimeAsync(reconnectTime);
    await flushPromises();
    return ControlledEventSource.last;
  };

  /** Waits for the next attempt and lets it fail for good */
  const failReconnectAttempt = async () => {
    const attempt = await waitForReconnectAttempt();
    attempt.serverFail();
    return attempt;
  };

  /** Waits for the next attempt and lets the server accept it */
  const openReconnectAttempt = async () => {
    const attempt = await waitForReconnectAttempt();
    attempt.serverOpen();
    return attempt;
  };

  beforeEach(() => {
    installControlledEventSource();
    vi.useFakeTimers({ toFake: ["setTimeout", "clearTimeout"] });
  });

  afterEach(async () => {
    await Promise.all(sockets.map((socket) => socket.disconnect()));
    sockets.forEach((socket) => socket.appManager.unmount());
    sockets.length = 0;
    vi.useRealTimers();
    uninstallControlledEventSource();
  });

  describe("When connecting", () => {
    it("should open the stream with the url, query params and init options", async () => {
      createSocket({
        queryParams: { token: "abc" },
        adapterOptions: { eventSourceInit: { withCredentials: true } },
      });

      const source = await waitForEventSource();

      expect(source.url).toBe(`${url}?token=abc`);
      expect(source.withCredentials).toBeTrue();
    });

    it("should not send credentials by default", async () => {
      createSocket();

      const source = await waitForEventSource();

      expect(source.withCredentials).toBeFalse();
    });

    it("should emit connecting, then connected in order", async () => {
      const socket = createSocket({ adapterOptions: { autoConnect: false } });
      const events = trackEvents(socket);

      const connecting = socket.connect();
      await openEventSource();
      await connecting;

      expect(events).toStrictEqual(["connecting:true", "connecting:false", "connected"]);
      expect(vi.getTimerCount()).toBe(0);
    });

    it("should wait for the automatic connection when connect is called right after creating the socket", async () => {
      const socket = createSocket();
      const resolved = vi.fn();

      const connecting = socket.connect().then(resolved);
      const source = await waitForEventSource();
      await flushPromises();
      expect(resolved).not.toHaveBeenCalled();

      source.serverOpen();
      await connecting;

      expect(socket.adapter.connected).toBeTrue();
      expect(ControlledEventSource.instances).toHaveLength(1);
    });

    it("should open a single stream for concurrent connect calls", async () => {
      const socket = createSocket({ adapterOptions: { autoConnect: false } });

      const first = socket.adapter.connect();
      const second = socket.adapter.connect();
      await openEventSource();

      await expect(Promise.all([first, second])).resolves.toStrictEqual([true, true]);
      expect(ControlledEventSource.instances).toHaveLength(1);
    });

    it("should report an error when the stream cannot be created", async () => {
      const socket = createSocket({ adapterOptions: { autoConnect: false } });
      const events = trackEvents(socket);
      ControlledEventSource.constructorError = new SyntaxError("The URL is invalid");

      await expect(socket.adapter.connect()).resolves.toBe(false);

      expect(events).toStrictEqual(["connecting:true", "connecting:false", "error"]);
    });

    it("should start over when the stream does not open before the reconnect time", async () => {
      const socket = createSocket();
      const events = trackEvents(socket);
      const hanging = await waitForEventSource();

      const next = await waitForReconnectAttempt();

      expect(hanging.readyState).toBe(ControlledEventSource.CLOSED);
      expect(next).not.toBe(hanging);
      expect(events).toStrictEqual(["reconnecting:0", "connecting:false", "disconnected", "connecting:true"]);
      expect(ControlledEventSource.active).toStrictEqual([next]);
    });

    it("should stop after the configured number of attempts when the stream never opens", async () => {
      const socket = createSocket({ reconnect: 2 });
      const events = trackEvents(socket);
      await waitForEventSource();

      await waitForReconnectAttempt();
      await waitForReconnectAttempt();
      await vi.advanceTimersByTimeAsync(reconnectTime);
      await flushPromises();
      await vi.advanceTimersByTimeAsync(reconnectTime * 10);

      expect(events.filter((event) => event.startsWith("reconnecting") || event.startsWith("failed"))).toStrictEqual([
        "reconnecting:0",
        "reconnecting:1",
        "reconnecting:2",
        "failed:2",
      ]);
      expect(ControlledEventSource.instances).toHaveLength(3);
      expect(ControlledEventSource.active).toHaveLength(0);
      expect(vi.getTimerCount()).toBe(0);
    });
  });

  describe("When receiving messages", () => {
    it("should deliver messages by topic", async () => {
      const { socket, source } = await createConnectedSocket();
      const ticks = vi.fn();
      const tocks = vi.fn();
      socket
        .createListener<number>()({ topic: "ticks" })
        .listen(({ data }) => ticks(data));
      socket
        .createListener<number>()({ topic: "tocks" })
        .listen(({ data }) => tocks(data));

      source.serverEmit("ticks", 1);
      source.serverEmit("tocks", 2);

      expect(ticks.mock.calls).toStrictEqual([[1]]);
      expect(tocks.mock.calls).toStrictEqual([[2]]);
    });

    it("should deliver every message once", async () => {
      const { socket, source } = await createConnectedSocket();
      const spy = vi.fn();
      socket.createListener<number>()({ topic: "ticks" }).listen(spy);

      source.serverEmit("ticks", 1);
      source.serverEmit("ticks", 2);

      expect(spy).toHaveBeenCalledTimes(2);
    });

    it("should expose the last event id through extra", async () => {
      const { socket, source } = await createConnectedSocket();
      const ids: string[] = [];
      socket
        .createListener<number>()({ topic: "ticks" })
        .listen(({ extra }) => ids.push(extra.lastEventId));

      source.serverEmit("ticks", 1, { lastEventId: "41" });
      source.serverEmit("ticks", 2, { lastEventId: "42" });

      expect(ids).toStrictEqual(["41", "42"]);
    });

    it("should map custom message formats with decode", async () => {
      const { socket, source } = await createConnectedSocket({
        adapterOptions: {
          decode: (event) => {
            const [type, payload] = String(event.data).split("|");
            return type === "skip" ? null : { topic: type, data: payload };
          },
        },
      });
      const spy = vi.fn();
      socket
        .createListener<string>()({ topic: "greeting" })
        .listen(({ data }) => spy(data));

      source.serverSend("skip|ignored");
      source.serverSend("greeting|hello");

      expect(spy.mock.calls).toStrictEqual([["hello"]]);
    });

    it.each([
      { name: "text that is not JSON", data: "plain text" },
      { name: "an empty message", data: "" },
      { name: "a JSON array", data: "[1,2]" },
      { name: "an object without a topic", data: JSON.stringify({ data: 1 }) },
    ])("should ignore $name and keep the stream", async ({ data }) => {
      const { socket, source } = await createConnectedSocket();
      const spy = vi.fn();
      const errors = vi.fn();
      socket.onError(errors);
      socket
        .createListener<number>()({ topic: "ticks" })
        .listen(({ data: received }) => spy(received));

      source.serverSend(data);
      source.serverEmit("ticks", 1);

      expect(spy.mock.calls).toStrictEqual([[1]]);
      expect(errors).not.toHaveBeenCalled();
      expect(socket.adapter.connected).toBeTrue();
    });

    it("should apply the onMessage interceptors", async () => {
      const { socket, source } = await createConnectedSocket();
      socket.onMessage<number>(({ event }) => event * 10);
      const spy = vi.fn();
      socket
        .createListener<number>()({ topic: "ticks" })
        .listen(({ data }) => spy(data));

      source.serverEmit("ticks", 4);

      expect(spy).toHaveBeenCalledWith(40);
    });
  });

  describe("When the stream breaks", () => {
    it("should mark the socket as disconnected while the browser retries", async () => {
      const { socket, source } = await createConnectedSocket();
      const events = trackEvents(socket);

      source.serverDrop();

      expect(events).toStrictEqual(["error", "connecting:false", "disconnected", "connecting:true"]);
      expect(socket.adapter.connected).toBeFalse();
      expect(socket.adapter.connecting).toBeTrue();
    });

    it("should become connected again when the browser retry succeeds", async () => {
      const { socket, source } = await createConnectedSocket();
      source.serverDrop();
      const events = trackEvents(socket);

      source.serverOpen();

      expect(events).toStrictEqual(["connecting:false", "connected"]);
      expect(socket.adapter.connected).toBeTrue();
      expect(ControlledEventSource.instances).toHaveLength(1);
      expect(vi.getTimerCount()).toBe(0);
    });

    it("should keep delivering to the same listeners after the browser retry", async () => {
      const { socket, source } = await createConnectedSocket();
      const spy = vi.fn();
      socket
        .createListener<number>()({ topic: "ticks" })
        .listen(({ data }) => spy(data));

      source.serverEmit("ticks", 1);
      source.serverDrop();
      source.serverOpen();
      source.serverEmit("ticks", 2);

      expect(spy.mock.calls).toStrictEqual([[1], [2]]);
    });

    it("should replace the stream when the browser retry takes longer than the reconnect time", async () => {
      const { socket, source } = await createConnectedSocket();
      source.serverDrop();
      const events = trackEvents(socket);

      const next = await waitForReconnectAttempt();
      next.serverOpen();

      expect(source.readyState).toBe(ControlledEventSource.CLOSED);
      expect(events).toStrictEqual([
        "reconnecting:0",
        "connecting:false",
        "disconnected",
        "connecting:true",
        "connecting:false",
        "connected",
      ]);
      expect(ControlledEventSource.active).toStrictEqual([next]);
    });

    it("should mark the socket as disconnected and reconnect when the stream fails for good", async () => {
      const { socket, source } = await createConnectedSocket();
      const events = trackEvents(socket);

      source.serverFail();

      expect(events).toStrictEqual(["error", "connecting:false", "disconnected"]);
      expect(socket.adapter.connected).toBeFalse();
      expect(socket.adapter.connecting).toBeFalse();

      const next = await waitForReconnectAttempt();
      next.serverOpen();

      expect(socket.adapter.connected).toBeTrue();
      expect(ControlledEventSource.active).toStrictEqual([next]);
    });

    it("should emit disconnected once for a stream that failed for good", async () => {
      const { socket, source } = await createConnectedSocket({ reconnect: 0 });
      const disconnected = vi.fn();
      socket.events.onDisconnected(disconnected);

      source.serverFail();
      await vi.advanceTimersByTimeAsync(reconnectTime * 3);

      expect(disconnected).toHaveBeenCalledTimes(1);
      expect(vi.getTimerCount()).toBe(0);
    });

    it("should count the attempts and reset them after the stream is back", async () => {
      const { socket, source } = await createConnectedSocket();
      const events = trackEvents(socket);

      source.serverFail();
      await failReconnectAttempt();
      await openReconnectAttempt();

      expect(events.filter((event) => event.startsWith("reconnecting"))).toStrictEqual([
        "reconnecting:0",
        "reconnecting:1",
      ]);
      expect(socket.adapter.reconnectionAttempts).toBe(0);
    });
  });

  describe("When disconnecting", () => {
    it("should close the stream and emit a single disconnected event", async () => {
      const { socket, source } = await createConnectedSocket();
      const events = trackEvents(socket);

      await socket.disconnect();
      await socket.disconnect();

      expect(source.readyState).toBe(ControlledEventSource.CLOSED);
      expect(events).toStrictEqual(["connecting:false", "disconnected"]);
    });

    it("should not reconnect after disconnecting a stream that is still opening", async () => {
      const socket = createSocket();
      const source = await waitForEventSource();
      await socket.disconnect();
      const events = trackEvents(socket);

      await vi.advanceTimersByTimeAsync(reconnectTime * 5);

      expect(source.readyState).toBe(ControlledEventSource.CLOSED);
      expect(events).toStrictEqual([]);
      expect(ControlledEventSource.instances).toHaveLength(1);
      expect(vi.getTimerCount()).toBe(0);
    });

    it("should cancel the reconnection scheduled after a failure", async () => {
      const { socket, source } = await createConnectedSocket();
      source.serverFail();

      await socket.disconnect();
      await vi.advanceTimersByTimeAsync(reconnectTime * 5);

      expect(ControlledEventSource.instances).toHaveLength(1);
      expect(vi.getTimerCount()).toBe(0);
    });

    it("should stop the browser retry of a dropped stream", async () => {
      const { socket, source } = await createConnectedSocket();
      source.serverDrop();

      await socket.disconnect();

      expect(source.readyState).toBe(ControlledEventSource.CLOSED);
      expect(socket.adapter.connecting).toBeFalse();
      expect(vi.getTimerCount()).toBe(0);
    });

    it("should ignore messages and errors of a closed stream", async () => {
      const { socket, source } = await createConnectedSocket();
      const spy = vi.fn();
      socket.createListener<number>()({ topic: "ticks" }).listen(spy);
      await socket.disconnect();
      const events = trackEvents(socket);

      source.serverEmit("ticks", 1);
      source.dispatchEvent(new Event("error"));
      source.dispatchEvent(new Event("open"));

      expect(spy).not.toHaveBeenCalled();
      expect(events).toStrictEqual([]);
      expect(socket.adapter.connected).toBeFalse();
    });

    it("should stay disconnected when the network comes back after a manual disconnect", async () => {
      const { socket } = await createConnectedSocket();
      await socket.disconnect();

      socket.appManager.setOnline(false);
      socket.appManager.setOnline(true);
      await flushPromises();

      expect(ControlledEventSource.instances).toHaveLength(1);
      expect(socket.adapter.connecting).toBeFalse();
    });

    it("should connect again on demand", async () => {
      const { socket } = await createConnectedSocket();
      await socket.disconnect();

      const connecting = socket.connect();
      const next = await openEventSource(2);
      await connecting;

      expect(socket.adapter.connected).toBeTrue();
      expect(ControlledEventSource.active).toStrictEqual([next]);
    });
  });

  describe("When reconnecting manually", () => {
    it("should replace the stream and resolve when the new one is open", async () => {
      const { socket, source } = await createConnectedSocket();
      const resolved = vi.fn();

      const reconnecting = socket.reconnect().then(resolved);
      const next = await waitForEventSource(2);
      await flushPromises();
      expect(resolved).not.toHaveBeenCalled();

      next.serverOpen();
      await reconnecting;

      expect(source.readyState).toBe(ControlledEventSource.CLOSED);
      expect(socket.adapter.connected).toBeTrue();
    });

    it("should use the connection details returned by onConnect for every attempt", async () => {
      let token = "first";
      const { socket } = await createConnectedSocket();
      socket.onConnect(({ connection }) => ({ ...connection, queryParams: { token } }));

      token = "second";
      const reconnecting = socket.reconnect();
      const next = await openEventSource(2);
      await reconnecting;

      expect(next.url).toBe(`${url}?token=second`);
    });
  });
});
