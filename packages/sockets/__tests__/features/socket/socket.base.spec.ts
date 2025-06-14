import { waitFor } from "@testing-library/dom";
import { createWebsocketMockingServer, waitForConnection } from "@hyper-fetch/testing";

import { Socket } from "socket";
import { createSocket } from "../../utils/socket.utils";
import { createEmitter } from "../../utils/emitter.utils";
import { Emitter } from "emitter";

type DataType = {
  test: string;
};

describe("Socket [ Base ]", () => {
  const { getServer, startServer, stopServer, emitListenerEvent } = createWebsocketMockingServer();
  let server = getServer();
  let socket: ReturnType<typeof createSocket>;
  let emitter: ReturnType<typeof createEmitter<DataType>>;

  beforeEach(async () => {
    startServer();
    server = getServer();
    socket = createSocket();
    emitter = createEmitter<DataType>(socket);
    jest.resetAllMocks();
    await waitForConnection(socket);
  });

  it("should initialize Socket", async () => {
    const s = new Socket({ url: "ws://localhost:8080" });
    expect(s).toBeDefined();
  });

  it("should initialize with autoConnect", async () => {
    const s = new Socket({ url: "ws://localhost:8080", adapterOptions: { autoConnect: true } });
    expect(s.options.adapterOptions?.autoConnect).toBeTrue();
  });

  it("should emit message", async () => {
    const message: DataType = { test: "Maciej" };

    const emitterInstance = emitter.setPayload(message);
    emitterInstance.emit();

    expect(server).toReceiveMessage(
      JSON.stringify({
        topic: emitter.topic,
        data: message,
      }),
    );
  });
  it("should not throw on message without name", async () => {
    const spy = jest.fn().mockImplementation((res) => res);
    socket.onMessage(spy);
    socket.adapter.listeners.get = jest.fn();
    server.send(undefined as any);
    expect(spy).toHaveBeenCalledTimes(1);
    expect(socket.adapter.listeners.get).toHaveBeenCalledWith(undefined);
  });
  it("should allow to connect", async () => {
    const spy = jest.fn();
    socket.events.onConnected(spy);
    socket.adapter.connect();
    await waitFor(() => {
      expect(spy).toHaveBeenCalledTimes(1);
    });
  });
  it("should allow to disconnect", async () => {
    const spy = jest.fn();
    socket.events.onDisconnected(spy);
    socket.adapter.disconnect();
    await waitFor(() => {
      expect(spy).toHaveBeenCalledTimes(1);
    });
  });
  it("should handle errors and trigger error callbacks", async () => {
    const errorSpy = jest.fn();

    socket.onError(errorSpy);

    stopServer({
      code: 1000,
      reason: "Test reason",
      wasClean: false,
    });

    await waitFor(() => {
      expect(errorSpy).toHaveBeenCalledTimes(1);
    });
  });
  it("should handle message callbacks with data and extra info", async () => {
    const messageSpy = jest.fn();
    const testData = { topic: "message", data: "test" };

    const messageListener = socket.createListener<{ data: any; extra: any }>()({ topic: "message" });
    socket.onMessage(({ event }) => {
      messageSpy(event);

      return event;
    });
    emitListenerEvent(messageListener, testData);

    await waitFor(() => {
      expect(messageSpy).toHaveBeenCalledTimes(1);
      expect(messageSpy).toHaveBeenCalledWith(testData);
    });
  });
  it("should handle send callbacks", async () => {
    const sendSpy = jest.fn();
    const message: DataType = { test: "test" };

    socket.onSend(({ emitter: e }) => {
      sendSpy(e);
      expect(e).toBeInstanceOf(Emitter);
      return e;
    });
    const emitterInstance = emitter.setPayload(message);
    emitterInstance.emit();

    await waitFor(() => {
      expect(sendSpy).toHaveBeenCalledTimes(1);
      expect(sendSpy).toHaveBeenCalledWith(
        expect.objectContaining({
          payload: message,
        }),
      );
    });
  });
  it("should set query params and allow chaining", () => {
    const queryParams = { token: "test-token" };
    const setQueryParamsSpy = jest.spyOn(socket.adapter, "setQueryParams");

    const result = socket.setQueryParams(queryParams);

    expect(setQueryParamsSpy).toHaveBeenCalledWith(queryParams);
    expect(result).toBe(socket);
  });
  it("should allow to reconnect", async () => {
    const spy = jest.fn();
    socket.events.onConnected(spy);

    await socket.reconnect();

    await waitFor(() => {
      expect(spy).toHaveBeenCalledTimes(1);
    });
  });
  it("should call adapter connect method", async () => {
    const connectSpy = jest.spyOn(socket.adapter, "connect");

    await socket.connect();

    expect(connectSpy).toHaveBeenCalledTimes(1);
  });
});
