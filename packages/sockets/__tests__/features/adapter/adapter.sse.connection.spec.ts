import { createSseMockingServer } from "@hyper-fetch/testing";
import { waitFor } from "@testing-library/dom";
import { ServerSentEventsAdapter } from "adapter-sse";

import { createSocket } from "../../utils/socket.utils";

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
    vi.resetAllMocks();
  });

  it("should auto connect", async () => {
    const spy = vi.fn();
    socket.events.onConnected(spy);

    startServer();
    await waitFor(() => {
      expect(spy).toHaveBeenCalledTimes(1);
    });
  });

  it("should prevent initial connection", async () => {
    const spy = vi.fn();
    socket = createSocket({ adapterOptions: { autoConnect: false } });
    socket.events.onConnected(spy);
    startServer();
    await waitFor(() => {
      expect(spy).toHaveBeenCalledTimes(0);
    });
  });

  it("should reconnect when connection attempt takes too long", async () => {
    const spy = vi.fn();
    const spy2 = vi.fn();
    const spy3 = vi.fn();
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
    // Fake timers make "exactly one connection timeout passed" independent of the machine load
    vi.useFakeTimers({ toFake: ["setTimeout", "clearTimeout"] });
    try {
      newSocket.adapter.connect();
      await vi.advanceTimersByTimeAsync(30);
      const opening = startNewServer();
      await vi.advanceTimersByTimeAsync(0);
      await opening;
    } finally {
      vi.useRealTimers();
    }

    expect(spy3).toHaveBeenCalledTimes(4);
    expect(spy).toHaveBeenCalledTimes(1);
    expect(spy2).toHaveBeenCalledTimes(1);
    await newSocket.disconnect();
  });
});
