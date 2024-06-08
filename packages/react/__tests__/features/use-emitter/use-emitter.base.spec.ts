import { Socket } from "@hyper-fetch/sockets";
import { act, waitFor } from "@testing-library/react";
import { createWebsocketMockingServer } from "@hyper-fetch/testing";

import { renderUseEmitter } from "../../utils/use-emitter.utils";

describe("useEmitter [ Base ]", () => {
  const { url, startServer, stopServer, expectEmitterEvent, waitForConnection } = createWebsocketMockingServer();
  let socket = new Socket({ url });
  let emitter = socket.createEmitter()({ topic: "test/:testId" });

  beforeEach(async () => {
    startServer();
    await waitForConnection();
    socket = new Socket({ url });
    emitter = socket.createEmitter()({ topic: "test/:testId" });
    await socket.adapter.waitForConnection();

    jest.resetModules();
    jest.resetAllMocks();
  });

  afterEach(() => {
    stopServer();
  });

  describe("when hook emit event", () => {
    it("should set state with data", async () => {
      const message = { name: "Maciej", age: 99 };
      const view = renderUseEmitter(emitter);

      act(() => {
        view.result.current.emit({ data: message, params: { testId: "1" } });
      });

      await expectEmitterEvent(emitter.setParams({ testId: "1" }), message);

      await waitFor(() => {
        expect(view.result.current.connected).toBeTrue();
        expect(view.result.current.connecting).toBeFalse();
      });
    });
  });
});
