import { Client } from "@hyper-fetch/core";
import type { EmitterInstance, SocketInstance } from "@hyper-fetch/sockets";
import { Socket } from "@hyper-fetch/sockets";
import type { WebSocket } from "ws";
import { WebSocketServer } from "ws";

import type { BaseMessagePayload, DevtoolsSocketEventData } from "../../src/index";
import {
  createSocketReporter,
  DevtoolsPlugin,
  EventSourceType,
  InternalEvents,
  MessageType,
  SocketEvents,
  SocketTopics,
} from "../../src/index";

const createHyperFlowServer = async () => {
  const port = 20_000 + Math.floor(Math.random() * 40_000);
  const wss = new WebSocketServer({ port });
  await new Promise<void>((resolve) => {
    wss.once("listening", () => resolve());
  });
  const received: { data: BaseMessagePayload }[] = [];
  let plugin: WebSocket | null = null;
  wss.on("connection", (ws) => {
    plugin = ws;
    ws.on("message", (raw) => received.push(JSON.parse(raw.toString())));
  });
  return {
    port,
    received,
    initializeApp: () =>
      plugin?.send(
        JSON.stringify({
          topic: SocketTopics.PLUGIN_LISTENER,
          data: { messageType: MessageType.INTERNAL, eventType: InternalEvents.APP_INITIALIZED },
        }),
      ),
    events: () => received.map(({ data }) => data).filter((data) => data.messageType === MessageType.EVENT),
    close: async () => {
      wss.clients.forEach((ws) => ws.terminate());
      await new Promise((resolve) => {
        wss.close(resolve);
      });
    },
  };
};

