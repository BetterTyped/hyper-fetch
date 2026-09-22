import { createWebsocketMockingServer, waitForConnection } from "@hyper-fetch/testing";
import { waitFor } from "@testing-library/dom";

import { createEmitter } from "../../utils/emitter.utils";
import { createSocket } from "../../utils/socket.utils";

describe("Socket Client  [ Callbacks ]", () => {
  const { getServer, startServer } = createWebsocketMockingServer();
  beforeEach(async () => {
    startServer();
    vi.resetAllMocks();
  });

  it("should trigger onConnected callbacks", async () => {
    const spy = vi.fn();
    createSocket().onConnected(spy);

    await waitFor(() => {
      expect(spy).toHaveBeenCalledTimes(1);
    });
  });

  it("should trigger onDisconnected callbacks", async () => {
    const spy = vi.fn();
    const socket = createSocket().onDisconnected(spy);
    socket.adapter.disconnect();

    await waitFor(() => {
      expect(spy).toHaveBeenCalledTimes(1);
    });
  });

  it("should trigger onError callbacks", async () => {
    const spy = vi.fn();
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
    const spy = vi.fn().mockImplementation((res) => res);
    const socket = createSocket().onMessage(spy);
    await waitForConnection(socket);
    getServer().send({ data: { topic: "test", data: "test" } });

    await waitFor(() => {
      expect(spy).toHaveBeenCalledTimes(1);
    });
  });

  it("should trigger onSend callbacks", async () => {
    const spy = vi.fn().mockImplementation((em) => em);
    const socket = createSocket().onSend(spy);
    const emitter = createEmitter(socket);

    await waitForConnection(socket);

    emitter.setPayload({ test: "1" }).emit();

    await waitFor(() => {
      expect(spy).toHaveBeenCalledTimes(1);
    });
  });

  it("should trigger onReconnect callbacks", async () => {
    const spy = vi.fn();
    const socket = createSocket().onReconnect(spy);
    socket.adapter.reconnect();

    await waitFor(() => {
      expect(spy).toHaveBeenCalledTimes(1);
    });
  });

  it("should trigger onReconnectFailed callbacks", async () => {
    const spy = vi.fn();
    const socket = createSocket({ reconnect: 0 }).onReconnectFailed(spy);
    socket.adapter.reconnect();

    await waitFor(() => {
      expect(spy).toHaveBeenCalledTimes(1);
    });
  });

  it("should register onConnect callbacks and allow chaining", () => {
    const callback = vi.fn(({ connection }) => connection);
    const socket = createSocket({ adapterOptions: { autoConnect: false } });

    const result = socket.onConnect(callback);

    expect(result).toBe(socket);
    expect(socket.unstable_onConnectCallbacks).toEqual([callback]);
  });

  it("should trigger onConnect callbacks before connecting", async () => {
    const spy = vi.fn(({ connection }) => connection);
    const socket = createSocket().onConnect(spy);

    await waitForConnection(socket);

    expect(spy).toHaveBeenCalledTimes(1);
    expect(spy).toHaveBeenCalledWith({
      connection: { url: "ws://localhost:1234", queryParams: undefined, adapterOptions: {} },
      attempt: 0,
    });
  });
});
