import { waitFor } from "@testing-library/dom";

import { createSocket } from "../../utils/socket.utils";
import { createWsServer } from "../../websocket/websocket.server";
import { SSEAdapterType, sseAdapter } from "adapter";
import { emitError, openSse } from "../../websocket/sse.server";
import { sleep } from "../../utils/helpers.utils";

const socketOptions: Parameters<typeof createSocket>[0] = {
  adapter: sseAdapter,
  adapterOptions: { eventSourceInit: { withCredentials: true } },
};

describe("Socket Adapter [ SSE ]", () => {
  let socket = createSocket<SSEAdapterType>(socketOptions);

  beforeEach(() => {
    createWsServer();
    socket = createSocket<SSEAdapterType>(socketOptions);
    jest.resetAllMocks();
  });

  it("should emit event on disconnect", async () => {
    const spy = jest.fn();
    socket.onClose(spy);
    await waitFor(() => {
      return socket.adapter.open;
    });
    socket.adapter.disconnect();
    await waitFor(() => {
      expect(spy).toBeCalledTimes(1);
    });
  });

  it("should throw error when emitting", async () => {
    expect(() => socket.adapter.emit("", {} as any)).rejects.toThrow();
  });

  it("should reconnect when going online", async () => {
    const spy = jest.fn();

    socket.events.onOpen(spy);

    openSse();

    await waitFor(() => {
      expect(spy).toBeCalledTimes(1);
    });

    socket.appManager.setOnline(false);
    socket.adapter.disconnect();
    socket.onClose(() => {
      socket.adapter.open = false;
      socket.appManager.setOnline(true);
    });
    openSse();

    await waitFor(() => {
      expect(spy).toBeCalledTimes(2);
    });
  });

  it("should not reconnect when connection is open", async () => {
    const spy = jest.fn();

    socket.events.onOpen(spy);

    openSse();

    await waitFor(() => {
      expect(spy).toBeCalledTimes(1);
    });

    socket.appManager.setOnline(true);
    openSse();

    await waitFor(() => {
      expect(spy).toBeCalledTimes(2);
    });
  });

  it("should not connect when connection is open", async () => {
    const spy = jest.fn();

    socket.events.onOpen(spy);
    socket.adapter.connect();
    openSse();

    await waitFor(() => {
      expect(spy).toBeCalledTimes(1);
    });

    socket.adapter.connect();

    await sleep(10);

    await waitFor(() => {
      expect(spy).toBeCalledTimes(1);
    });
  });

  it("should emit and receive error event", async () => {
    const spy = jest.fn();
    socket.events.onError(spy);
    emitError();

    await waitFor(() => {
      expect(spy).toBeCalledTimes(1);
      expect(spy).toBeCalledWith(new Error());
    });
  });
});
