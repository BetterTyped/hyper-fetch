import { waitFor } from "@testing-library/dom";

import { createSocket } from "../../utils/socket.utils";
import { createWsServer } from "../../websocket/websocket.server";

const socketOptions: Parameters<typeof createSocket>[0] = {
  reconnectTime: 10,
};

describe("Socket Adapter [ Connection ]", () => {
  let socket = createSocket(socketOptions);

  beforeEach(() => {
    createWsServer();
    socket = createSocket(socketOptions);
    jest.resetAllMocks();
  });

  it("should auto connect", async () => {
    const spy = jest.fn();
    socket.events.onOpen(spy);
    await waitFor(() => {
      expect(spy).toBeCalledTimes(1);
    });
  });

  it("should prevent initial connection", async () => {
    const spy = jest.fn();
    socket = createSocket({ autoConnect: false });
    socket.events.onOpen(spy);
    await waitFor(() => {
      expect(spy).toBeCalledTimes(0);
    });
  });

  it("should reconnect when going online", async () => {
    const spy = jest.fn();
    socket.appManager.setOnline(false);
    socket.adapter.disconnect();
    socket.onClose(() => {
      socket.adapter.open = false;
      socket.events.onOpen(spy);
      socket.appManager.setOnline(true);
    });
    await waitFor(() => {
      expect(spy).toBeCalledTimes(1);
    });
  });

  it("should reconnect when connection attempt takes too long", async () => {
    const spy = jest.fn();
    const url = "ws://test";
    socket = createSocket({ url, reconnectTime: 0, autoConnect: false });
    socket.events.onReconnecting(spy);
    socket.adapter.connect();
    const server = createWsServer({ url });

    await server.connected;

    await waitFor(() => {
      return !!socket.adapter.reconnectionAttempts;
    });

    expect(spy).toBeCalledTimes(1);
  });
});
