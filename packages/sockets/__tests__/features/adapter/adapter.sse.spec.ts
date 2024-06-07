import { waitFor } from "@testing-library/dom";
import { createSseMockingServer } from "@hyper-fetch/testing";

import { createSocket } from "../../utils/socket.utils";
import { ServerSentEventsAdapterType, ServerSentEventsAdapter } from "adapter";
import { sleep } from "../../utils/helpers.utils";

const socketOptions: Parameters<typeof createSocket>[0] = {
  adapter: ServerSentEventsAdapter,
  adapterOptions: { eventSourceInit: { withCredentials: true } },
};

const { startServer, emitOpen, emitError, waitForConnection } = createSseMockingServer();

describe("Socket Adapter [ SSE ]", () => {
  let socket = createSocket<ServerSentEventsAdapterType>(socketOptions);

  beforeEach(async () => {
    startServer();
    socket = createSocket<ServerSentEventsAdapterType>(socketOptions);
    jest.resetAllMocks();
    await waitForConnection();
  });

  it("should emit event on disconnect", async () => {
    const spy = jest.fn();
    socket.onDisconnected(spy);
    await waitFor(() => {
      return socket.adapter.state.connected;
    });
    socket.adapter.disconnect();
    await waitFor(() => {
      expect(spy).toHaveBeenCalledTimes(1);
    });
  });

  it("should throw error when emitting", async () => {
    expect(() => socket.adapter.emit({} as any, {})).rejects.toThrow();
  });

  it("should reconnect when going online", async () => {
    const spy = jest.fn();

    socket.events.onConnected(spy);

    emitOpen();

    await waitFor(() => {
      expect(spy).toHaveBeenCalledTimes(1);
    });

    socket.appManager.setOnline(false);
    socket.adapter.disconnect();
    socket.onDisconnected(() => {
      socket.adapter.state.connected = false;
      socket.appManager.setOnline(true);
    });
    emitOpen();

    await waitFor(() => {
      expect(spy).toHaveBeenCalledTimes(2);
    });
  });

  it("should not reconnect when connection is open", async () => {
    const spy = jest.fn();

    socket.events.onConnected(spy);

    emitOpen();

    await waitFor(() => {
      expect(spy).toHaveBeenCalledTimes(1);
    });

    socket.appManager.setOnline(true);
    emitOpen();

    await waitFor(() => {
      expect(spy).toHaveBeenCalledTimes(2);
    });
  });

  it("should not connect when connection is open", async () => {
    const spy = jest.fn();

    socket.events.onConnected(spy);
    socket.adapter.connect();
    emitOpen();

    await waitFor(() => {
      expect(spy).toHaveBeenCalledTimes(1);
    });

    socket.adapter.connect();

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
