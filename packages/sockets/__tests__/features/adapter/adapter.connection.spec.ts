import { createWebsocketMockingServer, sleep, waitForConnection } from "@hyper-fetch/testing";
import { waitFor } from "@testing-library/dom";
import { Socket } from "socket";

import { createSocket } from "../../utils/socket.utils";

const socketOptions: Parameters<typeof createSocket>[0] = {
  reconnectTime: 10,
};

describe("Socket Adapter [ Connection ]", () => {
  const { url, getServer, startServer, stopServer } = createWebsocketMockingServer();
  let socket: ReturnType<typeof createSocket>;

  beforeEach(async () => {
    vi.resetAllMocks();
    startServer();
    socket = createSocket(socketOptions);
  });

  afterEach(() => {
    vi.clearAllTimers();
    vi.useRealTimers();
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
    const disconnectedSpy = vi.fn();
    await waitForConnection(socket);
    socket.events.onDisconnected(disconnectedSpy);

    // The network goes down and takes the connection with it
    socket.appManager.setOnline(false);
    getServer().close({ code: 1006, reason: "Network lost", wasClean: false });
    await waitFor(() => {
      expect(disconnectedSpy).toHaveBeenCalledTimes(1);
    });

    startServer();
    socket.events.onConnected(spy);
    socket.appManager.setOnline(true);

    await waitFor(() => {
      expect(spy).toHaveBeenCalledTimes(1);
    });
  });

  it("should stay disconnected when going online after a manual disconnect", async () => {
    const connectingSpy = vi.fn();
    await waitForConnection(socket);
    await socket.disconnect();
    socket.events.onConnecting(connectingSpy);

    socket.appManager.setOnline(false);
    socket.appManager.setOnline(true);

    expect(connectingSpy).not.toHaveBeenCalled();
    expect(socket.adapter.connecting).toBe(false);
    expect(socket.adapter.connected).toBe(false);
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
});
