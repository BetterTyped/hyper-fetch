import { waitFor } from "@testing-library/dom";
import { createWebsocketMockingServer } from "@hyper-fetch/testing";

import { createSocket } from "../../utils/socket.utils";

const socketOptions: Parameters<typeof createSocket>[0] = {
  reconnectTime: 10,
};

describe("Socket Adapter [ Connection ]", () => {
  const { getServer, startServer, waitForConnection } = createWebsocketMockingServer();
  let socket = createSocket(socketOptions);
  let server = getServer();

  beforeEach(async () => {
    startServer();
    server = getServer();
    socket.emitter.removeAllListeners();
    socket = createSocket(socketOptions);
    jest.resetAllMocks();
    await waitForConnection();
  });

  it("should auto connect", async () => {
    const spy = jest.fn();
    socket.events.onConnected(spy);
    await waitFor(() => {
      expect(spy).toHaveBeenCalledTimes(1);
    });
  });

  it("should prevent initial connection", async () => {
    const spy = jest.fn();
    socket = createSocket({ autoConnect: false });
    socket.events.onConnected(spy);
    await waitFor(() => {
      expect(spy).toHaveBeenCalledTimes(0);
    });
  });

  it("should reconnect when going online", async () => {
    const spy = jest.fn();
    socket.appManager.setOnline(false);
    socket.adapter.disconnect();
    socket.onDisconnected(() => {
      socket.adapter.state.connected = false;
      socket.events.onConnected(spy);
      socket.appManager.setOnline(true);
    });
    await waitFor(() => {
      expect(spy).toHaveBeenCalledTimes(1);
    });
  });

  it("should reconnect when connection attempt takes too long", async () => {
    const spy = jest.fn();
    const url = "ws://test";
    socket = createSocket({ url, reconnectTime: 5, autoConnect: false });
    socket.events.onReconnecting(spy);
    socket.adapter.connect();

    await server.connected;

    await waitFor(() => {
      return !!socket.adapter.state.reconnectionAttempts;
    });

    expect(spy).toHaveBeenCalledTimes(1);
  });
});
