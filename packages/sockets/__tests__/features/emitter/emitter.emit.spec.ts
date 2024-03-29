import { waitFor } from "@testing-library/dom";

import { createEmitter } from "../../utils/emitter.utils";
import { createSocket } from "../../utils/socket.utils";
import { createWsServer } from "../../websocket/websocket.server";

type DataType = {
  endpoint: string;
  age: number;
};

describe("Emitter [ Emit ]", () => {
  const message = { endpoint: "Maciej", age: 99 };
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
        endpoint: emitter.endpoint,
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

    server.send(JSON.stringify({ id, endpoint: emitter.endpoint, data: response }));

    await waitFor(() => {
      expect(spy).toBeCalledTimes(1);
      expect(spy).toBeCalledWith({ error: null, data: response, extra: receivedExtra });
    });
  });

  it("should not acknowledge event message", async () => {
    const spy = jest.fn();
    emitter.emit({ data: message, ack: spy, options: { timeout: 0 } });

    await waitFor(() => {
      expect(spy).toBeCalledTimes(1);
      expect(spy).toBeCalledWith({ error: new Error("Server did not acknowledge the event"), data: null, extra: null });
    });
  });

  it("should not acknowledge event message without ack", async () => {
    const spy = jest.fn();
    emitter.onData(() => spy).emit({ data: message, options: { timeout: 0 } });

    expect(spy).toBeCalledTimes(0);
  });

  it("should allow to set params", async () => {
    const spy = jest.fn();
    const emitterWithParams = socket.createEmitter<DataType, ResponseType>()({ endpoint: "test/:testId" });
    const id = emitterWithParams.emit({ data: message, params: { testId: 1 }, ack: (data) => spy(data) });

    server.send(JSON.stringify({ id, endpoint: emitterWithParams.setParams({ testId: 1 }).endpoint, data: response }));

    await waitFor(() => {
      expect(spy).toHaveBeenCalledOnce();
    });
  });

  it("should allow for using onData", async () => {
    const spy = jest.fn();
    let receivedData;

    const emitterWithParams = socket
      .createEmitter<DataType, ResponseType>()({ endpoint: "test/:testId", timeout: 8000 })
      .onData(({ data }, unmount) => {
        receivedData = data;
        spy();
        unmount();
      });
    const id = emitterWithParams.emit({
      data: message,
      params: { testId: 1 },
    });

    server.send(JSON.stringify({ id, endpoint: emitterWithParams.setParams({ testId: 1 }).endpoint, data: response }));

    await waitFor(() => {
      expect(spy).toHaveBeenCalledOnce();
      expect(receivedData).toStrictEqual(response);
    });
  });
});
