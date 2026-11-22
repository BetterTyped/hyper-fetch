import { Client } from "@hyper-fetch/core";
import type { AddressInfo } from "net";
import type { WebSocket } from "ws";
import { WebSocketServer } from "ws";

import type { BaseMessagePayload, DevtoolsDb, DevtoolsDbEventData } from "../../src/index";
import { DbEvents, DevtoolsPlugin, EventSourceType, InternalEvents, MessageType, SocketTopics } from "../../src/index";

type Received = { data: BaseMessagePayload };

/** Stands in for the HyperFlow server */
const createHyperFlowServer = async () => {
  // A random port can be taken by another process (EADDRINUSE never emits "listening"), the system picks a free one
  const wss = new WebSocketServer({ port: 0 });
  await new Promise<void>((resolve) => {
    wss.once("listening", () => resolve());
  });
  const { port } = wss.address() as AddressInfo;
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

  const dbEvents = () =>
    received
      .map(({ data }) => data)
      .filter((data) => data.messageType === MessageType.EVENT && data.eventSource === EventSourceType.DB)
      .map((data) => ({ name: data.eventName as DbEvents, data: data.eventData as DevtoolsDbEventData }));

  const close = async () => {
    wss.clients.forEach((ws) => ws.terminate());
    await new Promise((resolve) => {
      wss.close(resolve);
    });
  };

  return { port, received, initializeApp, dbEvents, close };
};

/** A db as the plugin sees it: what `inspect` returns, and a way to say it changed */
const createFakeDb = () => {
  const listeners = new Set<() => void>();
  let version = 0;
  const db: DevtoolsDb = {
    inspect: () => ({ version }),
    onChange: (listener) => {
      listeners.add(listener);
      return () => listeners.delete(listener);
    },
  };
  const change = () => {
    version += 1;
    listeners.forEach((listener) => listener());
  };
  return { db, change };
};

describe("DevtoolsPlugin [ Dbs ]", () => {
  let hyperFlow: Awaited<ReturnType<typeof createHyperFlowServer>>;
  let plugin: ReturnType<typeof DevtoolsPlugin> | undefined;

  beforeEach(async () => {
    hyperFlow = await createHyperFlowServer();
  });

  afterEach(async () => {
    const devtoolsSocket = plugin?.data.eventHandler?.socket;
    if (devtoolsSocket) {
      devtoolsSocket.reconnectAttempts = 0;
      await devtoolsSocket.disconnect();
    }
    plugin = undefined;
    await hyperFlow.close();
  });

  const connectPlugin = async (dbs: DevtoolsDb[]) => {
    const created = DevtoolsPlugin({ appName: "App", url: `ws://localhost:${hyperFlow.port}`, dbs });
    plugin = created;
    new Client({ url: "http://localhost:5000" }).addPlugin(created);
    await vi.waitFor(() => expect(created.data.eventHandler?.isConnected).toBe(true));
    hyperFlow.initializeApp();
    await vi.waitFor(() => expect(created.data.eventHandler?.isInitialized).toBe(true));
  };

  it("sends a snapshot of every db when HyperFlow connects, and one per tick in which a db changed", async () => {
    const first = createFakeDb();
    const second = createFakeDb();
    // Changes before HyperFlow connects are not queued, the snapshot on connect covers them
    first.change();
    await connectPlugin([first.db, second.db]);
    await vi.waitFor(() => expect(hyperFlow.dbEvents()).toHaveLength(2));
    expect(hyperFlow.dbEvents().map(({ name, data }) => [name, data.dbId, data.inspection])).toStrictEqual([
      [DbEvents.SNAPSHOT, "db", { version: 1 }],
      [DbEvents.SNAPSHOT, "db #2", { version: 0 }],
    ]);

    first.change();
    first.change();
    first.change();
    await vi.waitFor(() => expect(hyperFlow.dbEvents()).toHaveLength(3));
    expect(hyperFlow.dbEvents()[2].data).toMatchObject({ dbId: "db", inspection: { version: 4 } });
    expect(typeof hyperFlow.dbEvents()[2].data.timestamp).toBe("number");
  });
});
