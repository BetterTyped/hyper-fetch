import { createWebsocketMockingServer } from "@hyper-fetch/testing";
import { waitFor } from "@testing-library/react";

import { createEmitter } from "../../utils/emitter.utils";
import { createSocket } from "../../utils/socket.utils";

type DataType = {
  test: string;
};

describe("Emitter [ Base ]", () => {
  const { startServer, expectEmitterEvent } = createWebsocketMockingServer();
  let socket = createSocket();
  let emitter = createEmitter<DataType>(socket);

  beforeEach(async () => {
    startServer();
    socket = createSocket();
    emitter = createEmitter<DataType>(socket);
    jest.resetAllMocks();
    await socket.waitForConnection();
  });

  it("should initialize emitter with correct name", async () => {
    const topic = "my-custom-name";
    emitter = createEmitter(socket, { topic });
    expect(emitter.topic).toBe(topic);
  });

  it("should allow to set additional adapter options", async () => {
    const options = { something: "custom" };
    const newEmitter = (emitter as any).setOptions(options);
    expect(newEmitter.options).toStrictEqual(options);
  });

  it("should allow to set timeout", async () => {
    const timeout = 20000;
    const newEmitter = emitter.setTimeout(timeout);
    expect(newEmitter.timeout).toStrictEqual(timeout);
  });

  it("should allow to set event data", async () => {
    const data = { test: "test-data" };
    const newEmitter = emitter.setPayload(data);
    expect(newEmitter.payload).toStrictEqual(data);
  });

  it("should allow to set data mapper", async () => {
    const data = { test: "test-data" };
    const spy = jest.fn();
    const dataMapper = (d: DataType) => {
      spy();
      return Object.keys(d);
    };
    const newEmitter = emitter.setPayloadMapper(dataMapper).setTimeout(20000).setPayload(data);
    expect(newEmitter.payload).toStrictEqual(data);
    newEmitter.emit();
    await waitFor(() => {
      expect(spy).toHaveBeenCalled();
    });
    await expectEmitterEvent(emitter, Object.keys(data));
  });

  it("should allow inherit params", async () => {
    const newEmitter = socket.createEmitter()({ topic: "test/:testId" }).setParams({ testId: 1 });
    expect(newEmitter.clone().params).toStrictEqual({ testId: 1 });
    expect(newEmitter.clone({ params: { testId: 3 } }).params).toStrictEqual({ testId: 3 });
  });
});
