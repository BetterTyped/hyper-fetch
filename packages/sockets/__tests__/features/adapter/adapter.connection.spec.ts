import { waitFor } from "@testing-library/dom";
import { createWebsocketMockingServer, sleep, waitForConnection } from "@hyper-fetch/testing";

import { createSocket } from "../../utils/socket.utils";
import { Socket } from "socket";

const socketOptions: Parameters<typeof createSocket>[0] = {
  reconnectTime: 10,
};

describe("Socket Adapter [ Connection ]", () => {
  const { url, startServer, stopServer } = createWebsocketMockingServer();
  let socket: ReturnType<typeof createSocket>;

  beforeEach(async () => {
    jest.resetAllMocks();
    startServer();
    socket = createSocket(socketOptions);
  });

  afterAll(() => {
    stopServer();
  });

  it("should auto connect", async () => {
    const spy = jest.fn();
    socket.events.onConnected(spy);
    await waitFor(() => {
      expect(spy).toHaveBeenCalledTimes(1);
      expect(socket.adapter.connected).toBe(true);
    });
  });

  it("should prevent initial connection", async () => {
    const spy = jest.fn();
    const newSocket = new Socket({ url, adapterOptions: { autoConnect: false } });
    newSocket.events.onConnected(spy);
    await sleep(20);
    expect(spy).toHaveBeenCalledTimes(0);
  });

  it("should reconnect when going online", async () => {
    const spy = jest.fn();
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
    const spy = jest.fn();
    const newUrl = "ws://test";
    socket = createSocket({ url: newUrl, reconnectTime: 1 });
    socket.events.onReconnecting(spy);
    await socket.adapter.connect();

    await waitFor(() => {
      return !!socket.adapter.reconnectionAttempts;
    });

    expect(spy).toHaveBeenCalledTimes(1);
  });
});
