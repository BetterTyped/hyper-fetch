import { waitFor } from "@testing-library/dom";

import { createEmitter } from "../../utils/emitter.utils";
import { createSocket } from "../../utils/socket.utils";
import { createWsServer } from "../../websocket/websocket.server";

type DataType = {
  name: string;
  age: number;
};

describe("Emitter [ Emit ]", () => {
  const message = { name: "Maciej", age: 99 };
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
        name: emitter.name,
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

    await expect(server).toReceiveMessage(
      JSON.stringify({
        id,
        name: emitter.name,
        data: message,
      }),
    );

    server.send(JSON.stringify({ id, name: emitter.name, data: response }));

    await waitFor(() => {
      expect(spy).toBeCalledTimes(1);
      expect(spy).toBeCalledWith({ error: null, data: response, extra: receivedExtra });
    });
  });

  it("should not acknowledge event message", async () => {
    const spy = jest.fn();
    const id = emitter.emit({ data: message, ack: spy, options: { timeout: 1 } });

    await expect(server).toReceiveMessage(
      JSON.stringify({
        id,
        name: emitter.name,
        data: message,
      }),
    );

    await waitFor(() => {
      expect(spy).toBeCalledTimes(1);
      expect(spy).toBeCalledWith({ error: new Error("Server did not acknowledge the event"), data: null, extra: null });
    });
  });

  it("should allow to set params", async () => {
    const spy = jest.fn();
    const emitterWithParams = socket.createEmitter<DataType, ResponseType>()({ name: "test/:testId" });
    const id = emitterWithParams.emit({ data: message, params: { testId: 1 }, ack: (data) => spy(data) });

    await expect(server).toReceiveMessage(
      JSON.stringify({
        id,
        name: emitterWithParams.setParams({ testId: 1 }).name,
        data: message,
      }),
    );

    server.send(JSON.stringify({ id, name: emitterWithParams.setParams({ testId: 1 }).name, data: response }));

    await waitFor(() => {
      expect(spy).toHaveBeenCalledOnce();
    });
  });

  it("should allow to for making connection", async () => {
    const spy = jest.fn();
    let receivedData;

    const emitterWithParams = socket
      .createEmitter<DataType, ResponseType>()({ name: "test/:testId" })
      .onData(({ data }, unmount) => {
        receivedData = data;
        spy();
        unmount();
      });
    const id = emitterWithParams.emit({
      data: message,
      params: { testId: 1 },
    });

    await expect(server).toReceiveMessage(
      JSON.stringify({
        id,
        name: emitterWithParams.setParams({ testId: 1 }).name,
        data: message,
      }),
    );

    server.send(JSON.stringify({ id, name: emitterWithParams.setParams({ testId: 1 }).name, data: response }));

    await waitFor(() => {
      expect(spy).toHaveBeenCalledOnce();
      expect(receivedData).toStrictEqual(response);
    });
  });
});
