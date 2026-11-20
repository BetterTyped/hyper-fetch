import { flushPromises } from "../../utils/controlled-fetch";
import type { ControlledWebSocket } from "../../utils/controlled-websocket";
import { installControlledWebSocket } from "../../utils/controlled-websocket";
import { serialize } from "../../utils/stream-socket";
import { createWebsocketSocket } from "../../utils/websocket-socket";

const defaultPayload = { id: 1 };

describe("Orpc Websocket Adapter [ Lifecycle ]", () => {
  let Controlled = installControlledWebSocket();
  let setup = createWebsocketSocket();

  const recreate = async (options: Parameters<typeof createWebsocketSocket>[0]) => {
    await setup.socket.disconnect();
    setup = createWebsocketSocket(options);
    await flushPromises();
  };

  const open = async (instance: ControlledWebSocket = Controlled.last) => {
    instance.serverOpen();
    await flushPromises();
    return instance;
  };

  const subscribe = (payload: { id: number } = defaultPayload) => {
    const callback = vi.fn();
    const unsubscribe = setup.onUpdate.setPayload(payload).listen(({ data, extra }) => callback(data, extra));
    return { callback, unsubscribe };
  };

  const advance = async (ms: number) => {
    vi.advanceTimersByTime(ms);
    await flushPromises();
  };

  beforeEach(async () => {
    vi.useFakeTimers();
    Controlled = installControlledWebSocket();
    setup = createWebsocketSocket();
    await flushPromises();
  });

  afterEach(async () => {
    await setup.socket.disconnect();
    vi.useRealTimers();
    vi.unstubAllGlobals();
  });

  describe("when connecting", () => {
    it("should be connecting until the server accepts the connection", async () => {
      expect(setup.socket.adapter.connecting).toBeTrue();
      expect(setup.socket.adapter.connected).toBeFalse();

      await open();

      expect(setup.socket.adapter.connecting).toBeFalse();
      expect(setup.socket.adapter.connected).toBeTrue();
    });

    it("should send the requests of the listeners added before the connection opened", async () => {
      subscribe({ id: 1 });
      subscribe({ id: 2 });
      expect(Controlled.last.sent).toStrictEqual([]);

      const ws = await open();

      expect(ws.requests.map(({ p }) => p?.b)).toStrictEqual([{ json: { id: 1 } }, { json: { id: 2 } }]);
    });

    it("should send the request of a listener added by an onConnected callback once", async () => {
      subscribe({ id: 1 });
      setup.socket.onConnected(() => {
        subscribe({ id: 2 });
      });

      const ws = await open();

      expect(ws.requests.map(({ p }) => p?.b)).toStrictEqual([{ json: { id: 2 } }, { json: { id: 1 } }]);
    });

    it("should connect with the details of the onConnect interceptors", async () => {
      await recreate({ adapterOptions: { autoConnect: false, headers: { authorization: "Bearer 1" } } });
      setup.socket.onConnect(({ connection }) => ({
        ...connection,
        url: "ws://other:4000",
        adapterOptions: undefined,
      }));
      subscribe();

      const connecting = setup.socket.adapter.connect();
      await flushPromises();
      const ws = await open();
      await connecting;

      expect(ws.url).toBe("ws://other:4000");
      expect(ws.protocols).toBeUndefined();
      expect(ws.requests[0].p?.h).toBeUndefined();
    });

    it("should report a WebSocket that can't be created", async () => {
      await recreate({ adapterOptions: { autoConnect: false } });
      Controlled.constructorError = new SyntaxError("Invalid url");

      await expect(setup.socket.adapter.connect()).resolves.toBeFalse();

      expect(setup.socket.adapter.connecting).toBeFalse();
      expect(setup.errors.map(({ message }) => message)).toStrictEqual(["Invalid url"]);
    });

    it("should join a connection attempt in progress", async () => {
      await recreate({ adapterOptions: { autoConnect: false } });
      const created = Controlled.instances.length;

      const first = setup.socket.adapter.connect();
      const second = setup.socket.adapter.connect();
      await flushPromises();
      await open();

      await expect(Promise.all([first, second])).resolves.toStrictEqual([true, true]);
      expect(Controlled.instances).toHaveLength(created + 1);
    });

    it("should start a new attempt after disconnect cancelled the one that was preparing", async () => {
      await recreate({ adapterOptions: { autoConnect: false } });
      const created = Controlled.instances.length;

      const cancelled = setup.socket.adapter.connect();
      await setup.socket.disconnect();
      const next = setup.socket.adapter.connect();
      await flushPromises();
      await open();

      await expect(next).resolves.toBeTrue();
      await expect(cancelled).resolves.toBeFalse();
      expect(Controlled.instances).toHaveLength(created + 1);
    });

    it("should resolve with the current state when it can't connect right now", async () => {
      await open();

      await expect(setup.socket.adapter.connect()).resolves.toBeTrue();
    });

    it("should start over when the server does not answer in time", async () => {
      subscribe();

      await advance(5000);
      const ws = await open();

      expect(Controlled.instances).toHaveLength(2);
      expect(Controlled.instances[0].readyState).toBe(Controlled.CLOSED);
      expect(ws.requests).toHaveLength(1);
    });
  });

  describe("when the connection is lost", () => {
    it("should report it and reconnect with the last event ids", async () => {
      const { callback } = subscribe({ id: 1 });
      subscribe({ id: 2 });
      const first = await open();
      first.serverStartIterator("1");
      first.serverEvent("1", { data: serialize({ id: 1, name: "a" }), meta: { id: "5" } });
      const disconnected = vi.fn();
      setup.socket.events.onDisconnected(disconnected);

      first.serverClose({ code: 1006 });
      await flushPromises();

      expect(setup.socket.adapter.connected).toBeFalse();
      expect(disconnected).toHaveBeenCalledOnce();
      expect(setup.errors).toHaveLength(1);

      await advance(5000);
      const second = await open();

      expect(second.requests.map(({ i, p }) => [i, p?.b, p?.h])).toStrictEqual([
        ["3", { json: { id: 1 } }, { "last-event-id": "5" }],
        ["4", { json: { id: 2 } }, undefined],
      ]);

      second.serverStartIterator("3");
      first.serverEvent("1", { data: serialize({ id: 1, name: "late" }) });
      second.serverEvent("1", { data: serialize({ id: 1, name: "old id" }) });
      second.serverEvent("3", { data: serialize({ id: 1, name: "b" }) });
      expect(callback.mock.calls.map(([data]) => data.name)).toStrictEqual(["a", "b"]);
    });

    it("should not reconnect after the server closed the connection normally", async () => {
      const ws = await open();

      ws.serverClose({ code: 1000 });
      await advance(60_000);

      expect(Controlled.instances).toHaveLength(1);
      expect(setup.socket.adapter.connected).toBeFalse();
    });

    it("should reconnect when the app goes online", async () => {
      const ws = await open();
      ws.serverClose({ code: 1000 });
      await flushPromises();

      setup.socket.appManager.setOnline(false);
      setup.socket.appManager.setOnline(true);
      await flushPromises();

      expect(Controlled.instances).toHaveLength(2);
    });

    it("should not reconnect a socket without autoConnect when the app goes online", async () => {
      await recreate({ adapterOptions: { autoConnect: false } });

      setup.socket.appManager.setOnline(false);
      setup.socket.appManager.setOnline(true);
      await flushPromises();

      expect(Controlled.instances).toHaveLength(1);
    });

    it("should ignore the frames of a closed connection", async () => {
      const { callback } = subscribe();
      const ws = await open();
      ws.serverStartIterator("1");

      await setup.socket.disconnect();
      ws.serverEvent("1", { data: serialize({ id: 1, name: "late" }) });

      expect(callback).not.toHaveBeenCalled();
    });
  });

  describe("when disconnecting", () => {
    it("should close the connection and keep the listeners", async () => {
      subscribe();
      const ws = await open();

      await setup.socket.disconnect();
      await advance(60_000);

      expect(ws.closeCalls).toStrictEqual([{ code: 1000, reason: undefined }]);
      expect(setup.socket.adapter.connected).toBeFalse();
      expect(setup.socket.adapter.forceClosed).toBeTrue();
      expect(setup.socket.adapter.listeners.get("planet/onUpdate")?.size).toBe(1);
      expect(Controlled.instances).toHaveLength(1);
      expect(setup.errors).toStrictEqual([]);
    });

    it("should cancel a connection that is opening", async () => {
      await setup.socket.disconnect();

      expect(Controlled.last.readyState).toBe(Controlled.CLOSED);
      expect(setup.socket.adapter.connecting).toBeFalse();
    });

    it("should not report the disconnect of a socket that was not connected", async () => {
      await recreate({ adapterOptions: { autoConnect: false } });
      const disconnected = vi.fn();
      setup.socket.events.onDisconnected(disconnected);

      await setup.socket.disconnect();

      expect(disconnected).not.toHaveBeenCalled();
    });

    it("should send nothing when a listener unsubscribes while disconnected", async () => {
      const { unsubscribe } = subscribe();
      const ws = await open();
      await setup.socket.disconnect();

      unsubscribe();

      expect(ws.aborts).toStrictEqual([]);
    });

    it("should stay closed when the app goes online", async () => {
      await setup.socket.disconnect();

      setup.socket.appManager.setOnline(false);
      setup.socket.appManager.setOnline(true);
      await flushPromises();

      expect(Controlled.instances).toHaveLength(1);
    });
  });

  describe("when reconnecting", () => {
    it("should open a new connection and start every subscription again", async () => {
      subscribe();
      const first = await open();
      first.serverStartIterator("1");
      first.serverEvent("1", { data: serialize({ id: 1, name: "a" }), meta: { id: "9" } });

      const reconnecting = setup.socket.reconnect();
      await flushPromises();
      const second = await open();
      await reconnecting;

      expect(first.readyState).toBe(Controlled.CLOSED);
      expect(second.requests.map(({ p }) => p?.h)).toStrictEqual([{ "last-event-id": "9" }]);
    });

    it("should connect after a manual disconnect", async () => {
      await open();
      await setup.socket.disconnect();

      setup.socket.reconnect();
      await flushPromises();
      await open();

      expect(setup.socket.adapter.connected).toBeTrue();
    });

    it("should let disconnect called while reconnecting win", async () => {
      await open();

      const reconnecting = setup.socket.reconnect();
      await setup.socket.disconnect();
      await reconnecting;
      await flushPromises();

      expect(Controlled.instances).toHaveLength(1);
      expect(setup.socket.adapter.connected).toBeFalse();
      expect(setup.socket.adapter.reconnectionAttempts).toBe(0);
    });
  });
});
