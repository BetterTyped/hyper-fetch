import { waitFor } from "@testing-library/dom";

import { createEmitter } from "../../utils/emitter.utils";
import { createSocket } from "../../utils/socket.utils";
import { createWsServer } from "../../websocket/websocket.server";

type DataType = {
  topic: string;
  age: number;
};

describe("Emitter [ Emit ]", () => {
  const message = { topic: "Maciej", age: 99 };
  const response = { data: "test" };

  let server = createWsServer();
  let socket = createSocket();
  let emitter = createEmitter<DataType>(socket, { timeout: 4000 });

  beforeEach(async () => {
    server = createWsServer();
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
      ack: (data) => {
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
    emitter.emit({ data: message, ack: spy, options: { timeout: 0 } });

    await waitFor(() => {
      expect(spy).toHaveBeenCalledTimes(1);
      expect(spy).toHaveBeenCalledWith({
        error: new Error("Server did not acknowledge the event"),
        data: null,
        extra: null,
      });
    });
  });

  it("should not acknowledge event message without ack", async () => {
    const spy = jest.fn();
    emitter.onData(() => spy).emit({ data: message, options: { timeout: 0 } });

    expect(spy).toHaveBeenCalledTimes(0);
  });

  it("should allow to set params", async () => {
    const spy = jest.fn();
    const emitterWithParams = socket.createEmitter<{ payload: DataType }>()({ topic: "test/:testId" });
    const id = emitterWithParams.emit({ data: message, params: { testId: 1 }, ack: (data) => spy(data) });

    server.send(JSON.stringify({ id, topic: emitterWithParams.setParams({ testId: 1 }).topic, data: response }));

    await waitFor(() => {
      expect(spy).toHaveBeenCalledOnce();
    });
  });

  it("should allow for using onData", async () => {
    const spy = jest.fn();
    let receivedData;

    const emitterWithParams = socket
      .createEmitter<{ payload: DataType }>()({ topic: "test/:testId", timeout: 8000 })
      .onData(({ data }, unmount) => {
        receivedData = data;
        spy();
        unmount();
      });
    const id = emitterWithParams.emit({
      data: message,
      params: { testId: 1 },
    });

    server.send(JSON.stringify({ id, topic: emitterWithParams.setParams({ testId: 1 }).topic, data: response }));

    await waitFor(() => {
      expect(spy).toHaveBeenCalledOnce();
      expect(receivedData).toStrictEqual(response);
    });
  });
});
