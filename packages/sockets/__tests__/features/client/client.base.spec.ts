import { waitFor } from "@testing-library/dom";

import { createEmitter } from "../../utils/emitter.utils";
import { createSocket } from "../../utils/socket.utils";
import { createWsServer } from "../../websocket/websocket.server";

type DataType = {
  test: string;
};

describe("Socket Client [ Base ]", () => {
  let server = createWsServer();
  let socket = createSocket();
  let emitter = createEmitter<DataType>(socket);

  beforeEach(() => {
    server = createWsServer();
    socket = createSocket();
    emitter = createEmitter<DataType>(socket);
    jest.resetAllMocks();
  });

  it("should emit message", async () => {
    const message = { test: "Maciej" };

    const emitterId = "my-id";
    const emitterInstance = emitter.setData(message);
    socket.client.emit(emitterId, emitterInstance);

    expect(server).toReceiveMessage(
      JSON.stringify({
        id: emitterId,
        type: emitter.name,
        data: message,
      }),
    );
  });

  it("should listen to events", async () => {
    const message = { test: "Maciej" };

    const emitterId = "my-id";
    const emitterInstance = emitter.setData(message);
    socket.client.emit(emitterId, emitterInstance);
  });
  it("should not throw on message without type", async () => {
    const spy = jest.fn().mockImplementation((res) => res);
    socket.onMessage(spy);
    socket.client.listeners.get = jest.fn();
    server.send(undefined);
    expect(spy).toBeCalledTimes(1);
    expect(socket.client.listeners.get).toBeCalledWith(undefined);
  });
  it("should allow to connect", async () => {
    const spy = jest.fn();
    socket.events.onOpen(spy);
    socket.client.connect();
    await waitFor(() => {
      expect(spy).toBeCalledTimes(1);
    });
  });
  it("should allow to disconnect", async () => {
    const spy = jest.fn();
    socket.events.onClose(spy);
    socket.client.disconnect();
    await waitFor(() => {
      expect(spy).toBeCalledTimes(1);
    });
  });
});
