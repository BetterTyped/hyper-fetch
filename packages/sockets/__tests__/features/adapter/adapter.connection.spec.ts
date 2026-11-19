import { createWebsocketMockingServer, sleep, waitForConnection } from "@hyper-fetch/testing";
import { waitFor } from "@testing-library/dom";
import { Socket } from "socket";

import { createSocket } from "../../utils/socket.utils";

const socketOptions: Parameters<typeof createSocket>[0] = {
  reconnectTime: 10,
};

/** A transport that reports an open connection from the start and never emits events */
class OpenWebSocket extends EventTarget {
  static OPEN = 1;

  static CLOSED = 3;

  readyState = OpenWebSocket.OPEN;

  close = vi.fn();

  send = vi.fn();
}

describe("Socket Adapter [ Connection ]", () => {
  const { url, startServer, stopServer } = createWebsocketMockingServer();
  let socket: ReturnType<typeof createSocket>;
  // The mocked WebSocket installed by the mocking server, restored after tests that replace it
  let MockedWebSocket: typeof WebSocket;

  beforeEach(async () => {
    vi.resetAllMocks();
    startServer();
    MockedWebSocket = window.WebSocket;
    socket = createSocket(socketOptions);
  });

  afterEach(() => {
    vi.clearAllTimers();
    vi.useRealTimers();
    window.WebSocket = MockedWebSocket;
    globalThis.WebSocket = MockedWebSocket;
  });

  afterAll(() => {
    stopServer();
  });

  it("should auto connect", async () => {
    const spy = vi.fn();
    socket.events.onConnected(spy);
    await waitFor(() => {
      expect(spy).toHaveBeenCalledTimes(1);
      expect(socket.adapter.connected).toBe(true);
    });
  });

  it("should prevent initial connection", async () => {
    const spy = vi.fn();
    const newSocket = new Socket({ url, adapterOptions: { autoConnect: false } });
    newSocket.events.onConnected(spy);
    await sleep(20);
    expect(spy).toHaveBeenCalledTimes(0);
  });

  it("should reconnect when going online", async () => {
    const spy = vi.fn();
    await waitForConnection(socket);
    socket.appManager.setOnline(false);
    socket.onDisconnected(() => {
      socket.adapter.connected = false;
      socket.events.onConnected(spy);
      socket.appManager.setOnline(true);
    });
    await socket.disconnect();
    await waitFor(() => {
      expect(spy).toHaveBeenCalledTimes(1);
    });
  });

  it("should reconnect when connection attempt takes too long", async () => {
    // The socket from beforeEach has to finish connecting before the clock is replaced
    await waitForConnection(socket);
    vi.useFakeTimers({ toFake: ["setTimeout", "clearTimeout"] });

    const spy = vi.fn();
    const newUrl = "ws://test";
    socket = createSocket({ url: newUrl, reconnectTime: 1 });
    socket.events.onReconnecting(spy);

    await vi.advanceTimersByTimeAsync(0);
    expect(spy).toHaveBeenCalledTimes(0);

    await vi.advanceTimersByTimeAsync(1);
    expect(spy).toHaveBeenCalledTimes(1);
  });

  it("should not reconnect when the WebSocket is already open", async () => {
    // The socket from beforeEach has to finish connecting before the clock is replaced
    await waitForConnection(socket);
    vi.useFakeTimers({ toFake: ["setTimeout", "clearTimeout"] });
    window.WebSocket = OpenWebSocket as unknown as typeof WebSocket;
    globalThis.WebSocket = window.WebSocket;

    const onReconnecting = vi.fn();
    const newSocket = createSocket({ ...socketOptions, url: "ws://open", adapterOptions: { autoConnect: false } });
    newSocket.events.onReconnecting(onReconnecting);

    await expect(newSocket.adapter.connect()).resolves.toBeTrue();
    await vi.advanceTimersByTimeAsync(30);

    expect(onReconnecting).not.toHaveBeenCalled();
    expect(newSocket.adapter.connected).toBeTrue();
  });
});
