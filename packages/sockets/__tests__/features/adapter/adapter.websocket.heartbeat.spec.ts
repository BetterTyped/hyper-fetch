import { waitFor } from "@testing-library/dom";
import { createWebsocketMockingServer } from "@hyper-fetch/testing";

import { createSocket } from "../../utils/socket.utils";

const socketOptions: Parameters<typeof createSocket>[0] = {
  adapterOptions: {
    heartbeat: true,
    heartbeatMessage: "Test Heartbeat",
    pingTimeout: 10,
    pongTimeout: 10,
  },
};

describe("Socket Adapter [ Heartbeat ]", () => {
  const { getServer, startServer } = createWebsocketMockingServer();
  let socket = createSocket(socketOptions);
  let server = getServer();

  beforeEach(async () => {
    startServer();
    server = getServer();
    socket = createSocket(socketOptions);
    jest.resetAllMocks();
  });

  it("should send heartbeat to server", async () => {
    await expect(server).toReceiveMessage(
      JSON.stringify({
        topic: "heartbeat",
        data: socketOptions.adapterOptions.heartbeatMessage,
      }),
    );
  });

  it("should receive heartbeat to keep the connection", async () => {
    await expect(server).toReceiveMessage(
      JSON.stringify({
        topic: "heartbeat",
        data: socketOptions.adapterOptions.heartbeatMessage,
      }),
    );
    server.send(JSON.stringify({ topic: "heartbeat", data: new Date().toISOString() }));
    await expect(server).toReceiveMessage(
      JSON.stringify({
        topic: "heartbeat",
        data: socketOptions.adapterOptions.heartbeatMessage,
      }),
    );
  });
  it("should close connection when no heartbeat event sent", async () => {
    await expect(server).toReceiveMessage(
      JSON.stringify({
        topic: "heartbeat",
        data: socketOptions.adapterOptions.heartbeatMessage,
      }),
    );
    await waitFor(() => {
      expect(socket.adapter.state.connected).toBeFalse();
    });
  });
});
