import { createListener } from "../../utils/listener.utils";
import { createSocket } from "../../utils/socket.utils";
import { createWsServer } from "../../websocket/websocket.server";

describe("Listener [ Base ]", () => {
  let socket = createSocket();
  let listener = createListener(socket);

  beforeEach(() => {
    createWsServer();
    socket = createSocket();
    listener = createListener(socket);
    jest.resetAllMocks();
  });

  it("should initialize Listener with correct name", async () => {
    const name = "my-custom-name";
    listener = createListener(socket, { name });
    expect(listener.name).toBe(name);
  });

  it("should allow to set additional adapter options", async () => {
    const options = { something: "custom" };
    const newListener = listener.setOptions(options);
    expect(newListener.options).toStrictEqual(options);
  });

  it("should allow to set params", async () => {
    const newListener = socket.createListener()({ name: "test/:testId" }).setParams({ testId: 1 });
    expect(newListener.name).toBe("test/1");
    expect(newListener.clone().name).toBe("test/1");
  });
});
