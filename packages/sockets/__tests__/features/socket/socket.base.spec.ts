import { createWebsocketMockingServer } from "@hyper-fetch/testing";

import { Socket } from "socket";

describe("Socket [ Base ]", () => {
  const { url, startServer, stopServer } = createWebsocketMockingServer();
  beforeEach(() => {
    startServer();
  });

  afterEach(() => {
    stopServer();
  });

  it("should initialize Socket", async () => {
    const socket = new Socket({ url });
    expect(socket).toBeDefined();
  });
  it("should initialize with autoConnect", async () => {
    const socket = new Socket({ url, adapterOptions: { autoConnect: true } });
    expect(socket.options.adapterOptions?.autoConnect).toBeTrue();
  });
});
