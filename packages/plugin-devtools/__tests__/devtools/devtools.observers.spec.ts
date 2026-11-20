import { Client } from "@hyper-fetch/core";
import { createHttpMockingServer } from "@hyper-fetch/testing";
import type { AddressInfo } from "net";
import type { WebSocket } from "ws";
import { WebSocketServer } from "ws";

import { createObserversReporter } from "../../src/devtools.observers-reporter";
import type { BaseMessagePayload, DevtoolsObserversEventData } from "../../src/index";
import {
  DevtoolsPlugin,
  EventSourceType,
  InternalEvents,
  MessageType,
  ObserverEvents,
  SocketTopics,
} from "../../src/index";

const { startServer, stopServer, resetMocks, mockRequest } = createHttpMockingServer();

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

  /** The plugin sends its handshake as soon as it connects, HyperFlow answers only after receiving it */
  const receivedHandshake = () =>
    received.some(
      ({ data }) => data.messageType === MessageType.INTERNAL && data.eventType === InternalEvents.PLUGIN_INITIALIZED,
    );

  const observerEvents = () =>
    received
      .map(({ data }) => data)
      .filter((data) => data.messageType === MessageType.EVENT && data.eventSource === EventSourceType.OBSERVERS)
      .map((data) => {
        expect(data.eventName).toBe(ObserverEvents.CHANGED);
        return data.eventData as DevtoolsObserversEventData;
      });

  const close = async () => {
    wss.clients.forEach((ws) => ws.terminate());
    await new Promise((resolve) => {
      wss.close(resolve);
    });
  };

  return { port, received, receivedHandshake, initializeApp, observerEvents, close };
};

