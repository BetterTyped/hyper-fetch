import { act } from "@testing-library/react";

import { socket } from "../../../utils/socket.utils";
import { renderUseSocketState } from "../../../utils/use-socket-state.utils";

describe("useSocketState [ Base ]", () => {
  const spy = jest.fn();
  let view = renderUseSocketState(socket);

  beforeEach(async () => {
    view = renderUseSocketState(socket);
    jest.resetModules();
    jest.resetAllMocks();
  });

  describe("when using actions", () => {
    it("should set state with data", async () => {
      const value = 1;
      const [state, actions] = view.result.current;
      act(() => {
        actions.setData(value);
      });
      expect(state.data).toBe(value);
    });
    it("should set state with timestamp", async () => {
      const value = 1;
      const [state, actions] = view.result.current;
      act(() => {
        actions.setTimestamp(value);
      });
      expect(state.timestamp).toBe(value);
    });
    it("should set state with connected value", async () => {
      const value = true;
      const [state, actions] = view.result.current;
      act(() => {
        actions.setConnected(value);
      });
      expect(state.connected).toBe(value);
    });
    it("should set state with connecting value", async () => {
      const value = true;
      const [state, actions] = view.result.current;
      act(() => {
        actions.setConnecting(value);
      });
      expect(state.connecting).toBe(value);
    });
  });
  describe("when using callbacks", () => {
    it("should call onOpen callback", async () => {
      const [, , callbacks] = view.result.current;
      act(() => {
        socket.events.emitOpen();
        callbacks.onOpen(spy);
        socket.events.emitOpen();
      });
      expect(spy).toBeCalledTimes(1);
    });
    it("should call onClose callback", async () => {
      const [, , callbacks] = view.result.current;
      act(() => {
        socket.events.emitClose();
        callbacks.onClose(spy);
        socket.events.emitClose();
      });
      expect(spy).toBeCalledTimes(1);
    });
    it("should call onError callback", async () => {
      const value = {} as MessageEvent;
      const [, , callbacks] = view.result.current;
      act(() => {
        socket.events.emitError(value);
        callbacks.onError(spy);
        socket.events.emitError(value);
      });
      expect(spy).toBeCalledTimes(1);
      expect(spy).toBeCalledWith(value);
    });
    it("should call onConnecting callback", async () => {
      const [, , callbacks] = view.result.current;
      act(() => {
        socket.events.emitConnecting();
        callbacks.onConnecting(spy);
        socket.events.emitConnecting();
      });
      expect(spy).toBeCalledTimes(1);
    });
    it("should call onReconnecting callback", async () => {
      const value = 2;
      const [, , callbacks] = view.result.current;
      act(() => {
        socket.events.emitReconnecting(value);
        callbacks.onReconnecting(spy);
        socket.events.emitReconnecting(value);
      });
      expect(spy).toBeCalledTimes(1);
      expect(spy).toBeCalledWith(value);
    });
    it("should call onReconnectingStop callback", async () => {
      const value = 2;
      const [, , callbacks] = view.result.current;
      act(() => {
        socket.events.emitReconnectingStop(value);
        callbacks.onReconnectingStop(spy);
        socket.events.emitReconnectingStop(value);
      });
      expect(spy).toBeCalledTimes(1);
      expect(spy).toBeCalledWith(value);
    });
  });
});
