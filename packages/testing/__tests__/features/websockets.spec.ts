import { waitFor } from "@testing-library/dom";
import { ServerSentEventsAdapterType, Socket } from "@hyper-fetch/sockets";

import { createWebsocketMockingServer } from "../../src";

const { url, startServer, stopServer, emitListenerEvent, onEmitterEvent } = createWebsocketMockingServer();

describe("Websocket Mocking [ Base ]", () => {
  let socket = new Socket<ServerSentEventsAdapterType>({ url });

  beforeEach(() => {
    startServer();
    socket = new Socket<ServerSentEventsAdapterType>({ url });
    jest.resetAllMocks();
  });

  afterEach(() => {
    stopServer();
  });

  it("should emit and receive error event", async () => {
    const spy = jest.fn();
    const data = { name: "Maciej" };

    const listener = socket.createListener<{ name: string }>()({
      topic: "test",
    });

    const unmount = listener.listen((response) => {
      expect(response.extra.data).toBe(JSON.stringify({ data, topic: listener.topic }));
      spy(response.data);
    });

    emitListenerEvent(listener, data);

    await waitFor(() => {
      expect(spy).toHaveBeenCalledTimes(1);
      expect(spy).toHaveBeenCalledWith(data);
    });

    unmount();
  });
  it("should emit and receive error event", async () => {
    const data = { name: "Maciej" };

    const emitter = socket
      .createEmitter<{ name: string }>()({
        topic: "test",
      })
      .setData(data);

    emitter.emit();

    onEmitterEvent(emitter);
  });
});
