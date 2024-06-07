import { waitFor } from "@testing-library/dom";
import { createWebsocketMockingServer } from "@hyper-fetch/testing";

import { createEmitter } from "../../utils/emitter.utils";
import { createSocket } from "../../utils/socket.utils";

describe("Socket Client  [ Callbacks ]", () => {
  const { getServer, startServer, waitForConnection } = createWebsocketMockingServer();
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
    getServer().error();

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

    await waitForConnection();

    emitter.setData({ test: "1" }).emit();

    await waitFor(() => {
      expect(spy).toHaveBeenCalledTimes(1);
    });
  });

  it("should trigger onReconnect callbacks", async () => {
    const spy = jest.fn();
    const socket = createSocket().onReconnect(spy);
    socket.adapter.reconnect();
    await waitForConnection();

    await waitFor(() => {
      expect(spy).toHaveBeenCalledTimes(1);
    });
  });

  it("should trigger onReconnectStop callbacks", async () => {
    const spy = jest.fn();
    const socket = createSocket({ reconnect: 0 }).onReconnectStop(spy);
    socket.adapter.reconnect();
    await waitForConnection();

    await waitFor(() => {
      expect(spy).toHaveBeenCalledTimes(1);
    });
  });
});
