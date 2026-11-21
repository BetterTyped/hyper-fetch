import { AppManager } from "@hyper-fetch/core";

import { OrpcWebsocketAdapter } from "../../../src/websocket-adapter";
import { flushPromises } from "../../utils/controlled-fetch";
import { ControlledWebSocket, installControlledWebSocket } from "../../utils/controlled-websocket";
import { serialize } from "../../utils/stream-socket";
import { createWebsocketSocket } from "../../utils/websocket-socket";

describe("Orpc Websocket Adapter [ Environment ]", () => {
  let Controlled = installControlledWebSocket();
  let setup = createWebsocketSocket();

  const recreate = async (options: Parameters<typeof createWebsocketSocket>[0]) => {
    await setup.socket.disconnect();
    setup = createWebsocketSocket(options);
    await flushPromises();
  };

  const advance = async (ms: number) => {
    vi.advanceTimersByTime(ms);
    await flushPromises();
  };

  beforeEach(async () => {
    vi.useFakeTimers();
    // The reconnect delay is jittered - the lowest one is exactly the reconnect time
    vi.spyOn(Math, "random").mockReturnValue(0);
    Controlled = installControlledWebSocket();
    setup = createWebsocketSocket({ adapterOptions: { autoConnect: false } });
    await flushPromises();
  });

  afterEach(async () => {
    await setup.socket.disconnect();
    vi.useRealTimers();
    vi.unstubAllGlobals();
    vi.restoreAllMocks();
  });

  describe("when the server answers slowly", () => {
    it("should wait the connection timeout, not the reconnect time, for the handshake", async () => {
      await recreate({ reconnectTime: 100, connectionTimeout: 10_000 });

      await advance(5000);
      Controlled.last.serverOpen();
      await flushPromises();

      expect(Controlled.instances).toHaveLength(1);
      expect(setup.socket.adapter.connected).toBeTrue();
    });

    it("should start over after the connection timeout and wait the reconnect time after a lost connection", async () => {
      await recreate({ reconnectTime: 10_000, connectionTimeout: 100 });
      const created = Controlled.instances.length;

      await advance(100);
      expect(Controlled.instances).toHaveLength(created);
      // The connection timeout is followed by the reconnect delay
      await advance(10_000);
      expect(Controlled.instances).toHaveLength(created + 1);
      Controlled.last.serverOpen();
      await flushPromises();

      Controlled.last.serverClose({ code: 1006 });
      await advance(9999);
      expect(Controlled.instances).toHaveLength(created + 1);
      await advance(1);
      expect(Controlled.instances).toHaveLength(created + 2);
    });
  });

  describe("when choosing the WebSocket constructor", () => {
    it("should use the WebSocket of the adapter options before the global one", async () => {
      class InjectedWebSocket extends ControlledWebSocket {}
      vi.stubGlobal("WebSocket", null);
      await recreate({ adapterOptions: { WebSocket: InjectedWebSocket as unknown as typeof WebSocket } });
      const callback = vi.fn();

      const ws = Controlled.last;
      ws.serverOpen();
      await flushPromises();
      setup.onUpdate.listen(({ data }) => callback(data), { payload: { id: 1 } });
      ws.serverEvent("1", { data: serialize({ id: 1, name: "injected" }) });

      expect(ws).toBeInstanceOf(InjectedWebSocket);
      expect(callback).toHaveBeenCalledExactlyOnceWith({ id: 1, name: "injected" });
    });

    it("should report a runtime without WebSocket", async () => {
      vi.stubGlobal("WebSocket", null);
      await recreate({});

      expect(setup.socket.adapter.connecting).toBeFalse();
      expect(setup.errors.map(({ message }) => message)).toStrictEqual([
        "WebSocket is not available in this environment",
      ]);
    });
  });

  describe("when the socket is destroyed", () => {
    it("should leave no online subscription and connect nothing when the app goes online", async () => {
      const appManager = new AppManager();
      const before = appManager.emitter.listenerCount("online");
      await recreate({ appManager });
      expect(appManager.emitter.listenerCount("online")).toBe(before + 1);
      const created = Controlled.instances.length;

      await setup.socket.destroy();
      appManager.setOnline(false);
      appManager.setOnline(true);
      await advance(60_000);

      expect(appManager.emitter.listenerCount("online")).toBe(before);
      expect(Controlled.instances).toHaveLength(created);
    });

    it("should cancel the pending reconnect of the previous socket when the adapter is used by another one", async () => {
      const adapter = OrpcWebsocketAdapter();
      await recreate({ adapter });
      Controlled.last.serverOpen();
      await flushPromises();
      // The connection is lost, the reconnect waits for the reconnect time
      Controlled.last.serverClose({ code: 1006 });
      await flushPromises();
      const created = Controlled.instances.length;

      setup = createWebsocketSocket({ adapter, adapterOptions: { autoConnect: false } });
      await advance(60_000);

      expect(Controlled.instances).toHaveLength(created);
    });
  });

  describe("when intercepting messages", () => {
    it("should pass the topic and the event meta of the subscription to onMessage", async () => {
      await recreate({});
      const ws = Controlled.last;
      ws.serverOpen();
      await flushPromises();
      const interceptor = vi.fn(({ event }: { event: unknown }) => event);
      setup.socket.onMessage(interceptor);
      setup.onUpdate.listen(vi.fn(), { payload: { id: 1 } });

      ws.serverEvent("1", { data: serialize({ id: 1, name: "a" }), meta: { id: "7", retry: 300 } });

      expect(interceptor).toHaveBeenCalledExactlyOnceWith({
        event: { id: 1, name: "a" },
        topic: "planet/onUpdate",
        extra: { id: "7", retry: 300 },
      });
    });
  });
});
