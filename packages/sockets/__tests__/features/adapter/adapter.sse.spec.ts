import { waitFor } from "@testing-library/dom";

import { createSocket } from "../../utils/socket.utils";
import { createWsServer } from "../../websocket/websocket.server";
import { SSEAdapterType, sseAdapter } from "adapter";

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
});
