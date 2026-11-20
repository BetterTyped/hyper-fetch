import { Client } from "@hyper-fetch/core";
import { Socket } from "@hyper-fetch/sockets";
import { createWebsocketE2EServer, waitForConnection } from "@hyper-fetch/testing";
import type { WebSocket } from "ws";
import { WebSocketServer } from "ws";

import type { BaseMessagePayload, DevtoolsSocketEventData } from "../../src/index";
import {
  DevtoolsPlugin,
  EventSourceType,
  InternalEvents,
  MAX_QUEUED_EVENTS,
  MessageType,
  SocketEvents,
  SocketTopics,
} from "../../src/index";

type Received = { data: BaseMessagePayload };

/** Stands in for the HyperFlow server */
const createHyperFlowServer = async () => {
  const port = 20_000 + Math.floor(Math.random() * 40_000);
  const wss = new WebSocketServer({ port });
  await new Promise<void>((resolve) => {
    wss.once("listening", () => resolve());
  });
  const received: Received[] = [];
  let plugin: WebSocket | null = null;
  wss.on("connection", (ws) => {
    plugin = ws;
    ws.on("message", (raw) => received.push(JSON.parse(raw.toString())));
  });

  const initializeApp = () =>
    plugin?.send(
      JSON.stringify({
        topic: SocketTopics.PLUGIN_LISTENER,
        data: { messageType: MessageType.INTERNAL, eventType: InternalEvents.APP_INITIALIZED },
      }),
    );

  const socketEvents = () =>
    received
      .map(({ data }) => data)
      .filter((data) => data.messageType === MessageType.EVENT && data.eventSource === EventSourceType.SOCKET)
      .map((data) => ({ name: data.eventName as SocketEvents, data: data.eventData as DevtoolsSocketEventData }));

  const close = async () => {
    wss.clients.forEach((ws) => ws.terminate());
    await new Promise((resolve) => {
      wss.close(resolve);
    });
  };

  return { port, received, initializeApp, socketEvents, close };
};

