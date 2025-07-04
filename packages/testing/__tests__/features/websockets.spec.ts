import { waitFor } from "@testing-library/dom";
import { WebsocketAdapterType, Socket } from "@hyper-fetch/sockets";

import { createWebsocketMockingServer, waitForConnection } from "../../src";

const { url, startServer, stopServer, emitListenerEvent, expectEmitterEvent } = createWebsocketMockingServer();

describe("Websocket Mocking [ Base ]", () => {
  let socket: Socket<WebsocketAdapterType>;

  beforeEach(async () => {
    startServer();
    socket = new Socket<WebsocketAdapterType>({ url });
    jest.resetAllMocks();
    await waitForConnection(socket);
  });

  afterEach(() => {
    stopServer();
  });

  it("should receive event", async () => {
    const spy = jest.fn();
    const data = { name: "Maciej" };

    const listener = socket.createListener<{ name: string }>()({
      topic: "test",
    });

    const unmount = listener.listen((response) => {
      expect(response.data).toStrictEqual(data);
      expect(response.extra.data).toStrictEqual(JSON.stringify({ topic: listener.topic, data }));
      spy(response.data);
    });

    emitListenerEvent(listener, data);

    await waitFor(() => {
      expect(spy).toHaveBeenCalledTimes(1);
      expect(spy).toHaveBeenCalledWith(data);
    });

    unmount();
  });

  it("should emit event", async () => {
    const data = { name: "Maciej" };

    const emitter = socket
      .createEmitter<{ name: string }>()({
        topic: "test",
      })
      .setPayload(data);

    emitter.emit();

    await expectEmitterEvent(emitter);
  });
});
