import type { CacheValueType } from "@hyper-fetch/core";
import { Client } from "@hyper-fetch/core";
import type { WebSocket } from "ws";
import { WebSocket as NodeWebSocket, WebSocketServer } from "ws";

import type { BaseMessagePayload } from "../../src/index";
import {
  CoreEvents,
  CustomEvents,
  DevtoolsPlugin,
  EventSourceType,
  InternalEvents,
  MessageOrigin,
  MessageType,
  SocketTopics,
} from "../../src/index";

type ReceivedMessage = { topic: string; data: BaseMessagePayload };

/**
 * Stands in for the HyperFlow server: records what the plugin emits and sends it messages the way HyperFlow does.
 */
const createHyperFlowServer = async () => {
  const port = 20_000 + Math.floor(Math.random() * 40_000);
  const wss = new WebSocketServer({ port });
  await new Promise<void>((resolve) => {
    wss.once("listening", () => resolve());
  });

  const received: ReceivedMessage[] = [];
  let plugin: WebSocket | null = null;
  const queries: string[] = [];

  wss.on("connection", (ws, request) => {
    plugin = ws;
    queries.push(request.url ?? "");
    ws.on("message", (raw) => {
      received.push(JSON.parse(raw.toString()));
    });
  });

  const send = (data: Partial<BaseMessagePayload> & Record<string, unknown>) => {
    plugin?.send(JSON.stringify({ topic: SocketTopics.PLUGIN_LISTENER, data }));
  };

  const sendEvent = (eventSource: EventSourceType, eventName: CoreEvents, eventData: unknown) => {
    send({
      messageType: MessageType.EVENT,
      eventSource,
      eventName,
      eventData,
      connectionName: "App",
      origin: MessageOrigin.APP,
      isTriggeredExternally: true,
    });
  };

  const initializeApp = () => {
    send({ messageType: MessageType.INTERNAL, eventType: InternalEvents.APP_INITIALIZED });
  };

  const close = async () => {
    wss.clients.forEach((ws) => ws.terminate());
    await new Promise((resolve) => {
      wss.close(resolve);
    });
  };

  const events = () => received.filter(({ data }) => data.messageType === MessageType.EVENT).map(({ data }) => data);

  return {
    port,
    received,
    queries,
    events,
    send,
    sendEvent,
    initializeApp,
    close,
    isConnected: () => !!plugin,
  };
};

