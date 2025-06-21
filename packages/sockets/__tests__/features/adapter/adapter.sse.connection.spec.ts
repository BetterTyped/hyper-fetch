import { waitFor } from "@testing-library/dom";
import { createSseMockingServer, sleep } from "@hyper-fetch/testing";

import { createSocket } from "../../utils/socket.utils";
import { ServerSentEventsAdapter } from "adapter-sse";

const socketOptions: Parameters<typeof createSocket>[0] = {
  reconnectTime: 10,
  adapter: ServerSentEventsAdapter,
};
const { startServer } = createSseMockingServer();

describe("Socket SSE [ Connection ]", () => {
  let socket: ReturnType<typeof createSocket>;

  beforeEach(async () => {
    socket?.emitter.removeAllListeners();
    socket = createSocket(socketOptions);
    jest.resetAllMocks();
  });

  it("should auto connect", async () => {
    const spy = jest.fn();
    socket.events.onConnected(spy);

    startServer();
    await waitFor(() => {
      expect(spy).toHaveBeenCalledTimes(1);
    });
  });

  it("should prevent initial connection", async () => {
    const spy = jest.fn();
    socket = createSocket({ adapterOptions: { autoConnect: false } });
    socket.events.onConnected(spy);
    startServer();
    await waitFor(() => {
      expect(spy).toHaveBeenCalledTimes(0);
    });
  });

  it("should reconnect when connection attempt takes too long", async () => {
    const spy = jest.fn();
    const spy2 = jest.fn();
    const spy3 = jest.fn();
    const url = "ws://localhost:2345";
    const { startServer: startNewServer } = createSseMockingServer(url);
    const newSocket = createSocket({
      ...socketOptions,
      url,
      reconnectTime: 30,
      adapterOptions: { autoConnect: false },
    });
    newSocket.events.onReconnecting(spy);
    newSocket.events.onConnected(spy2);
    newSocket.events.onConnecting(spy3);
    newSocket.adapter.connect();
    await sleep(40);
    startNewServer();

    await waitFor(() => {
      expect(spy3).toHaveBeenCalledTimes(3);
      expect(spy).toHaveBeenCalledTimes(1);
      expect(spy2).toHaveBeenCalledTimes(1);
    });
  });
});