describe("DevtoolsPlugin [ Sockets ]", () => {
  const backend = createWebsocketE2EServer();
  let backendUrl: string;
  let hyperFlow: Awaited<ReturnType<typeof createHyperFlowServer>>;
  let plugin: ReturnType<typeof DevtoolsPlugin> | undefined;
  let socket: Socket;

  beforeAll(async () => {
    backendUrl = await backend.startServer();
  });

  afterAll(async () => {
    await backend.stopServer();
  });

  beforeEach(async () => {
    hyperFlow = await createHyperFlowServer();
    // A Node.js app's socket, on the global WebSocket
    socket = new Socket({ url: backendUrl, reconnect: 0, adapterOptions: { autoConnect: false } });
  });

  afterEach(async () => {
    const devtoolsSocket = plugin?.data.eventHandler?.socket;
    if (devtoolsSocket) {
      devtoolsSocket.reconnectAttempts = 0;
      await devtoolsSocket.disconnect();
    }
    plugin = undefined;
    await socket.disconnect();
    await hyperFlow.close();
  });

  const connectPlugin = async (sockets = [socket]) => {
    const created = DevtoolsPlugin({ appName: "App", url: `ws://localhost:${hyperFlow.port}`, sockets });
    plugin = created;
    new Client({ url: "http://localhost:5000" }).addPlugin(created);
    await vi.waitFor(() => expect(created.data.eventHandler?.isConnected).toBe(true));
    hyperFlow.initializeApp();
    await vi.waitFor(() => expect(created.data.eventHandler?.isInitialized).toBe(true));
  };

  const findEvent = (name: SocketEvents) => hyperFlow.socketEvents().find((event) => event.name === name);

  it("should register every socket with its identity and state", async () => {
    await connectPlugin();

    await vi.waitFor(() => expect(findEvent(SocketEvents.REGISTERED)).toBeDefined());
    expect(findEvent(SocketEvents.REGISTERED)?.data).toMatchObject({
      socketId: backendUrl,
      url: backendUrl,
      adapterName: "websockets",
      status: "disconnected",
    });
  });

  it("should report the connection lifecycle", async () => {
    await connectPlugin();

    await socket.connect();
    await waitForConnection(socket);
    await socket.disconnect();

    await vi.waitFor(() => {
      const names = hyperFlow.socketEvents().map((event) => event.name);
      expect(names).toEqual(
        expect.arrayContaining([SocketEvents.CONNECTING, SocketEvents.CONNECTED, SocketEvents.DISCONNECTED]),
      );
      expect(names.indexOf(SocketEvents.CONNECTING)).toBeLessThan(names.indexOf(SocketEvents.CONNECTED));
      expect(names.indexOf(SocketEvents.CONNECTED)).toBeLessThan(names.lastIndexOf(SocketEvents.DISCONNECTED));
    });
  });

  it("should report received messages with their topic and data", async () => {
    await connectPlugin();
    const clientPromise = backend.waitForClient();
    await socket.connect();
    await waitForConnection(socket);
    const client = await clientPromise;

    client.send(JSON.stringify({ topic: "chat", data: { text: "Hello" } }));

    await vi.waitFor(() => expect(findEvent(SocketEvents.MESSAGE_RECEIVED)).toBeDefined());
    expect(findEvent(SocketEvents.MESSAGE_RECEIVED)?.data).toMatchObject({ topic: "chat", data: { text: "Hello" } });
  });

  it("should report sent messages with their payload", async () => {
    await connectPlugin();
    await socket.connect();
    await waitForConnection(socket);

    socket
      .createEmitter<{ text: string }>()({ topic: "chat" })
      .emit({ payload: { text: "Hi" } });

    await vi.waitFor(() => expect(findEvent(SocketEvents.MESSAGE_SENT)).toBeDefined());
    expect(findEvent(SocketEvents.MESSAGE_SENT)?.data).toMatchObject({ topic: "chat", data: { text: "Hi" } });
  });

  it("should report errors in a form that survives JSON", async () => {
    await connectPlugin();

    socket.events.emitError({ error: new Error("Broken pipe") });

    await vi.waitFor(() => expect(findEvent(SocketEvents.ERROR)).toBeDefined());
    expect(findEvent(SocketEvents.ERROR)?.data.error).toStrictEqual({ name: "Error", message: "Broken pipe" });
  });

  it("should register the sockets again when HyperFlow reconnects", async () => {
    await connectPlugin();
    await vi.waitFor(() => expect(findEvent(SocketEvents.REGISTERED)).toBeDefined());
    await socket.connect();
    await waitForConnection(socket);

    hyperFlow.initializeApp();

    await vi.waitFor(() => {
      const registrations = hyperFlow.socketEvents().filter((event) => event.name === SocketEvents.REGISTERED);
      expect(registrations).toHaveLength(2);
      expect(registrations[1].data.status).toBe("connected");
    });
  });

  it("should give sockets with the same url distinct ids", async () => {
    const second = new Socket({ url: backendUrl, adapterOptions: { autoConnect: false } });
    await connectPlugin([socket, second]);

    await vi.waitFor(() => {
      const ids = hyperFlow
        .socketEvents()
        .filter((event) => event.name === SocketEvents.REGISTERED)
        .map((event) => event.data.socketId);
      expect(ids).toStrictEqual([backendUrl, `${backendUrl} #2`]);
    });
  });

  it("should keep only the newest events while HyperFlow is not connected", () => {
    const created = DevtoolsPlugin({ appName: "App", url: `ws://localhost:${hyperFlow.port}`, sockets: [socket] });
    plugin = created;
    new Client({ url: "http://localhost:5000" }).addPlugin(created);
    expect(created.data.eventHandler?.isInitialized).toBe(false);

    for (let index = 0; index < MAX_QUEUED_EVENTS + 10; index++) {
      socket.events.emitListenerEvent({ topic: "tick", data: index, extra: {} });
    }

    const queue = created.data.eventHandler?.eventQueue ?? [];
    expect(queue).toHaveLength(MAX_QUEUED_EVENTS);
    expect(queue.at(-1)?.eventData).toMatchObject({ data: MAX_QUEUED_EVENTS + 9 });
  });
});
