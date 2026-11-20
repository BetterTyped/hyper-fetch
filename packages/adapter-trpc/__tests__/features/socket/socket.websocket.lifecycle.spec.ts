import { AppManager } from "@hyper-fetch/core";
import { Socket } from "@hyper-fetch/sockets";

import type { TrpcWebsocketAdapterOptionsType } from "../../../src";
import { TrpcWebsocketAdapter } from "../../../src";
import {
  ControlledWebSocket,
  flushPromises,
  installControlledWebSocket,
  openWebSocket,
  uninstallControlledWebSocket,
  waitForWebSocket,
} from "../../utils/controlled-websocket";

const url = "ws://localhost:3001";

describe("Trpc Websocket Adapter [ Lifecycle ]", () => {
  let appManager = new AppManager();

  const createSocket = (
    adapterOptions?: TrpcWebsocketAdapterOptionsType,
    reconnect?: number,
    { reconnectTime = 100, connectionTimeout = 300 }: { reconnectTime?: number; connectionTimeout?: number } = {},
  ) => {
    const socket = new Socket({
      url,
      adapter: TrpcWebsocketAdapter(),
      adapterOptions,
      reconnect,
      reconnectTime,
      connectionTimeout,
      appManager: () => appManager,
    });
    const errors: Error[] = [];
    socket.onError(({ error }) => {
      errors.push(error as Error);
    });
    return { socket, errors };
  };

  let setup = createSocket({ autoConnect: false });

  beforeEach(() => {
    installControlledWebSocket();
    appManager = new AppManager();
    setup = createSocket({ autoConnect: false });
  });

  afterEach(async () => {
    await setup.socket.disconnect();
    vi.useRealTimers();
    uninstallControlledWebSocket();
  });

  describe("when connecting", () => {
    it("should connect on creation by default", async () => {
      setup = createSocket();

      const ws = await openWebSocket();

      expect(ws.url).toBe(url);
      expect(setup.socket.adapter.connected).toBeTrue();
      expect(setup.socket.adapter.connecting).toBeFalse();
    });

    it("should not connect on creation without autoConnect", async () => {
      await flushPromises();

      expect(ControlledWebSocket.instances).toHaveLength(0);
      expect(setup.socket.adapter.connected).toBeFalse();
    });

    it("should report the lifecycle to the socket callbacks", async () => {
      const connected = vi.fn();
      const disconnected = vi.fn();
      setup.socket.onConnected(connected);
      setup.socket.onDisconnected(disconnected);

      setup.socket.connect();
      await openWebSocket();
      await setup.socket.disconnect();

      expect(connected).toHaveBeenCalledTimes(1);
      expect(disconnected).toHaveBeenCalledTimes(1);
    });

    it("should join the connection attempt in progress", async () => {
      const first = setup.socket.adapter.connect();
      const second = setup.socket.adapter.connect();
      const ws = await waitForWebSocket();
      ws.serverOpen();

      await expect(first).resolves.toBeTrue();
      await expect(second).resolves.toBeTrue();
      expect(ControlledWebSocket.instances).toHaveLength(1);
    });

    it("should resolve with the connection state when already connected", async () => {
      setup.socket.connect();
      await openWebSocket();

      await expect(setup.socket.adapter.connect()).resolves.toBeTrue();
      expect(ControlledWebSocket.instances).toHaveLength(1);
    });

    it("should resolve false when the server refuses the connection", async () => {
      const attempt = setup.socket.adapter.connect();
      const ws = await waitForWebSocket();

      ws.serverClose({ code: 1006 });

      await expect(attempt).resolves.toBeFalse();
      expect(setup.socket.adapter.connected).toBeFalse();
    });

    it("should add the query params and pass the protocols", async () => {
      setup = createSocket({ autoConnect: false, protocols: ["trpc"] });
      setup.socket.setQueryParams({ token: "a b" });

      setup.socket.connect();
      const ws = await waitForWebSocket();

      expect(ws.url).toBe(`${url}?token=a%20b`);
      expect(ws.protocols).toStrictEqual(["trpc"]);
    });

    it("should report a WebSocket that can't be created", async () => {
      ControlledWebSocket.constructorError = new Error("Invalid url");

      await expect(setup.socket.adapter.connect()).resolves.toBeFalse();

      expect(setup.errors.map(({ message }) => message)).toStrictEqual(["Invalid url"]);
      expect(setup.socket.adapter.connecting).toBeFalse();
    });

    it("should report a constructor that throws something else than an error", async () => {
      ControlledWebSocket.constructorError = "Invalid url" as unknown as Error;

      await expect(setup.socket.adapter.connect()).resolves.toBeFalse();

      expect(setup.errors[0]).toBeInstanceOf(Error);
      expect(setup.errors[0].message).toBe("Invalid url");
    });

    it("should report a missing WebSocket", async () => {
      const original = globalThis.WebSocket;
      // @ts-expect-error removing the global like in an environment without WebSocket
      delete globalThis.WebSocket;

      try {
        await expect(setup.socket.adapter.connect()).resolves.toBeFalse();
      } finally {
        globalThis.WebSocket = original;
      }

      expect(setup.errors[0].message).toBe("WebSocket is not available in this environment");
    });

    it("should not connect when the onConnect interceptor fails", async () => {
      setup.socket.onConnect(() => {
        throw new Error("No token");
      });

      await expect(setup.socket.adapter.connect()).resolves.toBeFalse();

      expect(ControlledWebSocket.instances).toHaveLength(0);
      expect(setup.errors[0].message).toBe("No token");
    });

    it("should use the url resolved by the onConnect interceptor", async () => {
      setup.socket.onConnect(({ connection }) => ({ ...connection, url: "ws://other:3001" }));

      setup.socket.connect();
      const ws = await waitForWebSocket();

      expect(ws.url).toBe("ws://other:3001");
    });
  });

  describe("when the connection times out", () => {
    it("should start over when the server does not open the connection in time", async () => {
      vi.useFakeTimers();
      setup.socket.connect();
      const ws = await waitForWebSocket();

      await vi.advanceTimersByTimeAsync(300);
      const next = await waitForWebSocket(2);

      expect(ws.readyState).toBe(ws.CLOSED);
      expect(next.readyState).toBe(next.CONNECTING);
      expect(ControlledWebSocket.active).toStrictEqual([next]);
    });

    it("should not time out an open connection", async () => {
      vi.useFakeTimers();
      setup.socket.connect();
      await openWebSocket();

      await vi.advanceTimersByTimeAsync(1000);

      expect(ControlledWebSocket.instances).toHaveLength(1);
      expect(setup.socket.adapter.connected).toBeTrue();
    });

    it("should not cut a slow handshake short with a short reconnect time", async () => {
      vi.useFakeTimers();
      setup = createSocket({ autoConnect: false }, undefined, { reconnectTime: 10, connectionTimeout: 1000 });
      setup.socket.connect();
      const ws = await waitForWebSocket();

      await vi.advanceTimersByTimeAsync(999);
      expect(ControlledWebSocket.instances).toHaveLength(1);
      ws.serverOpen();
      await flushPromises();

      expect(setup.socket.adapter.connected).toBeTrue();
      await vi.advanceTimersByTimeAsync(1000);
      expect(ControlledWebSocket.instances).toHaveLength(1);
    });

    it("should wait the reconnect time, not the connection timeout, after the connection was lost", async () => {
      vi.useFakeTimers();
      setup = createSocket({ autoConnect: false }, undefined, { reconnectTime: 1000, connectionTimeout: 10 });
      setup.socket.connect();
      const ws = await waitForWebSocket();
      await vi.advanceTimersByTimeAsync(10);
      // The short connection timeout started over the attempt that did not open
      const second = await waitForWebSocket(2);
      expect(ws.readyState).toBe(ws.CLOSED);
      second.serverOpen();
      await flushPromises();

      second.serverClose({ code: 1006 });
      await vi.advanceTimersByTimeAsync(999);
      expect(ControlledWebSocket.instances).toHaveLength(2);
      await vi.advanceTimersByTimeAsync(1);

      await waitForWebSocket(3);
    });
  });

  describe("when the connection is lost", () => {
    it("should report it and reconnect after the reconnect time", async () => {
      vi.useFakeTimers();
      setup.socket.connect();
      const ws = await openWebSocket();

      ws.serverClose({ code: 1006 });

      expect(setup.socket.adapter.connected).toBeFalse();
      expect(setup.errors).toHaveLength(1);

      await vi.advanceTimersByTimeAsync(99);
      expect(ControlledWebSocket.instances).toHaveLength(1);
      await vi.advanceTimersByTimeAsync(1);
      await openWebSocket(2);

      expect(setup.socket.adapter.connected).toBeTrue();
    });

    it("should not reconnect after a normal closure by the server", async () => {
      vi.useFakeTimers();
      setup.socket.connect();
      const ws = await openWebSocket();

      ws.serverClose({ code: 1000, wasClean: true });
      await vi.advanceTimersByTimeAsync(1000);

      expect(ControlledWebSocket.instances).toHaveLength(1);
      expect(setup.socket.adapter.connected).toBeFalse();
    });

    it("should stop reconnecting after the reconnect attempts", async () => {
      vi.useFakeTimers();
      setup = createSocket({ autoConnect: false }, 1);
      const failed = vi.fn();
      setup.socket.onReconnectFailed(failed);
      setup.socket.connect();
      const ws = await openWebSocket();

      ws.serverClose();
      await vi.advanceTimersByTimeAsync(100);
      const next = await waitForWebSocket(2);
      next.serverClose();
      await vi.advanceTimersByTimeAsync(100);
      await flushPromises();

      expect(failed).toHaveBeenCalledTimes(1);
      expect(ControlledWebSocket.instances).toHaveLength(2);
    });
  });

  describe("when disconnecting", () => {
    it("should close the connection and stay closed", async () => {
      vi.useFakeTimers();
      setup.socket.connect();
      const ws = await openWebSocket();

      await setup.socket.disconnect();
      await vi.advanceTimersByTimeAsync(1000);

      expect(ws.readyState).toBe(ws.CLOSED);
      expect(setup.socket.adapter.connected).toBeFalse();
      expect(setup.socket.adapter.forceClosed).toBeTrue();
      expect(ControlledWebSocket.instances).toHaveLength(1);
      expect(setup.errors).toHaveLength(0);
    });

    it("should cancel a connection attempt in progress", async () => {
      vi.useFakeTimers();
      setup.socket.connect();
      const ws = await waitForWebSocket();

      await setup.socket.disconnect();
      await vi.advanceTimersByTimeAsync(1000);

      expect(ws.readyState).toBe(ws.CLOSED);
      expect(ControlledWebSocket.instances).toHaveLength(1);
      expect(setup.socket.adapter.connecting).toBeFalse();
    });

    it("should resolve right away when there is no connection", async () => {
      await expect(setup.socket.adapter.disconnect()).resolves.toBeTrue();
    });

    it("should resolve right away when the connection is already closed", async () => {
      setup.socket.connect();
      const ws = await openWebSocket();
      ws.readyState = ws.CLOSED;

      await expect(setup.socket.adapter.disconnect()).resolves.toBeTrue();
    });

    it("should win over a reconnection in progress", async () => {
      setup.socket.onConnect(async ({ connection }) => connection);
      setup.socket.connect();
      await openWebSocket();

      const reconnecting = setup.socket.reconnect();
      await setup.socket.disconnect();
      await reconnecting;
      await flushPromises();

      expect(ControlledWebSocket.instances).toHaveLength(1);
      expect(setup.socket.adapter.reconnectionAttempts).toBe(0);
    });
  });

  describe("when reconnecting", () => {
    it("should replace the connection", async () => {
      setup.socket.connect();
      const ws = await openWebSocket();

      setup.socket.reconnect();
      const next = await openWebSocket(2);

      expect(ws.readyState).toBe(ws.CLOSED);
      expect(ControlledWebSocket.active).toStrictEqual([next]);
      expect(setup.socket.adapter.connected).toBeTrue();
      expect(setup.socket.adapter.reconnectionAttempts).toBe(0);
    });

    it("should connect after a manual disconnect", async () => {
      setup.socket.connect();
      await openWebSocket();
      await setup.socket.disconnect();

      setup.socket.reconnect();
      await openWebSocket(2);

      expect(setup.socket.adapter.connected).toBeTrue();
    });

    it("should ignore the events of a replaced connection", async () => {
      setup.socket.connect();
      const ws = await openWebSocket();
      setup.socket.reconnect();
      await openWebSocket(2);
      const disconnected = vi.fn();
      setup.socket.onDisconnected(disconnected);

      ws.serverClose({ code: 1006 });

      expect(disconnected).not.toHaveBeenCalled();
      expect(setup.socket.adapter.connected).toBeTrue();
    });

    it("should ignore a replaced connection that opens late", async () => {
      vi.useFakeTimers();
      setup.socket.connect();
      const ws = await waitForWebSocket();
      await vi.advanceTimersByTimeAsync(300);
      await waitForWebSocket(2);
      const connected = vi.fn();
      setup.socket.onConnected(connected);

      ws.readyState = ws.CONNECTING;
      ws.serverOpen();

      expect(connected).not.toHaveBeenCalled();
    });
  });

  describe("when the app goes online", () => {
    it("should connect", async () => {
      setup = createSocket();
      const ws = await waitForWebSocket();
      ws.serverClose({ code: 1000 });

      appManager.setOnline(false);
      appManager.setOnline(true);
      await waitForWebSocket(2);

      expect(ControlledWebSocket.instances).toHaveLength(2);
    });

    it("should stay disconnected after a manual disconnect", async () => {
      setup = createSocket();
      await openWebSocket();
      await setup.socket.disconnect();

      appManager.setOnline(false);
      appManager.setOnline(true);
      await flushPromises();

      expect(ControlledWebSocket.instances).toHaveLength(1);
    });

    it("should not connect without autoConnect", async () => {
      appManager.setOnline(false);
      appManager.setOnline(true);
      await flushPromises();

      expect(ControlledWebSocket.instances).toHaveLength(0);
    });

    it("should not open a second connection when connected", async () => {
      setup = createSocket();
      await openWebSocket();

      appManager.setOnline(false);
      appManager.setOnline(true);
      await flushPromises();

      expect(ControlledWebSocket.instances).toHaveLength(1);
    });
  });
});
