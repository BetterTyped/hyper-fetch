import { waitFor } from "@testing-library/dom";
import { createWebsocketMockingServer, sleep } from "@hyper-fetch/testing";

import { createSocket } from "../../utils/socket.utils";
import { Socket } from "socket";

const socketOptions: Parameters<typeof createSocket>[0] = {
  reconnectTime: 10,
};

describe("Socket Adapter [ Connection ]", () => {
  const { url, startServer, stopServer } = createWebsocketMockingServer();
  let socket = createSocket(socketOptions);

  beforeEach(async () => {
    startServer();
    socket = createSocket(socketOptions);
    jest.resetAllMocks();
  });

  afterAll(() => {
    stopServer();
  });

  it("should auto connect", async () => {
    const spy = jest.fn();
    socket.events.onConnected(spy);
    await socket.waitForConnection();
    await waitFor(() => {
      expect(spy).toHaveBeenCalledTimes(1);
      expect(socket.adapter.state.connected).toBe(true);
    });
  });

  it("should prevent initial connection", async () => {
    const spy = jest.fn();
    const newSocket = new Socket({ url, autoConnect: false });
    newSocket.events.onConnected(spy);
    await sleep(20);
    expect(spy).toHaveBeenCalledTimes(0);
  });

  it("should reconnect when going online", async () => {
    const spy = jest.fn();
    await socket.waitForConnection();
    socket.appManager.setOnline(false);
    socket.onDisconnected(() => {
      socket.adapter.state.connected = false;
      socket.events.onConnected(spy);
      socket.appManager.setOnline(true);
    });
    socket.adapter.disconnect();
    await waitFor(() => {
      expect(spy).toHaveBeenCalledTimes(1);
    });
  });

  it("should reconnect when connection attempt takes too long", async () => {
    const spy = jest.fn();
    const newUrl = "ws://test";
    socket = createSocket({ url: newUrl, reconnectTime: 1, adapterOptions: { autoConnect: false } });
    socket.events.onReconnecting(spy);
    socket.adapter.connect();

    await waitFor(() => {
      return !!socket.adapter.state.reconnectionAttempts;
    });

    expect(spy).toHaveBeenCalledTimes(1);
  });
});
