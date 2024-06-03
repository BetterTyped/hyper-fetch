import { createWebsocketMockingServer } from "@hyper-fetch/testing";

import { createListener } from "../../utils/listener.utils";
import { createSocket } from "../../utils/socket.utils";

const { startServer, waitForConnection } = createWebsocketMockingServer();

describe("Listener [ Base ]", () => {
  let socket = createSocket();
  let listener = createListener(socket);

  beforeEach(async () => {
    startServer();
    socket = createSocket();
    listener = createListener(socket);
    jest.resetAllMocks();
    await waitForConnection();
  });

  it("should initialize Listener with correct topic", async () => {
    const topic = "my-custom-topic";
    listener = createListener(socket, { topic });
    expect(listener.topic).toBe(topic);
  });

  it("should allow to set additional adapter options", async () => {
    const options = { something: "custom" };
    const newListener = listener.setOptions(options);
    expect(newListener.options).toStrictEqual(options);
  });

  it("should allow to set params", async () => {
    const newListener = socket.createListener()({ topic: "test/:testId" }).setParams({ testId: 1 });
    expect(newListener.topic).toBe("test/1");
    expect(newListener.clone().topic).toBe("test/1");
  });
});
