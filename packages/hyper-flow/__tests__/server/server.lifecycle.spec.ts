import { createClient } from "@hyper-fetch/core";
import { InternalEvents, MessageOrigin, MessageType, SocketTopics } from "@hyper-fetch/plugin-devtools";
import type { StartServer } from "@server/server";
import { startServer } from "@server/server";
import { PluginConnectionStatus } from "@server/types/connection.type";
import { waitFor } from "@testing-library/react";
import { WebSocket } from "ws";

import { connectDevtoolsClient, connectDevtoolsFrontend } from "../helpers/helpers";
import { getRandomPort } from "../utils/hyper-flow";
import { ConnectionName } from "@/constants/connection.name";

const openRawSocket = async (port: number, query: string) => {
  const ws = new WebSocket(`ws://localhost:${port}?${query}`);
  await new Promise<void>((resolve, reject) => {
    ws.once("open", () => resolve());
    ws.once("error", reject);
  });
  return ws;
};

describe("Devtools Socket Server [ Lifecycle ]", () => {
  let serverObject: StartServer;
  let port: number;
  const sockets: WebSocket[] = [];
  const disconnects: (() => Promise<unknown>)[] = [];

  beforeEach(async () => {
    port = getRandomPort();
    serverObject = await startServer({ port });
  });

  afterEach(async () => {
    sockets.forEach((ws) => ws.terminate());
    sockets.length = 0;
    await Promise.all(disconnects.map((disconnect) => disconnect()));
    disconnects.length = 0;
    serverObject.wss?.clients.forEach((ws) => ws.terminate());
    await new Promise((resolve) => {
      serverObject.wss?.close(resolve);
    });
    await new Promise((resolve) => {
      serverObject.server?.close(resolve);
    });
  });

  const connectPlugin = (appName: string) => {
    const result = connectDevtoolsClient({ appName, socketPort: port });
    disconnects.push(async () => {
      const socket = result.plugin.data.eventHandler?.socket;
      if (socket) {
        socket.reconnectAttempts = 0;
        await socket.disconnect();
      }
    });
    return result;
  };

  it("should mark a plugin as connected again after it reconnects", async () => {
    const { connections } = serverObject;
    const { plugin } = connectPlugin("test-client");
    await waitFor(() => expect(connections["test-client"]?.ws).toBeTruthy());

    await plugin.data.eventHandler?.socket.disconnect();
    await waitFor(() => expect(connections["test-client"].pluginStatus).toBe(PluginConnectionStatus.HANGUP));

    await plugin.data.eventHandler?.socket.connect();
    await waitFor(() => expect(connections["test-client"].ws).toBeTruthy());
    expect(connections["test-client"].pluginStatus).toBe(PluginConnectionStatus.CONNECTED);
  });

  it("should survive malformed and unknown messages", async () => {
    const raw = await openRawSocket(port, `connectionName=broken&origin=${MessageOrigin.PLUGIN}`);
    sockets.push(raw);

    raw.send("this is not json");
    raw.send(JSON.stringify({ data: { messageType: "UNKNOWN", connectionName: "broken" } }));
    raw.send(
      JSON.stringify({ data: { messageType: MessageType.EVENT, origin: "SOMEWHERE", connectionName: "broken" } }),
    );
    raw.send(JSON.stringify({ topic: SocketTopics.PLUGIN_EMITTER }));

    const { connections } = serverObject;
    connectPlugin("healthy");
    await waitFor(() => expect(connections.healthy?.ws).toBeTruthy());
  });

  it("should not crash when the app talks to a plugin that never connected", async () => {
    const frontend = await connectDevtoolsFrontend({ socketPort: port });
    disconnects.push(() => frontend.disconnect());
    const raw = await openRawSocket(port, `connectionName=other&origin=${MessageOrigin.APP}`);
    sockets.push(raw);

    raw.send(
      JSON.stringify({
        data: {
          messageType: MessageType.EVENT,
          origin: MessageOrigin.APP,
          connectionName: "ghost",
          eventName: "anything",
        },
      }),
    );
    raw.send(
      JSON.stringify({
        data: {
          messageType: MessageType.INTERNAL,
          eventType: InternalEvents.PLUGIN_INITIALIZED,
          origin: MessageOrigin.PLUGIN,
          connectionName: "ghost",
        },
      }),
    );

    const { connections } = serverObject;
    connectPlugin("healthy");
    await waitFor(() => expect(connections.healthy?.ws).toBeTruthy());
  });

  it("should ignore connections without a name or origin", async () => {
    const raw = await openRawSocket(port, "connectionName=");
    sockets.push(raw);
    raw.send(JSON.stringify({ data: { messageType: MessageType.INTERNAL } }));

    const { connections } = serverObject;
    connectPlugin("healthy");
    await waitFor(() => expect(connections.healthy?.ws).toBeTruthy());
    expect(Object.keys(connections)).toStrictEqual(["healthy"]);
  });

  it("should keep many applications apart", async () => {
    const { connections } = serverObject;
    connectPlugin("first");
    connectPlugin("second");

    await waitFor(() => {
      expect(connections.first?.ws).toBeTruthy();
      expect(connections.second?.ws).toBeTruthy();
    });
    expect(connections.first.ws).not.toBe(connections.second.ws);
  });

  it("should replay the handshake of every known plugin to a frontend that connects late", async () => {
    const { connections } = serverObject;
    connectPlugin("first");
    connectPlugin("second");
    await waitFor(() => {
      expect(connections.first?.clientMetaData).toBeTruthy();
      expect(connections.second?.clientMetaData).toBeTruthy();
    });

    const received: string[] = [];
    const frontend = await connectDevtoolsFrontend({ socketPort: port });
    disconnects.push(() => frontend.disconnect());
    frontend
      .createListener<{ connectionName: string; eventType: InternalEvents }>()({
        topic: SocketTopics.APP_MAIN_LISTENER,
      })
      .listen(({ data }) => {
        if (data.eventType === InternalEvents.PLUGIN_INITIALIZED) {
          received.push(data.connectionName);
        }
      });
    await frontend.disconnect();
    await frontend.connect();

    await waitFor(() => expect(received.toSorted()).toStrictEqual(["first", "second"]));
    expect(connections[ConnectionName.HF_DEVTOOLS_FRONTEND]).toBeUndefined();
  });

  it("should expose the current frontend connection", async () => {
    expect(serverObject.getAppConnection()).toBeNull();
    const frontend = await connectDevtoolsFrontend({ socketPort: port });
    disconnects.push(() => frontend.disconnect());
    await waitFor(() => expect(serverObject.getAppConnection()).not.toBeNull());
    await frontend.disconnect();
    await waitFor(() => expect(serverObject.getAppConnection()).toBeNull());
  });

  it("should forward plugin events to the frontend", async () => {
    const frontend = await connectDevtoolsFrontend({ socketPort: port });
    disconnects.push(() => frontend.disconnect());
    const events: string[] = [];
    frontend
      .createListener<{ eventName: string }>()({ topic: SocketTopics.APP_INSTANCE_LISTENER })
      .listen(({ data }) => events.push(data.eventName));

    const client = createClient({ url: "http://localhost:5000" });
    const { plugin } = connectDevtoolsClient({ client, appName: "events", socketPort: port });
    disconnects.push(async () => {
      const socket = plugin.data.eventHandler?.socket;
      if (socket) {
        socket.reconnectAttempts = 0;
        await socket.disconnect();
      }
    });
    await waitFor(() => expect(serverObject.connections.events?.clientMetaData).toBeTruthy());

    // The frontend has to confirm the handshake before the plugin flushes events
    frontend
      .createEmitter()({ topic: SocketTopics.PLUGIN_LISTENER })
      .emit({
        payload: {
          messageType: MessageType.INTERNAL,
          eventType: InternalEvents.APP_INITIALIZED,
          connectionName: "events",
          origin: MessageOrigin.APP,
        },
      });
    await waitFor(() => expect(plugin.data.eventHandler?.isInitialized).toBeTrue());

    client.cache.events.emitInvalidation("some-key");
    await waitFor(() => expect(events.length).toBeGreaterThan(0));
  });
});
