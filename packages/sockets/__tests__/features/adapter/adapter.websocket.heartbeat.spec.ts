import { waitFor } from "@testing-library/dom";

import { createSocket } from "../../utils/socket.utils";
import { createWsServer } from "../../websocket/websocket.server";

const socketOptions: Parameters<typeof createSocket>[0] = {
  adapterOptions: {
    heartbeat: true,
    heartbeatMessage: "Test Heartbeat",
    pingTimeout: 10,
    pongTimeout: 10,
  },
};

describe("Socket Adapter [ Heartbeat ]", () => {
  let server = createWsServer();
  let socket = createSocket(socketOptions);

  beforeEach(() => {
    server = createWsServer();
    socket = createSocket(socketOptions);
    jest.resetAllMocks();
  });

  it("should send heartbeat to server", async () => {
    await expect(server).toReceiveMessage(
      JSON.stringify({
        id: "heartbeat",
        name: "heartbeat",
        data: socketOptions.adapterOptions.heartbeatMessage,
      }),
    );
  });

  it("should receive heartbeat to keep the connection", async () => {
    await expect(server).toReceiveMessage(
      JSON.stringify({
        id: "heartbeat",
        name: "heartbeat",
        data: socketOptions.adapterOptions.heartbeatMessage,
      }),
    );
    server.send(JSON.stringify({ name: "heartbeat", data: new Date().toISOString() }));
    await expect(server).toReceiveMessage(
      JSON.stringify({
        id: "heartbeat",
        name: "heartbeat",
        data: socketOptions.adapterOptions.heartbeatMessage,
      }),
    );
  });
  it("should close connection when no heartbeat event sent", async () => {
    await expect(server).toReceiveMessage(
      JSON.stringify({
        id: "heartbeat",
        name: "heartbeat",
        data: socketOptions.adapterOptions.heartbeatMessage,
      }),
    );
    await waitFor(() => {
      expect(socket.adapter.open).toBeFalse();
    });
  });
});
