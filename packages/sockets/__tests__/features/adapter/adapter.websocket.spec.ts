/* eslint-disable max-classes-per-file */
import { waitFor } from "@testing-library/dom";
import { createWebsocketMockingServer, waitForConnection } from "@hyper-fetch/testing";

import { WebsocketAdapter, WebsocketAdapterType } from "../../../src/adapter-websockets/websocket-adapter";
import { createSocket } from "../../utils/socket.utils";
import { Socket } from "socket";

describe("Websocket Adapter [ Base ]", () => {
  const { url, startServer, stopServer } = createWebsocketMockingServer();
  const socketOptions = {
    url,
    adapter: WebsocketAdapter(),
    adapterOptions: {
      autoConnect: true,
    },
  };
  let socket: Socket<WebsocketAdapterType>;

  beforeEach(async () => {
    jest.resetAllMocks();
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

    const spy = jest.fn();
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
    const spy = jest.fn();
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
    const spy = jest.fn();
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
    const errorSpy = jest.fn();
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
});
