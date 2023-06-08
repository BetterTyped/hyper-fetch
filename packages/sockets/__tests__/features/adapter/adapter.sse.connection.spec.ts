import { waitFor } from "@testing-library/dom";
import { sources } from "eventsourcemock";

import { createSocket } from "../../utils/socket.utils";
import { createWsServer, wsUrl } from "../../websocket/websocket.server";
import { sseAdapter } from "adapter";

const socketOptions: Parameters<typeof createSocket>[0] = {
  reconnectTime: 10,
  adapter: sseAdapter,
};

describe("Socket SSE [ Connection ]", () => {
  let socket = createSocket(socketOptions);

  beforeEach(() => {
    createWsServer();
    socket.emitter.removeAllListeners();
    socket = createSocket(socketOptions);
    jest.resetAllMocks();
  });

  it("should auto connect", async () => {
    const spy = jest.fn();
    socket.events.onOpen(spy);
    sources[wsUrl].emitOpen();
    await waitFor(() => {
      expect(spy).toBeCalledTimes(1);
    });
  });

  it("should prevent initial connection", async () => {
    const spy = jest.fn();
    socket = createSocket({ autoConnect: false });
    socket.events.onOpen(spy);
    sources[wsUrl].emitOpen();
    await waitFor(() => {
      expect(spy).toBeCalledTimes(0);
    });
  });

  it("should reconnect when connection attempt takes too long", async () => {
    const spy = jest.fn();
    const url = "ws://test";
    socket = createSocket({ url, reconnectTime: 500, autoConnect: false });
    socket.events.onReconnecting(spy);
    socket.adapter.connect();
    sources[wsUrl].emitOpen();

    await waitFor(() => {
      expect(spy).toBeCalledTimes(1);
    });
  });
});
