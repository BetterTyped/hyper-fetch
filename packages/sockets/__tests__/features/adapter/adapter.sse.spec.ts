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

  beforeEach(async () => {
    socket = createSocket<ServerSentEventsAdapterType>(socketOptions);
    jest.resetAllMocks();
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

    await waitFor(() => {
      expect(spy).toHaveBeenCalledTimes(1);
    });

    socket.appManager.setOnline(false);
    socket.adapter.disconnect();
    socket.onDisconnected(() => {
      socket.adapter.connected = false;
      socket.appManager.setOnline(true);
    });
    startServer();

    await waitFor(() => {
      expect(spy).toHaveBeenCalledTimes(2);
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
    await socket.adapter.connect();
    startServer();

    await waitFor(() => {
      expect(spy).toHaveBeenCalledTimes(1);
    });

    await socket.adapter.connect();

    await sleep(10);

    await waitFor(() => {
      expect(spy).toHaveBeenCalledTimes(1);
    });
  });

  it("should emit and receive error event", async () => {
    const spy = jest.fn();
    socket.events.onError(spy);
    emitError();

    await waitFor(() => {
      expect(spy).toHaveBeenCalledTimes(1);
      expect(spy).toHaveBeenCalledWith(new Error());
    });
  });
});
