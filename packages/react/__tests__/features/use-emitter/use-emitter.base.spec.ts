import { Socket } from "@hyper-fetch/sockets";
import { act, waitFor } from "@testing-library/react";
import { createWebsocketMockingServer, sleep, waitForConnection } from "@hyper-fetch/testing";

import { renderUseEmitter } from "../../utils/use-emitter.utils";

describe("useEmitter [ Base ]", () => {
  const { url, startServer, stopServer, expectEmitterEvent } = createWebsocketMockingServer();
  let socket = new Socket({ url });
  let emitter = socket.createEmitter<{ name: string; age: number }>()({ topic: "test/:testId" });

  beforeEach(async () => {
    startServer();
    socket = new Socket({ url });
    emitter = socket.createEmitter<{ name: string; age: number }>()({ topic: "test/:testId" });
    await waitForConnection(socket);

    jest.resetModules();
    jest.resetAllMocks();
  });

  afterEach(() => {
    stopServer();
  });

  describe("when hook emit event", () => {
    it("should set state with data", async () => {
      const myEmitter = emitter.setParams({ testId: "1" });

      const message = { name: "Maciej", age: 99 };
      const view = renderUseEmitter(myEmitter);

      act(() => {
        view.result.current.emit({ payload: message });
      });

      await expectEmitterEvent(myEmitter.setParams({ testId: "1" }), message);

      await waitFor(() => {
        expect(view.result.current.connected).toBeTrue();
        expect(view.result.current.connecting).toBeFalse();
      });
    });

    it("should handle emit error correctly", async () => {
      const error = new Error("Emit error");
      const view = renderUseEmitter(emitter);
      let capturedError: Error | null = null;

      view.result.current.onEmitError((err) => {
        capturedError = err;
      });

      act(() => {
        emitter.socket.events.emitEmitterError(error, emitter);
      });

      await waitFor(() => {
        expect(capturedError).toEqual(error);
      });
    });

    it("should trigger onEmit callback when emitting", async () => {
      const message = { name: "Test", age: 25 };
      const instance = emitter.setParams({ testId: "1" });
      const view = renderUseEmitter(instance);
      let emitCalled = false;

      view.result.current.onEmit(() => {
        emitCalled = true;
      });

      act(() => {
        view.result.current.emit({ payload: message });
      });

      await expectEmitterEvent(instance, message);

      expect(emitCalled).toBeTrue();
    });

    it("should handle undefined onEmit callback", async () => {
      const myEmitter = emitter.setParams({ testId: "1" });
      renderUseEmitter(myEmitter);

      // Should not throw when callback is undefined
      act(() => {
        myEmitter.socket.events.emitEmitterStartEvent(myEmitter);
      });

      // No assertion needed - test passes if no error is thrown
      await sleep(10);
    });
  });

  describe("when emitter topic changes", () => {
    it("should update event listeners", async () => {
      const emitter1 = emitter.setParams({ testId: "1" });
      const view = renderUseEmitter(emitter1);
      let callCount = 0;

      view.result.current.onEmit(() => {
        callCount += 1;
      });

      act(() => {
        view.result.current.emit({ payload: { name: "Maciej", age: 99 } });
      });

      await expectEmitterEvent(emitter1, { name: "Maciej", age: 99 });
      expect(callCount).toBe(1);

      const emitter2 = socket.createEmitter()({ topic: "test/:testId" }).setParams({ testId: "2" });
      view.rerender({ emitter: emitter2 });

      act(() => {
        view.result.current.emit({ payload: { name: "Maciej", age: 12 } });
      });

      await expectEmitterEvent(emitter2, { name: "Maciej", age: 12 });
      expect(callCount).toBe(2);
    });
  });
});
