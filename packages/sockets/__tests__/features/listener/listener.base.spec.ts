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

  it("should initialize Listener with correct endpoint", async () => {
    const endpoint = "my-custom-endpoint";
    listener = createListener(socket, { endpoint });
    expect(listener.endpoint).toBe(endpoint);
  });

  it("should allow to set additional adapter options", async () => {
    const options = { something: "custom" };
    const newListener = listener.setOptions(options);
    expect(newListener.options).toStrictEqual(options);
  });

  it("should allow to set params", async () => {
    const newListener = socket.createListener()({ endpoint: "test/:testId" }).setParams({ testId: 1 });
    expect(newListener.endpoint).toBe("test/1");
    expect(newListener.clone().endpoint).toBe("test/1");
  });
});