describe("DevtoolsPlugin [ Observers ]", () => {
  let hyperFlow: Awaited<ReturnType<typeof createHyperFlowServer>>;
  let plugin: ReturnType<typeof DevtoolsPlugin> | undefined;
  let client = new Client({ url: "http://localhost:5000" });
  let getUsers = client.createRequest<{ response: { id: number }[] }>()({ endpoint: "/users" });
  let postUser = client.createRequest<{ response: { id: number } }>()({ endpoint: "/users", method: "POST" });

  beforeAll(() => startServer());
  afterAll(() => stopServer());

  beforeEach(async () => {
    resetMocks();
    hyperFlow = await createHyperFlowServer();
    client = new Client({ url: "http://localhost:5000" });
    getUsers = client.createRequest<{ response: { id: number }[] }>()({ endpoint: "/users" });
    postUser = client.createRequest<{ response: { id: number } }>()({ endpoint: "/users", method: "POST" });
    mockRequest(getUsers, { data: [{ id: 1 }] });
    mockRequest(postUser, { data: { id: 2 } });
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

  const connectPlugin = async ({ initialize = true }: { initialize?: boolean } = {}) => {
    const created = DevtoolsPlugin({ appName: "App", url: `ws://localhost:${hyperFlow.port}` });
    plugin = created;
    client.addPlugin(created);
    // msw intercepts WebSocket too: it opens the plugin's socket at once and connects to this server only afterwards,
    // so an answer sent right after the plugin connected could find no connection here and get lost
    await vi.waitFor(() => expect(hyperFlow.receivedHandshake()).toBe(true));
    if (initialize) {
      await initializeApp();
    }
  };

  const initializeApp = async () => {
    hyperFlow.initializeApp();
    await vi.waitFor(() => expect(plugin?.data.eventHandler?.isInitialized).toBe(true));
  };

  const lastObservers = () => hyperFlow.observerEvents().at(-1);

  describe("When a cache key gets its first data", () => {
    it("should report the observers it already had", async () => {
      await connectPlugin();
      client.cache.events.onDataByKey(getUsers.cacheKey, vi.fn());
      client.cache.events.onDataByKey(getUsers.cacheKey, vi.fn());

      await getUsers.send();

      await vi.waitFor(() => {
        expect(hyperFlow.observerEvents()).toContainEqual({ cache: { [getUsers.cacheKey]: 2 }, queues: {} });
      });
    });

    it("should report every observer subscribing and unsubscribing from then on", async () => {
      await connectPlugin();
      const unmount = client.cache.events.onDataByKey(getUsers.cacheKey, vi.fn());
      await getUsers.send();
      await vi.waitFor(() => expect(lastObservers()).toStrictEqual({ cache: { [getUsers.cacheKey]: 1 }, queues: {} }));

      client.cache.events.onDataByKey(getUsers.cacheKey, vi.fn());
      await vi.waitFor(() => expect(lastObservers()).toStrictEqual({ cache: { [getUsers.cacheKey]: 2 }, queues: {} }));

      unmount();
      await vi.waitFor(() => expect(lastObservers()).toStrictEqual({ cache: { [getUsers.cacheKey]: 1 }, queues: {} }));
    });

    it("should report a key once when it gets data again", async () => {
      await connectPlugin();
      client.cache.events.onDataByKey(getUsers.cacheKey, vi.fn());

      await getUsers.send();
      await getUsers.send();
      await postUser.send();

      // Events arrive in order, so the report of the last request means the earlier ones arrived too
      await vi.waitFor(() => {
        expect(hyperFlow.observerEvents()).toContainEqual({ cache: {}, queues: { [postUser.queryKey]: 0 } });
      });
      const reports = hyperFlow.observerEvents();
      expect(reports.filter(({ cache }) => getUsers.cacheKey in cache)).toStrictEqual([
        { cache: { [getUsers.cacheKey]: 1 }, queues: {} },
      ]);
      expect(reports.filter(({ queues }) => getUsers.queryKey in queues)).toHaveLength(1);
    });
  });

  describe("When requests go through a queue", () => {
    it("should count the loading and queue observers of the query key in both dispatchers", async () => {
      await connectPlugin();
      client.requestManager.events.onLoadingByQueue(getUsers.queryKey, vi.fn());
      client.fetchDispatcher.events.onQueueChangeByKey(getUsers.queryKey, vi.fn());
      const unmount = client.submitDispatcher.events.onQueueChangeByKey(getUsers.queryKey, vi.fn());

      await getUsers.send();
      await vi.waitFor(() => {
        expect(hyperFlow.observerEvents()).toContainEqual({ cache: {}, queues: { [getUsers.queryKey]: 3 } });
      });

      unmount();
      await vi.waitFor(() => expect(lastObservers()).toStrictEqual({ cache: {}, queues: { [getUsers.queryKey]: 2 } }));

      client.requestManager.events.onLoadingByQueue(getUsers.queryKey, vi.fn());
      await vi.waitFor(() => expect(lastObservers()).toStrictEqual({ cache: {}, queues: { [getUsers.queryKey]: 3 } }));
    });

    it("should track the queues of the submit dispatcher", async () => {
      await connectPlugin();
      client.requestManager.events.onLoadingByQueue(postUser.queryKey, vi.fn());

      await postUser.send();

      await vi.waitFor(() => {
        expect(hyperFlow.observerEvents()).toContainEqual({ cache: {}, queues: { [postUser.queryKey]: 1 } });
      });
    });
  });

  describe("When HyperFlow connects", () => {
    it("should send the observers of every key at once instead of queueing their changes", async () => {
      await connectPlugin({ initialize: false });
      client.cache.events.onDataByKey(getUsers.cacheKey, vi.fn());
      client.requestManager.events.onLoadingByQueue(getUsers.queryKey, vi.fn());
      await getUsers.send();
      client.cache.events.onDataByKey(getUsers.cacheKey, vi.fn());

      await initializeApp();

      await vi.waitFor(() => expect(hyperFlow.observerEvents()).toHaveLength(1));
      expect(lastObservers()).toStrictEqual({
        cache: { [getUsers.cacheKey]: 2 },
        queues: { [getUsers.queryKey]: 1 },
      });
    });

    it("should send the snapshot again to a reloaded HyperFlow", async () => {
      await connectPlugin();
      client.cache.events.onDataByKey(getUsers.cacheKey, vi.fn());
      await getUsers.send();
      await vi.waitFor(() => expect(lastObservers()).toBeDefined());
      hyperFlow.received.length = 0;

      hyperFlow.initializeApp();

      await vi.waitFor(() => {
        expect(lastObservers()).toStrictEqual({
          cache: { [getUsers.cacheKey]: 1 },
          queues: { [getUsers.queryKey]: 0 },
        });
      });
    });

    it("should send an empty snapshot when the app has no keys yet", async () => {
      await connectPlugin();

      await vi.waitFor(() => expect(lastObservers()).toStrictEqual({ cache: {}, queues: {} }));
    });
  });

  describe("When the reporter is unmounted", () => {
    it("should stop following the keys and their observers", async () => {
      const report = vi.fn();
      const reporter = createObserversReporter({ client, report });
      await getUsers.send();
      expect(report).toHaveBeenCalledWith({ cache: { [getUsers.cacheKey]: 0 }, queues: {} });
      report.mockClear();

      reporter.unmount();
      client.cache.events.onDataByKey(getUsers.cacheKey, vi.fn());
      client.requestManager.events.onLoadingByQueue(getUsers.queryKey, vi.fn());
      await postUser.send();

      expect(report).not.toHaveBeenCalled();
      reporter.sendSnapshot();
      expect(report).toHaveBeenCalledWith({ cache: {}, queues: {} });
    });
  });
});
