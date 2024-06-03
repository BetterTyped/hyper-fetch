import { waitFor } from "@testing-library/dom";
import { createSseMockingServer } from "@hyper-fetch/testing";

import { createSocket } from "../../utils/socket.utils";
import { ServerSentEventsAdapter } from "adapter";

const socketOptions: Parameters<typeof createSocket>[0] = {
  reconnectTime: 10,
  adapter: ServerSentEventsAdapter,
};

const { emitOpen, startServer, waitForConnection } = createSseMockingServer();

describe("Socket SSE [ Connection ]", () => {
  let socket = createSocket(socketOptions);

  beforeEach(async () => {
    startServer();
    socket.emitter.removeAllListeners();
    socket = createSocket(socketOptions);
    jest.resetAllMocks();
    await waitForConnection();
  });

  it("should auto connect", async () => {
    const spy = jest.fn();
    socket.events.onOpen(spy);

    emitOpen();
    await waitFor(() => {
      expect(spy).toHaveBeenCalledTimes(1);
    });
  });

  it("should prevent initial connection", async () => {
    const spy = jest.fn();
    socket = createSocket({ autoConnect: false });
    socket.events.onOpen(spy);
    emitOpen();
    await waitFor(() => {
      expect(spy).toHaveBeenCalledTimes(0);
    });
  });

  it("should reconnect when connection attempt takes too long", async () => {
    const spy = jest.fn();
    const url = "ws://test";
    socket = createSocket({ url, reconnectTime: 500, autoConnect: false });
    socket.events.onReconnecting(spy);
    socket.adapter.connect();
    emitOpen();

    await waitFor(() => {
      expect(spy).toHaveBeenCalledTimes(1);
    });
  });
});
