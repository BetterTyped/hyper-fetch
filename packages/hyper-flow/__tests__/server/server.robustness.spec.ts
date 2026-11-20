import { InternalEvents, MessageOrigin, MessageType } from "@hyper-fetch/plugin-devtools";
import type { StartServer } from "@server/server";
import { startServer } from "@server/server";
import { AppConnectionStatus, PluginConnectionStatus } from "@server/types/connection.type";
import { waitFor } from "@testing-library/react";
import { once } from "node:events";
import { connect } from "node:net";
import type { MockInstance } from "vitest";
import { WebSocket } from "ws";

import { getRandomPort } from "../utils/hyper-flow";
import { ConnectionName } from "@/constants/connection.name";

const openSocket = async (port: number, connectionName: string, origin: string) => {
  const ws = new WebSocket(
    `ws://localhost:${port}?connectionName=${encodeURIComponent(connectionName)}&origin=${encodeURIComponent(origin)}`,
  );
  await once(ws, "open");
  return ws;
};

/** Collects what a socket receives, parsed */
const record = (ws: WebSocket) => {
  const received: { topic?: string; data?: Record<string, unknown> }[] = [];
  ws.on("message", (raw: Buffer) => received.push(JSON.parse(raw.toString())));
  return received;
};

const event = (data: Record<string, unknown>) => JSON.stringify({ data });

describe("Devtools Socket Server [ Robustness ]", () => {
  let serverObject: StartServer;
  let port: number;
  let errors: MockInstance<typeof console.error>;
  let logs: MockInstance<typeof console.log>;
  const cleanups: (() => void)[] = [];

  const open = async (connectionName: string, origin: string) => {
    const ws = await openSocket(port, connectionName, origin);
    cleanups.push(() => ws.terminate());
    return ws;
  };

  const logged = () => errors.mock.calls.flat().join("\n");

  beforeEach(async () => {
    errors = vi.spyOn(console, "error").mockImplementation(() => undefined);
    logs = vi.spyOn(console, "log").mockImplementation(() => undefined);
    port = getRandomPort();
    serverObject = await startServer({ port });
  });

  afterEach(async () => {
    cleanups.forEach((cleanup) => cleanup());
    cleanups.length = 0;
    serverObject.wss?.clients.forEach((ws) => ws.terminate());
    await new Promise((resolve) => {
      serverObject.wss?.close(resolve);
    });
    await new Promise((resolve) => {
      serverObject.server?.close(resolve);
    });
    vi.restoreAllMocks();
  });

  describe("when a plugin uses a name that exists on every object", () => {
    it.each(["constructor", "toString", "__proto__"])("should register %s as its own connection", async (name) => {
      const { connections } = serverObject;

      await open(name, MessageOrigin.PLUGIN);

      await waitFor(() => expect(Object.keys(connections)).toStrictEqual([name]));
      expect(connections[name].pluginStatus).toBe(PluginConnectionStatus.CONNECTED);
      expect(connections[name].appStatus).toBe(AppConnectionStatus.PENDING);
      // Nothing leaked onto shared prototypes
      expect(({} as { ws?: unknown }).ws).toBeUndefined();
      expect((Object as unknown as { ws?: unknown }).ws).toBeUndefined();
    });
  });

  describe("when a plugin reconnects before its old socket closed", () => {
    it("should keep the new socket", async () => {
      const { connections } = serverObject;
      const previous = await open("app", MessageOrigin.PLUGIN);
      await waitFor(() => expect(connections.app?.ws).toBeTruthy());
      const next = await open("app", MessageOrigin.PLUGIN);
      await waitFor(() => expect(serverObject.wss?.clients.size).toBe(2));

      previous.close();
      await waitFor(() => expect(serverObject.wss?.clients.size).toBe(1));

      expect(connections.app.ws).not.toBeNull();
      expect(connections.app.pluginStatus).toBe(PluginConnectionStatus.CONNECTED);
      // The plugin still gets what the app sends it
      const received = record(next);
      const app = await open(ConnectionName.HF_DEVTOOLS_FRONTEND, MessageOrigin.APP);
      app.send(event({ messageType: MessageType.EVENT, origin: MessageOrigin.APP, connectionName: "app", n: 1 }));
      await waitFor(() => expect(received).toHaveLength(1));
    });
  });

  describe("when a connection names an unknown origin", () => {
    it("should close it with a policy violation and not register it", async () => {
      const ws = await open("stranger", "SOMEWHERE");

      const [code] = await once(ws, "close");

      expect(code).toBe(1008);
      expect(Object.keys(serverObject.connections)).toStrictEqual([]);
      expect(serverObject.getAppConnection()).toBeNull();
    });
  });

  describe("when the app talks to a plugin that hung up", () => {
    it("should drop the event and say the socket is gone", async () => {
      const { connections } = serverObject;
      const plugin = await open("gone", MessageOrigin.PLUGIN);
      await waitFor(() => expect(connections.gone?.ws).toBeTruthy());
      plugin.close();
      await waitFor(() => expect(connections.gone.pluginStatus).toBe(PluginConnectionStatus.HANGUP));
      const app = await open(ConnectionName.HF_DEVTOOLS_FRONTEND, MessageOrigin.APP);

      app.send(event({ messageType: MessageType.EVENT, origin: MessageOrigin.APP, connectionName: "gone" }));

      await waitFor(() => expect(logged()).toContain("WebSocket connection is not available"));
      expect(connections.gone.ws).toBeNull();
    });
  });

  describe("when the app confirms a handshake for an unknown plugin", () => {
    it("should not create a connection for it", async () => {
      const app = await open(ConnectionName.HF_DEVTOOLS_FRONTEND, MessageOrigin.APP);

      app.send(
        event({
          messageType: MessageType.INTERNAL,
          eventType: InternalEvents.APP_INITIALIZED,
          origin: MessageOrigin.APP,
          connectionName: "ghost",
        }),
      );

      await waitFor(() => expect(logged()).toContain("Connection not found in active connections"));
      expect(Object.keys(serverObject.connections)).toStrictEqual([]);
    });
  });

  describe("when a plugin sends an internal event the server does not know", () => {
    it("should ignore it and keep the handshake state", async () => {
      const { connections } = serverObject;
      const plugin = await open("odd", MessageOrigin.PLUGIN);
      await waitFor(() => expect(connections.odd).toBeDefined());

      plugin.send(
        event({
          messageType: MessageType.INTERNAL,
          eventType: InternalEvents.PLUGIN_HANGUP,
          origin: MessageOrigin.PLUGIN,
          connectionName: "odd",
        }),
      );

      await waitFor(() =>
        expect(logs.mock.calls.flat().join("\n")).toContain("Unhandled communication event received"),
      );
      expect(connections.odd.appStatus).toBe(AppConnectionStatus.PENDING);
      expect(connections.odd.clientMetaData).toBeUndefined();
    });
  });

  describe("when an event cannot be forwarded", () => {
    it("should drop it and keep forwarding the next ones", async () => {
      const app = await open(ConnectionName.HF_DEVTOOLS_FRONTEND, MessageOrigin.APP);
      const received = record(app);
      const plugin = await open("deep", MessageOrigin.PLUGIN);
      // Parsing handles any depth, serializing it back overflows the stack
      const depth = 200_000;
      const deep = `${"[".repeat(depth)}${"]".repeat(depth)}`;
      const message = event({
        messageType: MessageType.EVENT,
        origin: MessageOrigin.PLUGIN,
        connectionName: "deep",
        payload: "DEEP",
      }).replace('"DEEP"', deep);

      plugin.send(message);
      plugin.send(event({ messageType: MessageType.EVENT, origin: MessageOrigin.PLUGIN, connectionName: "deep" }));

      await waitFor(() => expect(received).toHaveLength(1));
      expect(received[0].data).toStrictEqual({
        messageType: MessageType.EVENT,
        origin: MessageOrigin.PLUGIN,
        connectionName: "deep",
      });
      expect(logged()).toContain("Failed to handle WebSocket message");
      expect(logged()).toContain("Maximum call stack size exceeded");
    });
  });

  describe("when a client breaks the websocket protocol", () => {
    it("should log the error, drop that client and keep serving others", async () => {
      const socket = connect(port, "localhost");
      cleanups.push(() => socket.destroy());
      await once(socket, "connect");
      socket.write(
        [
          `GET /?connectionName=rude&origin=${MessageOrigin.PLUGIN} HTTP/1.1`,
          "Host: localhost",
          "Upgrade: websocket",
          "Connection: Upgrade",
          "Sec-WebSocket-Key: dGhlIHNhbXBsZSBub25jZQ==",
          "Sec-WebSocket-Version: 13",
          "",
          "",
        ].join("\r\n"),
      );
      const [handshake] = await once(socket, "data");
      expect(String(handshake)).toContain("101 Switching Protocols");

      // Clients must mask their frames, this one is a bare text frame with "hi"
      socket.write(new Uint8Array([0x81, 0x02, 0x68, 0x69]));

      await waitFor(() => expect(logged()).toContain("WebSocket connection error"));
      expect(logged()).toContain("MASK must be set");
      await waitFor(() => expect(serverObject.connections.rude.pluginStatus).toBe(PluginConnectionStatus.HANGUP));
      await open("healthy", MessageOrigin.PLUGIN);
      await waitFor(() => expect(serverObject.connections.healthy?.ws).toBeTruthy());
    });
  });
});

