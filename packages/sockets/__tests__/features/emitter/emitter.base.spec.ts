import { createEmitter } from "../../utils/emitter.utils";
import { createSocket } from "../../utils/socket.utils";
import { createWsServer } from "../../websocket/websocket.server";

type DataType = {
  test: string;
};

describe("Emitter [ Base ]", () => {
  let socket = createSocket();
  let emitter = createEmitter<DataType>(socket);

  beforeEach(() => {
    createWsServer();
    socket = createSocket();
    emitter = createEmitter<DataType>(socket);
    jest.resetAllMocks();
  });

  it("should initialize emitter with correct name", async () => {
    const topic = "my-custom-name";
    emitter = createEmitter(socket, { topic });
    expect(emitter.topic).toBe(topic);
  });

  it("should allow to set additional adapter options", async () => {
    const options = { something: "custom" };
    const newEmitter = emitter.setOptions(options);
    expect(newEmitter.options).toStrictEqual(options);
  });

  it("should allow to set timeout", async () => {
    const timeout = 20000;
    const newEmitter = emitter.setTimeout(timeout);
    expect(newEmitter.timeout).toStrictEqual(timeout);
  });

  it("should allow to set event data", async () => {
    const data = { test: "test-data" };
    const newEmitter = emitter.setData(data);
    expect(newEmitter.data).toStrictEqual(data);
  });

  it("should allow to set data mapper", async () => {
    const data = { test: "test-data" };
    const dataMapper = (d: DataType) => Object.keys(d);
    const newEmitter = emitter.setDataMapper(dataMapper).setTimeout(20000).setData(data);
    expect(newEmitter.data).toStrictEqual(Object.keys(data));
  });

  it("should allow inherit params", async () => {
    const newEmitter = socket.createEmitter()({ topic: "test/:testId" }).setParams({ testId: 1 });
    expect(newEmitter.clone().params).toStrictEqual({ testId: 1 });
    expect(newEmitter.clone({ params: { testId: 3 } }).params).toStrictEqual({ testId: 3 });
  });
});
