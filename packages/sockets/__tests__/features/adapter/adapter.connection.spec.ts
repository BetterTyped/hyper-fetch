import { waitFor } from "@testing-library/dom";
import { createWebsocketMockingServer } from "@hyper-fetch/testing";

import { createSocket } from "../../utils/socket.utils";

const socketOptions: Parameters<typeof createSocket>[0] = {
  reconnectTime: 10,
};

describe("Socket Adapter [ Connection ]", () => {
  const { startServer, waitForConnection } = createWebsocketMockingServer();
  let socket = createSocket(socketOptions);

  beforeEach(async () => {
    startServer();
    await waitForConnection();
    socket.emitter.removeAllListeners();
    socket = createSocket(socketOptions);
    jest.resetAllMocks();
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
    socket = createSocket({ url, reconnectTime: 1, autoConnect: false });
    socket.events.onReconnecting(spy);
    socket.adapter.connect();

    await waitFor(() => {
      return !!socket.adapter.state.reconnectionAttempts;
    });

    expect(spy).toHaveBeenCalledTimes(1);
  });
});
