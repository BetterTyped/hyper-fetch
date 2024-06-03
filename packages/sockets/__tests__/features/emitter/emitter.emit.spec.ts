import { waitFor } from "@testing-library/dom";
import { createWebsocketMockingServer } from "@hyper-fetch/testing";

import { createEmitter } from "../../utils/emitter.utils";
import { createSocket } from "../../utils/socket.utils";

const { server, startServer } = createWebsocketMockingServer();

type DataType = {
  topic: string;
  age: number;
};

describe("Emitter [ Emit ]", () => {
  const message = { topic: "Maciej", age: 99 };
  const response = { data: "test" };

  let socket = createSocket();
  let emitter = createEmitter<DataType>(socket, { timeout: 4000 });

  beforeEach(async () => {
    startServer();
    socket = createSocket();
    emitter = createEmitter<DataType>(socket, { timeout: 4000 });
    jest.resetAllMocks();
    await server.connected;
  });

  it("should emit event message", async () => {
    const id = emitter.emit({ data: message });

    await expect(server).toReceiveMessage(
      JSON.stringify({
        id,
        topic: emitter.topic,
        data: message,
      }),
    );
  });

  it("should acknowledge event message", async () => {
    const spy = jest.fn();
    let receivedExtra;
    const id = emitter.emit({
      data: message,
      onEvent: (data) => {
        spy(data);
        receivedExtra = data.extra;
      },
    });

    server.send(JSON.stringify({ id, topic: emitter.topic, data: response }));

    await waitFor(() => {
      expect(spy).toHaveBeenCalledTimes(1);
      expect(spy).toHaveBeenCalledWith({ error: null, data: response, extra: receivedExtra });
    });
  });

  it("should not acknowledge event message", async () => {
    const spy = jest.fn();
    emitter.emit({ data: message, onEvent: spy, options: { timeout: 0 } });

    await waitFor(() => {
      expect(spy).toHaveBeenCalledTimes(1);
      expect(spy).toHaveBeenCalledWith({
        error: new Error("Server did not acknowledge the event"),
        data: null,
        extra: null,
      });
    });
  });

  it("should allow to set params", async () => {
    const spy = jest.fn();
    const emitterWithParams = socket.createEmitter<DataType>()({ topic: "test/:testId" });
    const id = emitterWithParams.emit({ data: message, params: { testId: 1 }, onEvent: (data) => spy(data) });

    server.send(JSON.stringify({ id, topic: emitterWithParams.setParams({ testId: 1 }).topic, data: response }));

    await waitFor(() => {
      expect(spy).toHaveBeenCalledOnce();
    });
  });
});