describe("Devtools Socket Server [ Start ]", () => {
  beforeEach(() => {
    vi.spyOn(console, "error").mockImplementation(() => undefined);
    vi.spyOn(console, "log").mockImplementation(() => undefined);
  });

  afterEach(() => {
    vi.restoreAllMocks();
  });

  it("should report a port out of range instead of throwing", async () => {
    const listeners = process.listenerCount("unhandledRejection");

    const result = await startServer({ port: 70_000, onServerCrash: vi.fn() });

    expect(result.server).toBeNull();
    expect(result.wss).toBeNull();
    expect(result.getAppConnection()).toBeNull();
    expect(result.errorMessage).toContain("70000");
    // A failed start must not react to unrelated rejections later
    expect(process.listenerCount("unhandledRejection")).toBe(listeners);
  });

  it("should stop watching for crashes once the server closes", async () => {
    const listeners = process.listenerCount("unhandledRejection");
    const onServerCrash = vi.fn();

    const result = await startServer({ port: getRandomPort(), onServerCrash });
    expect(process.listeners("unhandledRejection")).toContain(onServerCrash);
    await new Promise((resolve) => {
      result.wss?.close(resolve);
    });
    await new Promise((resolve) => {
      result.server?.close(resolve);
    });

    expect(process.listenerCount("unhandledRejection")).toBe(listeners);
  });
});
