/* eslint-disable max-classes-per-file */
import { waitFor } from "@testing-library/dom";
import { createSseMockingServer, sleep } from "@hyper-fetch/testing";

import { createSocket } from "../../utils/socket.utils";
import { ServerSentEventsAdapter, ServerSentEventsAdapterType } from "adapter-sse/sse-adapter";

const socketOptions: Parameters<typeof createSocket>[0] = {
  adapter: ServerSentEventsAdapter,
  adapterOptions: { eventSourceInit: { withCredentials: true } },
};

describe("Socket Adapter [ SSE ]", () => {
  const { startServer, emitError } = createSseMockingServer();
  let socket = createSocket<ServerSentEventsAdapterType>(socketOptions);
  let originalEventSource: typeof EventSource;

  beforeEach(async () => {
    socket = createSocket<ServerSentEventsAdapterType>(socketOptions);
    originalEventSource = window.EventSource;
    jest.resetAllMocks();
  });

  afterEach(() => {
    window.EventSource = originalEventSource;
  });

  it("should emit event on disconnect", async () => {
    startServer();

    const spy = jest.fn();
    socket.onDisconnected(spy);
    expect(socket.adapter.connected).toBe(true);
    socket.adapter.disconnect();
    await waitFor(() => {
      expect(spy).toHaveBeenCalledTimes(1);
    });
  });

  it("should throw error when emitting", async () => {
    startServer();

    expect(() => socket.adapter.emit({} as any, {})).rejects.toThrow();
  });

  it("should reconnect when going online", async () => {
    const spy = jest.fn();
    socket.events.onConnected(spy);

    startServer();

    // Wait for initial connection
    await waitFor(() => {
      expect(spy).toHaveBeenCalledTimes(1);
    });

    // Simulate going offline and disconnecting
    socket.appManager.setOnline(false);
    socket.adapter.disconnect();

    // Wait for disconnect to complete
    await waitFor(() => {
      expect(socket.adapter.connected).toBe(false);
    });

    // Simulate going back online
    socket.appManager.setOnline(true);
    startServer();

    // Should reconnect automatically
    await waitFor(() => {
      expect(spy).toHaveBeenCalledTimes(2);
      expect(socket.adapter.connected).toBe(true);
    });
  });

  it("should not reconnect when connection is open", async () => {
    const spy = jest.fn();

    socket.events.onConnected(spy);

    startServer();

    await waitFor(() => {
      expect(spy).toHaveBeenCalledTimes(1);
    });

    socket.appManager.setOnline(true);
    startServer();

    await waitFor(() => {
      expect(spy).toHaveBeenCalledTimes(2);
    });
  });

  it("should not connect again when connection is open", async () => {
    const spy = jest.fn();

    socket.events.onConnected(spy);
    startServer();
    socket.adapter.connect();

    await waitFor(() => {
      expect(spy).toHaveBeenCalledTimes(1);
    });

    await socket.adapter.connect();

    await waitFor(() => {
      expect(spy).toHaveBeenCalledTimes(1);
    });
  });

  it("should emit and receive error event", async () => {
    const spy = jest.fn();
    socket.events.onError(spy);
    emitError({
      code: 1000,
      reason: "Test error",
      wasClean: false,
    });

    await waitFor(() => {
      expect(spy).toHaveBeenCalledTimes(1);
      expect(spy).toHaveBeenCalledWith({
        error: new Error(
          "Normal closure, meaning that the purpose for which the connection was established has been fulfilled.",
        ),
      });
    });
  });

  it("should handle missing EventSource gracefully", async () => {
    const eventSource = window.EventSource;
    // eslint-disable-next-line @typescript-eslint/ban-ts-comment
    // @ts-ignore-error
    window.EventSource = undefined;

    const spy = jest.fn();
    const newSocket = createSocket<ServerSentEventsAdapterType>(socketOptions);
    newSocket.events.onConnected(spy);

    const promise = await newSocket.adapter.connect();

    expect(promise).toBe(false);

    await waitFor(() => {
      expect(spy).not.toHaveBeenCalled();
      expect(newSocket.adapter.connected).toBe(false);
    });

    window.EventSource = eventSource;
  });

  it("should handle disconnect before connection is established gracefully", async () => {
    const spy = jest.fn();
    const newSocket = createSocket<ServerSentEventsAdapterType>({
      adapter: ServerSentEventsAdapter(),
      adapterOptions: {
        autoConnect: false,
      },
    });
    newSocket.events.onConnected(spy);

    await expect(newSocket.adapter.disconnect()).resolves.toBe(true);
  });

  it("should resolve immediately when EventSource is already in OPEN state", async () => {
    class OpenEventSource extends EventSource {
      constructor(url: string, eventSourceInitDict?: EventSourceInit) {
        super(url, eventSourceInitDict);
        Object.defineProperty(this, "readyState", {
          get: () => EventSource.OPEN,
        });
      }
    }
    // eslint-disable-next-line @typescript-eslint/ban-ts-comment
    // @ts-ignore-error
    window.EventSource = OpenEventSource;

    const newSocket = createSocket<ServerSentEventsAdapterType>({
      ...socketOptions,
      adapterOptions: { autoConnect: false },
    });

    const result = await newSocket.adapter.connect();

    expect(result).toBe(true);
    expect(newSocket.adapter.connected).toBe(true);
    expect(newSocket.adapter.connecting).toBe(false);
  });

  it("should resolve immediately when EventSource is already in CLOSED state", async () => {
    class OpenEventSource extends EventSource {
      constructor(url: string, eventSourceInitDict?: EventSourceInit) {
        super(url, eventSourceInitDict);
        Object.defineProperty(this, "readyState", {
          get: () => EventSource.CLOSED,
          set: () => {},
        });
      }
    }
    // eslint-disable-next-line @typescript-eslint/ban-ts-comment
    // @ts-ignore-error
    window.EventSource = OpenEventSource;

    const newSocket = createSocket<ServerSentEventsAdapterType>(socketOptions);

    const result = await newSocket.adapter.disconnect();

    expect(result).toBe(true);
    expect(newSocket.adapter.connected).toBe(false);
    expect(newSocket.adapter.connecting).toBe(false);
  });

  it("should respect autoConnect setting when going online", async () => {
    const spy = jest.fn();
    const socketWithoutAutoConnect = createSocket<ServerSentEventsAdapterType>({
      adapter: ServerSentEventsAdapter,
      adapterOptions: {
        eventSourceInit: { withCredentials: true },
        autoConnect: false,
      },
    });

    socketWithoutAutoConnect.events.onConnected(spy);
    startServer();

    // Simulate offline/online cycle
    socketWithoutAutoConnect.appManager.setOnline(false);
    socketWithoutAutoConnect.adapter.disconnect();
    socketWithoutAutoConnect.appManager.setOnline(true);

    // Give it some time to potentially reconnect
    await new Promise((resolve) => {
      setTimeout(resolve, 100);
    });

    expect(spy).not.toHaveBeenCalled();
    expect(socketWithoutAutoConnect.adapter.connected).toBe(false);
  });

  it("should properly clean up error event listeners on disconnect", async () => {
    const errorSpy = jest.fn();
    socket.events.onError(errorSpy);

    // Disconnect and verify cleanup
    socket.adapter.disconnect();

    // Emit error after disconnect
    emitError({
      code: 1000,
      reason: "Test error",
      wasClean: false,
    });

    // Give time for any potential error events
    await sleep(10);

    expect(errorSpy).toHaveBeenCalled();
    expect(socket.adapter.connected).toBe(false);
  });
});