describe("DevtoolsPlugin [ Event handler ]", () => {
  let server: Awaited<ReturnType<typeof createHyperFlowServer>>;
  let client: Client;
  let plugin: ReturnType<typeof DevtoolsPlugin>;

  beforeEach(async () => {
    server = await createHyperFlowServer();
    client = new Client({ url: "http://localhost:5000" });
    plugin = DevtoolsPlugin({ appName: "App", url: `ws://localhost:${server.port}`, environment: "staging" });
    client.addPlugin(plugin);
    await vi.waitFor(() => expect(plugin.data.eventHandler?.isConnected).toBe(true));
  });

  afterEach(async () => {
    const socket = plugin.data.eventHandler?.socket;
    if (socket) {
      socket.reconnectAttempts = 0;
      await socket.disconnect();
    }
    await server.close();
  });

  const initialize = async () => {
    server.initializeApp();
    await vi.waitFor(() => expect(plugin.data.eventHandler?.isInitialized).toBe(true));
  };

  const createCacheValue = (overrides: Partial<CacheValueType> = {}): CacheValueType => ({
    data: { id: 1 },
    error: null,
    status: 200,
    success: true,
    extra: { headers: {} },
    requestTimestamp: Date.now(),
    responseTimestamp: Date.now(),
    retries: 0,
    isCanceled: false,
    isOffline: false,
    willRetry: false,
    addedTimestamp: Date.now(),
    triggerTimestamp: Date.now(),
    cacheKey: "GET_/users",
    scope: null,
    staleTime: 60_000,
    cacheTime: 120_000,
    version: client.cache.version,
    cached: true,
    hydrated: false,
    ...overrides,
  });

  describe("when connecting", () => {
    it("should identify itself as a plugin of the application", () => {
      const query = new URLSearchParams(server.queries[0].replace(/^.*\?/, ""));
      expect(query.get("connectionName")).toBe("App");
      expect(query.get("origin")).toBe(MessageOrigin.PLUGIN);
    });

    it("should introduce the client to HyperFlow", async () => {
      await vi.waitFor(() => expect(server.received.length).toBeGreaterThan(0));

      const [handshake] = server.received;
      expect(handshake.topic).toBe(SocketTopics.PLUGIN_EMITTER);
      expect(handshake.data).toMatchObject({
        messageType: MessageType.INTERNAL,
        eventType: InternalEvents.PLUGIN_INITIALIZED,
        connectionName: "App",
        environment: "staging",
        origin: MessageOrigin.PLUGIN,
        clientOptions: { url: "http://localhost:5000" },
        adapterOptions: { name: client.adapter.name },
      });
    });

    it("should default the environment to the application name", async () => {
      const other = await createHyperFlowServer();
      const otherPlugin = DevtoolsPlugin({ appName: "Other", url: `ws://localhost:${other.port}` });
      new Client({ url: "http://localhost:5000" }).addPlugin(otherPlugin);

      await vi.waitFor(() => expect(other.received.length).toBeGreaterThan(0));
      expect(other.received[0].data.environment).toBe("Other");

      otherPlugin.data.eventHandler!.socket.reconnectAttempts = 0;
      await otherPlugin.data.eventHandler?.socket.disconnect();
      await other.close();
    });
  });

  describe("when streaming events", () => {
    it("should hold events until HyperFlow confirms the handshake and then send them in order", async () => {
      client.cache.events.emitInvalidation("first");
      client.cache.events.emitInvalidation("second");
      expect(server.events()).toHaveLength(0);

      await initialize();

      await vi.waitFor(() => {
        const invalidations = server
          .events()
          .filter((event) => event.eventSource === EventSourceType.CACHE)
          .map((event) => event.eventData);
        expect(invalidations).toStrictEqual(expect.arrayContaining(["first", "second"]));
        expect(invalidations.indexOf("first")).toBeLessThan(invalidations.indexOf("second"));
      });
    });

    it("should stream events from every module of the client", async () => {
      await initialize();

      client.cache.events.emitInvalidation("key");
      client.fetchDispatcher.stop("fetch-queue");
      client.submitDispatcher.stop("submit-queue");
      client.appManager.setOnline(false);

      await vi.waitFor(() => {
        const sources = new Set(server.events().map((event) => event.eventSource));
        expect(sources).toContain(EventSourceType.CACHE);
        expect(sources).toContain(EventSourceType.FETCH_DISPATCHER);
        expect(sources).toContain(EventSourceType.SUBMIT_DISPATCHER);
        expect(sources).toContain(EventSourceType.APP_MANAGER);
      });
      expect(server.events().every((event) => event.connectionName === "App")).toBe(true);
      expect(server.events().every((event) => event.origin === MessageOrigin.PLUGIN)).toBe(true);
    });

    it("should stream the request lifecycle", async () => {
      await initialize();
      client.requestManager.events.emitAbort({
        requestId: "id",
        request: client.createRequest()({ endpoint: "/users" }),
      });

      await vi.waitFor(() =>
        expect(server.events().some((event) => event.eventSource === EventSourceType.REQUEST_MANAGER)).toBe(true),
      );
    });

    it("should report created requests", async () => {
      await initialize();
      client.createRequest()({ endpoint: "/users" });

      await vi.waitFor(() => {
        const created = server.events().find((event) => event.eventName === CustomEvents.REQUEST_CREATED);
        expect(created?.eventSource).toBe(EventSourceType.CUSTOM_EVENT);
      });
    });

    it("should not send back events that HyperFlow triggered", async () => {
      await initialize();

      client.cache.events.emitInvalidation("from-hyperflow", true);
      client.cache.events.emitInvalidation("from-app");

      await vi.waitFor(() => expect(server.events().some((event) => event.eventData === "from-app")).toBe(true));
      expect(server.events().some((event) => event.eventData === "from-hyperflow")).toBe(false);
    });
  });

  describe("when HyperFlow changes the application", () => {
    beforeEach(async () => {
      await initialize();
    });

    it("should write cache data into the application's cache", async () => {
      const onData = vi.fn();
      client.cache.events.onDataByKey("GET_/users", onData);
      const value = createCacheValue({ data: { id: 99 } });

      server.sendEvent(EventSourceType.CACHE, CoreEvents.ON_CACHE_CHANGE, value);

      await vi.waitFor(() => expect(client.cache.storage.get("GET_/users")?.data).toStrictEqual({ id: 99 }));
      expect(onData).toHaveBeenCalled();
    });

    it("should make invalidated data stale in the application's cache", async () => {
      client.cache.storage.set("GET_/users", createCacheValue({ staleTime: 60_000 }));
      const onInvalidate = vi.fn();
      client.cache.events.onInvalidateByKey("GET_/users", onInvalidate);

      server.sendEvent(EventSourceType.CACHE, CoreEvents.ON_CACHE_INVALIDATION, "GET_/users");

      await vi.waitFor(() => expect(onInvalidate).toHaveBeenCalled());
      expect(client.cache.storage.get("GET_/users")?.staleTime).toBe(0);
      expect(client.cache.storage.get("GET_/users")?.data).toStrictEqual({ id: 1 });
    });

    it("should not create entries when invalidating a missing key", async () => {
      const onInvalidate = vi.fn();
      client.cache.events.onInvalidateByKey("GET_/missing", onInvalidate);

      server.sendEvent(EventSourceType.CACHE, CoreEvents.ON_CACHE_INVALIDATION, "GET_/missing");

      await vi.waitFor(() => expect(onInvalidate).toHaveBeenCalled());
      expect(client.cache.storage.get("GET_/missing")).toBeUndefined();
    });

    it("should delete entries from the application's cache", async () => {
      client.cache.storage.set("GET_/users", createCacheValue());

      server.sendEvent(EventSourceType.CACHE, CoreEvents.ON_CACHE_DELETE, "GET_/users");

      await vi.waitFor(() => expect(client.cache.storage.get("GET_/users")).toBeUndefined());
    });

    it("should stop and start fetch queues", async () => {
      server.sendEvent(EventSourceType.FETCH_DISPATCHER, CoreEvents.ON_FETCH_QUEUE_STATUS_CHANGE, {
        queryKey: "GET_/users",
        stopped: true,
        requests: [],
      });
      await vi.waitFor(() => expect(client.fetchDispatcher.getQueue("GET_/users").stopped).toBe(true));
      expect(client.submitDispatcher.getQueue("GET_/users").stopped).toBe(false);

      server.sendEvent(EventSourceType.FETCH_DISPATCHER, CoreEvents.ON_FETCH_QUEUE_STATUS_CHANGE, {
        queryKey: "GET_/users",
        stopped: false,
        requests: [],
      });
      await vi.waitFor(() => expect(client.fetchDispatcher.getQueue("GET_/users").stopped).toBe(false));
    });

    it("should stop and start submit queues", async () => {
      server.sendEvent(EventSourceType.SUBMIT_DISPATCHER, CoreEvents.ON_SUBMIT_QUEUE_STATUS_CHANGE, {
        queryKey: "POST_/users",
        stopped: true,
        requests: [],
      });
      await vi.waitFor(() => expect(client.submitDispatcher.getQueue("POST_/users").stopped).toBe(true));
      expect(client.fetchDispatcher.getQueue("POST_/users").stopped).toBe(false);

      server.sendEvent(EventSourceType.SUBMIT_DISPATCHER, CoreEvents.ON_SUBMIT_QUEUE_STATUS_CHANGE, {
        queryKey: "POST_/users",
        stopped: false,
        requests: [],
      });
      await vi.waitFor(() => expect(client.submitDispatcher.getQueue("POST_/users").stopped).toBe(false));
    });

    it("should clear fetch and submit queues", async () => {
      const fetchClear = vi.spyOn(client.fetchDispatcher, "clearQueue");
      const submitClear = vi.spyOn(client.submitDispatcher, "clearQueue");

      server.sendEvent(EventSourceType.FETCH_DISPATCHER, CoreEvents.ON_FETCH_QUEUE_CLEAR, { queryKey: "GET_/users" });
      server.sendEvent(EventSourceType.SUBMIT_DISPATCHER, CoreEvents.ON_SUBMIT_QUEUE_CLEAR, {
        queryKey: "POST_/users",
      });

      await vi.waitFor(() => {
        expect(fetchClear).toHaveBeenCalledWith("GET_/users");
        expect(submitClear).toHaveBeenCalledWith("POST_/users");
      });
    });

    it("should set the loading state of requests", async () => {
      const onLoading = vi.fn();
      client.requestManager.events.onLoading(onLoading);
      const request = client.createRequest()({ endpoint: "/users" });

      server.sendEvent(EventSourceType.REQUEST_MANAGER, CoreEvents.ON_REQUEST_LOADING, {
        request: request.toJSON(),
        requestId: "",
        loading: true,
        isRetry: false,
        isOffline: false,
      });

      await vi.waitFor(() => expect(onLoading).toHaveBeenCalledWith(expect.objectContaining({ loading: true }), true));
    });

    it("should ignore request lifecycle events it doesn't apply", async () => {
      const onResponse = vi.fn();
      client.requestManager.events.onResponse(onResponse);
      const onLoading = vi.fn();
      client.requestManager.events.onLoading(onLoading);

      server.sendEvent(EventSourceType.REQUEST_MANAGER, "ON_REQUEST_START" as CoreEvents, {});
      server.sendEvent(EventSourceType.CACHE, CoreEvents.ON_CACHE_DELETE, "GET_/users");
      client.cache.storage.set("GET_/users", createCacheValue());
      server.sendEvent(EventSourceType.CACHE, CoreEvents.ON_CACHE_DELETE, "GET_/users");

      await vi.waitFor(() => expect(client.cache.storage.get("GET_/users")).toBeUndefined());
      expect(onResponse).not.toHaveBeenCalled();
      expect(onLoading).not.toHaveBeenCalled();
    });

    it("should keep working after unknown messages", async () => {
      server.send({ messageType: MessageType.INTERNAL, eventType: InternalEvents.PLUGIN_HANGUP });
      server.send({ messageType: "UNKNOWN" as MessageType });
      client.cache.storage.set("GET_/users", createCacheValue());

      server.sendEvent(EventSourceType.CACHE, CoreEvents.ON_CACHE_DELETE, "GET_/users");

      await vi.waitFor(() => expect(client.cache.storage.get("GET_/users")).toBeUndefined());
    });
  });

  describe("when running in Node.js", () => {
    const connectPlugin = async (options: Partial<Parameters<typeof DevtoolsPlugin>[0]> = {}) => {
      const other = await createHyperFlowServer();
      const otherPlugin = DevtoolsPlugin({ appName: "Backend", url: `ws://localhost:${other.port}`, ...options });
      new Client({ url: "http://localhost:5000" }).addPlugin(otherPlugin);
      const cleanup = async () => {
        const socket = otherPlugin.data.eventHandler?.socket;
        if (socket) {
          socket.reconnectAttempts = 0;
          await socket.disconnect();
        }
        await other.close();
      };
      return { other, otherPlugin, cleanup };
    };

    it("should run without a window", () => {
      expect(typeof window).toBe("undefined");
    });

    it("should connect with the native WebSocket", async () => {
      const { other, otherPlugin, cleanup } = await connectPlugin();
      try {
        await vi.waitFor(() => expect(otherPlugin.data.eventHandler?.isConnected).toBe(true));
        await vi.waitFor(() => expect(other.received[0]?.data.connectionName).toBe("Backend"));
      } finally {
        await cleanup();
      }
    });

    it("should connect with the webSocketImpl option where there is no global WebSocket", async () => {
      const globalWebSocket = globalThis.WebSocket;
      Reflect.deleteProperty(globalThis, "WebSocket");
      const { other, otherPlugin, cleanup } = await connectPlugin({ webSocketImpl: NodeWebSocket });
      try {
        await vi.waitFor(() => expect(otherPlugin.data.eventHandler?.isConnected).toBe(true));
        await vi.waitFor(() => expect(other.received[0]?.data.eventType).toBe(InternalEvents.PLUGIN_INITIALIZED));
      } finally {
        globalThis.WebSocket = globalWebSocket;
        await cleanup();
      }
    });
  });
});
