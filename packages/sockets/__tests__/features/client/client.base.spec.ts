import { waitFor } from "@testing-library/dom";
import { createWebsocketMockingServer } from "@hyper-fetch/testing";

import { createEmitter } from "../../utils/emitter.utils";
import { createSocket } from "../../utils/socket.utils";
import { emitEvent } from "emitter";

type DataType = {
  test: string;
};

describe("Socket Client [ Base ]", () => {
  const { getServer, waitForConnection } = createWebsocketMockingServer();
  let server = getServer();
  let socket = createSocket();
  let emitter = createEmitter<DataType>(socket);

  beforeEach(async () => {
    server = getServer();
    socket = createSocket();
    emitter = createEmitter<DataType>(socket);
    jest.resetAllMocks();
    await waitForConnection();
  });

  it("should emit message", async () => {
    const message: DataType = { test: "Maciej" };

    const emitterInstance = emitter.setData(message);
    emitEvent(emitterInstance);

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
    server.send(undefined);
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
});
