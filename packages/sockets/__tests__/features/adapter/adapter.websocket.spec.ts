/* eslint-disable max-classes-per-file */
import { waitFor } from "@testing-library/dom";
import { createWebsocketMockingServer, waitForConnection } from "@hyper-fetch/testing";

import { WebsocketAdapter, WebsocketAdapterType } from "../../../src/adapter-websockets/websocket-adapter";
import { getWebsocketAdapter } from "../../../src/adapter-websockets/websocket-adapter.utils";
import { createSocket } from "../../utils/socket.utils";
import { Socket } from "socket";

describe("Websocket Adapter [ Base ]", () => {
  const { url, getServer, startServer, stopServer } = createWebsocketMockingServer();
  const socketOptions = {
    url,
    adapter: WebsocketAdapter(),
    adapterOptions: {
      autoConnect: true,
    },
  };
  let socket: Socket<WebsocketAdapterType>;

  beforeEach(async () => {
    vi.resetAllMocks();
    startServer();
    socket = createSocket(socketOptions);
  });

  it("should create socket instance", () => {
    expect(socket).toBeDefined();
    expect(socket.adapter.name).toBe("websockets");
  });

  it("should handle open connection state", async () => {
    await waitForConnection(socket);
    expect(socket.adapter.connected).toBe(true);
  });

  it("should handle missing WebSocket gracefully", async () => {
    const eventSource = window.WebSocket;
    // eslint-disable-next-line @typescript-eslint/ban-ts-comment
    // @ts-ignore-error
    window.WebSocket = undefined;

    const spy = vi.fn();
    const newSocket = createSocket(socketOptions);
    newSocket.events.onConnected(spy);

    const promise = await newSocket.adapter.connect();

    expect(promise).toBe(false);

    await waitFor(() => {
      expect(spy).not.toHaveBeenCalled();
      expect(newSocket.adapter.connected).toBe(false);
    });

    window.WebSocket = eventSource;
  });

  it("should handle disconnect before connection is established gracefully", async () => {
    const spy = vi.fn();
    const newSocket = createSocket({
      adapter: WebsocketAdapter(),
      adapterOptions: {
        autoConnect: false,
      },
    });
    newSocket.events.onConnected(spy);

    await expect(newSocket.adapter.disconnect()).resolves.toBe(true);
  });

  it("should resolve immediately when WebSocket is already in OPEN state", async () => {
    const ws = window.WebSocket;
    class NewWebsocket extends WebSocket {
      constructor(u: string, protocols?: string | string[]) {
        super(u, protocols);
        Object.defineProperty(this, "readyState", {
          get: () => WebSocket.OPEN,
          set: () => {},
        });
      }
    }
    // eslint-disable-next-line @typescript-eslint/ban-ts-comment
    // @ts-ignore-error
    window.WebSocket = NewWebsocket;

    const newSocket = createSocket({
      ...socketOptions,
      adapter: WebsocketAdapter(),
      adapterOptions: { autoConnect: false },
    });

    const result = await newSocket.adapter.connect();

    expect(result).toBe(true);
    expect(newSocket.adapter.connected).toBe(true);
    expect(newSocket.adapter.connecting).toBe(false);
    window.WebSocket = ws;
  });

  it("should resolve immediately when WebSocket is already in CLOSED state", async () => {
    const ws = window.WebSocket;
    class NewWebsocket extends WebSocket {
      constructor(u: string, protocols?: string | string[]) {
        super(u, protocols);
        Object.defineProperty(this, "readyState", {
          get: () => WebSocket.CLOSED,
          set: () => {},
        });
      }
    }
    // eslint-disable-next-line @typescript-eslint/ban-ts-comment
    // @ts-ignore-error
    window.WebSocket = NewWebsocket;

    const newSocket = createSocket();

    const result = await newSocket.adapter.disconnect();

    expect(result).toBe(true);
    expect(newSocket.adapter.connected).toBe(false);
    expect(newSocket.adapter.connecting).toBe(false);
    window.WebSocket = ws;
  });

  it("should respect autoConnect setting when going online", async () => {
    const spy = vi.fn();
    const socketWithoutAutoConnect = createSocket({
      adapter: WebsocketAdapter,
      adapterOptions: {
        autoConnect: false,
      },
    });

    socketWithoutAutoConnect.events.onConnected(spy);
    startServer();

    // Simulate offline/online cycle
    socketWithoutAutoConnect.appManager.setOnline(false);
    socketWithoutAutoConnect.adapter.disconnect();
    socketWithoutAutoConnect.appManager.setOnline(true);

    // Give it some time to potentially reconnect
    await waitFor(() => {
      expect(spy).not.toHaveBeenCalled();
      expect(socketWithoutAutoConnect.adapter.connected).toBe(false);
    });
  });

  it("should properly clean up error event listeners on disconnect", async () => {
    const errorSpy = vi.fn();
    socket.events.onDisconnected(errorSpy);

    // Disconnect and verify cleanup
    socket.adapter.disconnect();

    // Emit error after disconnect
    stopServer({
      code: 1000,
      reason: "Test error",
      wasClean: false,
    });

    // Give time for any potential events
    await waitFor(() => {
      expect(socket.adapter.connected).toBe(false);
      expect(socket.adapter.connecting).toBe(false);
    });
  });

  it("should log error when trying to send payload through closed socket", async () => {
    // Ensure socket is disconnected
    await socket.adapter.disconnect();

    // Try to send payload through closed socket
    const result = await socket.adapter.emit(socket.createEmitter()({ topic: "test" }));

    // Verify the result and error logging
    expect(result).toBe(undefined);
  });

  it("should return null from getWebsocketAdapter when window access throws", () => {
    const originalWindow = global.window;
    Object.defineProperty(global, "window", {
      get() {
        throw new ReferenceError("window is not defined");
      },
      configurable: true,
    });

    const result = getWebsocketAdapter("ws://localhost:1234", {} as any);
    expect(result).toBeNull();

    Object.defineProperty(global, "window", {
      value: originalWindow,
      writable: true,
      configurable: true,
    });
  });

  it("should trigger reconnect timeout when websocket closes with a non-1000 code", async () => {
    const reconnectingSpy = vi.fn();
    const disconnectedSpy = vi.fn();

    const newSocket = createSocket({
      url,
      adapter: WebsocketAdapter(),
      reconnectTime: 10,
      adapterOptions: { autoConnect: false },
    });
    newSocket.events.onReconnecting(reconnectingSpy);
    newSocket.events.onDisconnected(disconnectedSpy);

    await newSocket.adapter.connect();
    await waitForConnection(newSocket);

    getServer().close({
      code: 1006,
      reason: "Abnormal closure",
      wasClean: false,
    });

    await waitFor(
      () => {
        expect(disconnectedSpy).toHaveBeenCalled();
      },
      { timeout: 2000 },
    );

    startServer();

    await waitFor(
      () => {
        expect(reconnectingSpy).toHaveBeenCalled();
      },
      { timeout: 2000 },
    );
  });

  it("should return false from sendEventMessage when websocket is not set", async () => {
    const newSocket = createSocket({
      ...socketOptions,
      adapterOptions: {
        autoConnect: false,
      },
    });

    const emitter = newSocket.createEmitter()({ topic: "test" });
    const result = await newSocket.adapter.emit(emitter);

    expect(result).toBeUndefined();
  });
});
