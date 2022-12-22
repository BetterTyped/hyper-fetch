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
    const name = "my-custom-name";
    emitter = createEmitter(socket, { name });
    expect(emitter.name).toBe(name);
  });

  it("should allow to set additional client options", async () => {
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
});
