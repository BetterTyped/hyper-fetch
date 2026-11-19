import { createSseMockingServer } from "@hyper-fetch/testing";
import { ServerSentEventsAdapter } from "adapter-sse";
import { EventSourceReadyState } from "adapter-sse/sse-adapter.types";

import { createSocket } from "../../utils/socket.utils";

const socketOptions: Parameters<typeof createSocket>[0] = {
  reconnectTime: 10,
  adapter: ServerSentEventsAdapter,
};
const { startServer } = createSseMockingServer();
const OriginalEventSource = window.EventSource;

/** Opens the mocked connection, `startServer` waits for a timer so the clock has to move for it to finish */
const openConnection = async (start: () => Promise<void>) => {
  const opened = start();
  await vi.advanceTimersByTimeAsync(0);
  await opened;
};

describe("Socket SSE [ Connection ]", () => {
  beforeEach(() => {
    vi.useFakeTimers({ toFake: ["setTimeout", "clearTimeout"] });
    vi.resetAllMocks();
  });

  afterEach(() => {
    // A socket that never opened reschedules its reconnection forever. Dropping the timer stops it from
    // replacing the EventSource registered for the shared url while the next test is running.
    vi.clearAllTimers();
    vi.useRealTimers();
    window.EventSource = OriginalEventSource;
  });

  it("should auto connect", async () => {
    const spy = vi.fn();
    const socket = createSocket(socketOptions);
    socket.events.onConnected(spy);

    await openConnection(startServer);

    expect(spy).toHaveBeenCalledTimes(1);
  });

  it("should prevent initial connection", async () => {
    const spy = vi.fn();
    const url = "ws://localhost:2346";
    const { getSource } = createSseMockingServer(url);
    const socket = createSocket({ ...socketOptions, url, adapterOptions: { autoConnect: false } });
    socket.events.onConnecting(spy);

    await vi.advanceTimersByTimeAsync(10);

    expect(spy).toHaveBeenCalledTimes(0);
    expect(getSource()).toBeUndefined();
  });

  it("should reconnect when connection attempt takes too long", async () => {
    const onReconnecting = vi.fn();
    const onConnected = vi.fn();
    const onConnecting = vi.fn();
    const url = "ws://localhost:2345";
    const { startServer: startNewServer } = createSseMockingServer(url);
    const newSocket = createSocket({
      ...socketOptions,
      url,
      reconnectTime: 30,
      adapterOptions: { autoConnect: false },
    });
    newSocket.events.onReconnecting(onReconnecting);
    newSocket.events.onConnected(onConnected);
    newSocket.events.onConnecting(onConnecting);

    newSocket.adapter.connect();
    await vi.advanceTimersByTimeAsync(29);

    expect(onConnecting).toHaveBeenCalledTimes(1);
    expect(onReconnecting).toHaveBeenCalledTimes(0);

    await vi.advanceTimersByTimeAsync(1);

    expect(onConnecting).toHaveBeenCalledTimes(3);
    expect(onReconnecting).toHaveBeenCalledTimes(1);

    await openConnection(startNewServer);

    expect(onConnecting).toHaveBeenCalledTimes(4);
    expect(onReconnecting).toHaveBeenCalledTimes(1);
    expect(onConnected).toHaveBeenCalledTimes(1);

    // The open connection cancelled the timeout of the attempt that succeeded
    await vi.advanceTimersByTimeAsync(30);

    expect(onReconnecting).toHaveBeenCalledTimes(1);
  });

  it("should not reconnect after disconnecting during a pending connection attempt", async () => {
    const onReconnecting = vi.fn();
    const onConnecting = vi.fn();
    const url = "ws://localhost:2347";
    const socket = createSocket({ ...socketOptions, url, adapterOptions: { autoConnect: false } });
    socket.events.onReconnecting(onReconnecting);
    socket.events.onConnecting(onConnecting);

    socket.adapter.connect();
    await vi.advanceTimersByTimeAsync(0);
    await socket.adapter.disconnect();

    expect(onConnecting).toHaveBeenCalledTimes(2);
    expect(socket.adapter.connecting).toBeFalse();

    // Several reconnect intervals pass without the cancelled attempt coming back
    await vi.advanceTimersByTimeAsync(30);

    expect(onReconnecting).not.toHaveBeenCalled();
    expect(onConnecting).toHaveBeenCalledTimes(2);
    expect(socket.adapter.connecting).toBeFalse();
  });

  it("should not reconnect when the EventSource is already open", async () => {
    class OpenEventSource extends OriginalEventSource {
      constructor(url: string | URL, eventSourceInitDict?: EventSourceInit) {
        super(url, eventSourceInitDict);
        Object.defineProperty(this, "readyState", { get: () => EventSourceReadyState.OPEN, set: () => {} });
      }
    }
    window.EventSource = OpenEventSource;
    const onReconnecting = vi.fn();
    const url = "ws://localhost:2348";
    const socket = createSocket({ ...socketOptions, url, adapterOptions: { autoConnect: false } });
    socket.events.onReconnecting(onReconnecting);

    await expect(socket.adapter.connect()).resolves.toBeTrue();
    await vi.advanceTimersByTimeAsync(30);

    expect(onReconnecting).not.toHaveBeenCalled();
    expect(socket.adapter.connected).toBeTrue();
  });
});
