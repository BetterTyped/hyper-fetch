import { waitFor } from "@testing-library/dom";

import { createSocket } from "../../utils/socket.utils";
import { createWsServer } from "../../websocket/websocket.server";

const socketOptions: Parameters<typeof createSocket>[0] = {
  isSSE: true,
  clientOptions: { eventSourceInit: { withCredentials: true } },
};

describe("Socket Client [ SSE ]", () => {
  let socket = createSocket(socketOptions);

  beforeEach(() => {
    createWsServer();
    socket = createSocket(socketOptions);
    jest.resetAllMocks();
  });

  it("should emit event on disconnect", async () => {
    const spy = jest.fn();
    socket.onClose(spy);
    await waitFor(() => {
      return socket.client.open;
    });
    socket.client.disconnect();
    await waitFor(() => {
      expect(spy).toBeCalledTimes(1);
    });
  });

  it("should throw error when emitting", async () => {
    expect(() => socket.client.emit("", {} as any)).toThrow();
  });
});
