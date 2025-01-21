import { createWebsocketMockingServer } from "@hyper-fetch/testing";

import { createEmitter } from "../../utils/emitter.utils";
import { createSocket } from "../../utils/socket.utils";

type DataType = {
  topic: string;
  age: number;
};

describe("Emitter [ Emit ]", () => {
  const { getServer, startServer, expectEmitterEvent } = createWebsocketMockingServer();
  const message = { topic: "Maciej", age: 99 };

  let socket = createSocket();
  let emitter = createEmitter<DataType>(socket, { timeout: 4000 });

  beforeEach(async () => {
    startServer();
    socket = createSocket();
    emitter = createEmitter<DataType>(socket, { timeout: 4000 });
    jest.resetAllMocks();
    await socket.waitForConnection();
  });

  it("should emit event message", async () => {
    emitter.emit({ payload: message });

    await expect(getServer()).toReceiveMessage(
      JSON.stringify({
        topic: emitter.topic,
        data: message,
      }),
    );
  });

  it("should allow to set params", async () => {
    const emitterWithParams = socket.createEmitter<DataType>()({ topic: "test/:testId" });
    emitterWithParams.emit({ payload: message, params: { testId: 1 } });

    await expectEmitterEvent(emitterWithParams.setParams({ testId: 1 }), message);
  });
});