describe("DevtoolsPlugin [ Edge cases ]", () => {
  let hyperFlow: Awaited<ReturnType<typeof createHyperFlowServer>>;
  let plugin: ReturnType<typeof DevtoolsPlugin>;
  let client: Client;
  let socket: Socket;

  beforeEach(async () => {
    hyperFlow = await createHyperFlowServer();
    socket = new Socket({ url: "ws://localhost:1", reconnect: 0, adapterOptions: { autoConnect: false } });
  });

  afterEach(async () => {
    const devtoolsSocket = plugin?.data.eventHandler?.socket;
    if (devtoolsSocket) {
      devtoolsSocket.reconnectAttempts = 0;
      await devtoolsSocket.disconnect();
    }
    vi.restoreAllMocks();
    await hyperFlow.close();
  });

  const createPlugin = (options: Partial<Parameters<typeof DevtoolsPlugin>[0]> = {}) => {
    plugin = DevtoolsPlugin({ appName: "App", url: `ws://localhost:${hyperFlow.port}`, sockets: [socket], ...options });
    client = new Client({ url: "http://localhost:5000" });
    client.addPlugin(plugin);
    return plugin;
  };

  const initialize = async () => {
    await vi.waitFor(() => expect(plugin.data.eventHandler?.isConnected).toBe(true));
    hyperFlow.initializeApp();
    await vi.waitFor(() => expect(plugin.data.eventHandler?.isInitialized).toBe(true));
  };

  const socketEvents = () =>
    hyperFlow
      .events()
      .filter((event) => event.eventSource === EventSourceType.SOCKET)
      .map((event) => ({ name: event.eventName as SocketEvents, data: event.eventData as DevtoolsSocketEventData }));

  describe("when data can't be sent", () => {
    const createCircular = () => {
      const circular: Record<string, unknown> = { name: "loop" };
      circular.self = circular;
      return circular;
    };

    it("should not break the app or HyperFlow when a live event can't be serialized", async () => {
      vi.spyOn(console, "error").mockImplementation(() => {});
      createPlugin();
      await initialize();

      expect(() => socket.events.emitListenerEvent({ topic: "loop", data: createCircular(), extra: {} })).not.toThrow();
      socket.events.emitListenerEvent({ topic: "after", data: { ok: true }, extra: {} });

      await vi.waitFor(() => expect(socketEvents().some((event) => event.data.topic === "after")).toBe(true));
      expect(socketEvents().some((event) => event.data.topic === "loop")).toBe(false);
    });

    it("should keep flushing queued events after one that can't be serialized", async () => {
      vi.spyOn(console, "error").mockImplementation(() => {});
      createPlugin();

      // Queued while HyperFlow has not confirmed the handshake yet
      socket.events.emitListenerEvent({ topic: "before", data: 1, extra: {} });
      socket.events.emitListenerEvent({ topic: "loop", data: createCircular(), extra: {} });
      socket.events.emitListenerEvent({ topic: "after", data: 2, extra: {} });
      await initialize();

      await vi.waitFor(() => {
        const topics = socketEvents().map((event) => event.data.topic);
        expect(topics).toContain("before");
        expect(topics).toContain("after");
      });
      expect(plugin.data.eventHandler?.eventQueue).toHaveLength(0);
    });

    it("should never let a failing connection to HyperFlow throw into the app", async () => {
      const logged = vi.spyOn(console, "error").mockImplementation(() => {});
      createPlugin();
      await initialize();
      vi.spyOn(plugin.data.eventHandler!.socketEmitter, "emit").mockImplementation(() => {
        throw new Error("Connection broke");
      });

      expect(() => socket.events.emitListenerEvent({ topic: "chat", data: 1, extra: {} })).not.toThrow();
      expect(() => client.cache.events.emitInvalidation("key")).not.toThrow();
      expect(logged).toHaveBeenCalled();
    });

    it("should send binary data in a form that survives JSON", async () => {
      createPlugin();
      await initialize();

      socket.events.emitListenerEvent({ topic: "binary", data: new Uint8Array([1, 2, 3]), extra: {} });

      await vi.waitFor(() => expect(socketEvents().some((event) => event.data.topic === "binary")).toBe(true));
      expect(socketEvents().find((event) => event.data.topic === "binary")?.data.data).toStrictEqual({
        0: 1,
        1: 2,
        2: 3,
      });
    });
  });

  describe("when sockets report", () => {
    it("should report reconnection attempts and giving up", async () => {
      createPlugin();
      await initialize();

      socket.events.emitReconnecting({ attempts: 0 });
      socket.events.emitReconnectingFailed({ attempts: 3 });

      await vi.waitFor(() => {
        const names = socketEvents().map((event) => event.name);
        expect(names).toEqual(expect.arrayContaining([SocketEvents.RECONNECTING, SocketEvents.RECONNECT_FAILED]));
      });
      expect(socketEvents().find((event) => event.name === SocketEvents.RECONNECTING)?.data.attempts).toBe(0);
      expect(socketEvents().find((event) => event.name === SocketEvents.RECONNECT_FAILED)?.data.attempts).toBe(3);
    });

    it("should report messages that failed to send with their payload and error", async () => {
      createPlugin();
      await initialize();
      const emitter = socket.createEmitter<{ text: string }>()({ topic: "chat" }).setPayload({ text: "lost" });

      socket.events.emitEmitterError({ error: new TypeError("Socket is closed"), emitter: emitter as EmitterInstance });

      await vi.waitFor(() =>
        expect(socketEvents().some((event) => event.name === SocketEvents.MESSAGE_FAILED)).toBe(true),
      );
      expect(socketEvents().find((event) => event.name === SocketEvents.MESSAGE_FAILED)?.data).toMatchObject({
        topic: "chat",
        data: { text: "lost" },
        error: { name: "TypeError", message: "Socket is closed" },
      });
    });

    it.each([
      ["an Error", new RangeError("Out of range"), { name: "RangeError", message: "Out of range" }],
      ["a DOM event", new Event("error"), { name: "Event", message: "error" }],
      ["a plain object", { code: 1006 }, { code: 1006 }],
      ["a string", "closed", "closed"],
    ])("should report %s as an error HyperFlow can read", async (_name, error, expected) => {
      createPlugin();
      await initialize();

      socket.events.emitError({ error });

      await vi.waitFor(() => expect(socketEvents().some((event) => event.name === SocketEvents.ERROR)).toBe(true));
      expect(socketEvents().find((event) => event.name === SocketEvents.ERROR)?.data.error).toStrictEqual(expected);
    });

    it("should not report a connecting state that ended", async () => {
      createPlugin();
      await initialize();

      socket.events.emitConnecting({ connecting: false });
      socket.events.emitConnecting({ connecting: true });

      await vi.waitFor(() => expect(socketEvents().some((event) => event.name === SocketEvents.CONNECTING)).toBe(true));
      expect(socketEvents().filter((event) => event.name === SocketEvents.CONNECTING)).toHaveLength(1);
    });
  });

  describe("given a socket reporter", () => {
    it("should stop reporting once unmounted", () => {
      const report = vi.fn();
      const reporter = createSocketReporter({ socket: socket as SocketInstance, socketId: "chat", report });

      socket.events.emitConnected();
      reporter.unmount();
      socket.events.emitConnected();
      socket.events.emitListenerEvent({ topic: "x", data: 1, extra: {} });

      expect(report).toHaveBeenCalledOnce();
    });

    it("should describe the current state in its snapshot", () => {
      const report = vi.fn();
      const reporter = createSocketReporter({ socket: socket as SocketInstance, socketId: "chat", report });

      socket.adapter.setConnecting(true);
      reporter.sendSnapshot();
      socket.adapter.setConnecting(false);
      socket.adapter.setConnected(true);
      reporter.sendSnapshot();

      expect(report.mock.calls.map(([, data]) => data.status)).toStrictEqual(["connecting", "connected"]);
      expect(report.mock.calls[0][1]).toMatchObject({
        socketId: "chat",
        url: "ws://localhost:1",
        adapterName: "websockets",
      });
    });
  });

  describe("given debug mode", () => {
    it("should log the connection to HyperFlow", async () => {
      createPlugin({ debug: true });
      const info = vi.spyOn(plugin.data.eventHandler!.logger, "info");
      const error = vi.spyOn(plugin.data.eventHandler!.logger, "error");
      await initialize();

      // What the transport calls on a connection error
      plugin.data.eventHandler!.socket.unstable_onErrorCallbacks.forEach((callback) =>
        callback({ error: new Error("Lost") }),
      );
      await plugin.data.eventHandler!.socket.disconnect();

      await vi.waitFor(() => {
        expect(info.mock.calls.map(([log]) => log.title)).toEqual(expect.arrayContaining(["Disconnected"]));
        expect(error.mock.calls.map(([log]) => log.title)).toContain("Error");
      });
    });

    it("should stay quiet without debug mode", async () => {
      createPlugin();
      const info = vi.spyOn(plugin.data.eventHandler!.logger, "info");
      await initialize();

      await plugin.data.eventHandler!.socket.disconnect();

      expect(info).not.toHaveBeenCalled();
    });
  });
});
