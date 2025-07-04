import { waitFor } from "@testing-library/dom";
import { createWebsocketMockingServer, waitForConnection } from "@hyper-fetch/testing";

import { createEmitter } from "../../utils/emitter.utils";
import { createSocket } from "../../utils/socket.utils";

describe("Socket Client  [ Callbacks ]", () => {
  const { getServer, startServer } = createWebsocketMockingServer();
  beforeEach(async () => {
    startServer();
    jest.resetAllMocks();
  });

  it("should trigger onConnected callbacks", async () => {
    const spy = jest.fn();
    createSocket().onConnected(spy);

    await waitFor(() => {
      expect(spy).toHaveBeenCalledTimes(1);
    });
  });

  it("should trigger onDisconnected callbacks", async () => {
    const spy = jest.fn();
    const socket = createSocket().onDisconnected(spy);
    socket.adapter.disconnect();

    await waitFor(() => {
      expect(spy).toHaveBeenCalledTimes(1);
    });
  });

  it("should trigger onError callbacks", async () => {
    const spy = jest.fn();
    createSocket().onError(spy);
    getServer().error({
      code: 1000,
      reason: "test",
      wasClean: false,
    });

    await waitFor(() => {
      expect(spy).toHaveBeenCalledTimes(1);
    });
  });

  it("should trigger onMessage callbacks", async () => {
    const spy = jest.fn().mockImplementation((res) => res);
    createSocket().onMessage(spy);
    getServer().send({ data: { topic: "test", data: "test" } });

    await waitFor(() => {
      expect(spy).toHaveBeenCalledTimes(1);
    });
  });

  it("should trigger onSend callbacks", async () => {
    const spy = jest.fn().mockImplementation((em) => em);
    const socket = createSocket().onSend(spy);
    const emitter = createEmitter(socket);

    await waitForConnection(socket);

    emitter.setPayload({ test: "1" }).emit();

    await waitFor(() => {
      expect(spy).toHaveBeenCalledTimes(1);
    });
  });

  it("should trigger onReconnect callbacks", async () => {
    const spy = jest.fn();
    const socket = createSocket().onReconnect(spy);
    socket.adapter.reconnect();

    await waitFor(() => {
      expect(spy).toHaveBeenCalledTimes(1);
    });
  });

  it("should trigger onReconnectFailed callbacks", async () => {
    const spy = jest.fn();
    const socket = createSocket({ reconnect: 0 }).onReconnectFailed(spy);
    socket.adapter.reconnect();

    await waitFor(() => {
      expect(spy).toHaveBeenCalledTimes(1);
    });
  });
});
