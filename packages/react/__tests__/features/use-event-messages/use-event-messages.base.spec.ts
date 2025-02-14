import { Socket } from "@hyper-fetch/sockets";
import { act, waitFor } from "@testing-library/react";
import { createWebsocketMockingServer, sleep } from "@hyper-fetch/testing";

import { renderUseEventMessages } from "../../utils";
import { createListener } from "../../utils/listener.utils";
import * as provider from "provider";

jest.mock("provider", () => ({
  useProvider: jest.fn(),
}));

describe("useEventMessages [ Base ]", () => {
  const { url, startServer, stopServer, emitListenerEvent } = createWebsocketMockingServer();
  const spy = jest.fn();
  let socket = new Socket({ url });
  let listener = createListener();

  beforeEach(async () => {
    startServer();
    socket = new Socket({ url });
    listener = createListener();
    await socket.waitForConnection();
    (provider.useProvider as jest.Mock).mockReturnValue({ config: {} });
  });

  afterEach(() => {
    stopServer();
    jest.clearAllMocks();
  });

  describe("when hook receive event", () => {
    it("should set state with data", async () => {
      const message = { name: "Maciej", age: 99 };
      const view = renderUseEventMessages(socket);
      emitListenerEvent(listener, message);
      await waitFor(() => {
        expect(view.result.current.data).toStrictEqual(message);
        expect(view.result.current.connected).toBeTrue();
        expect(view.result.current.connecting).toBeFalse();
        expect(view.result.current.timestamp).toBeNumber();
      });
    });
    it("should trigger onEvent callback", async () => {
      const message = { name: "Maciej", age: 99 };
      const view = renderUseEventMessages(socket);
      let receivedData: any;
      let receivedEventData: any;
      act(() => {
        view.result.current.onEvent((data, event) => {
          receivedData = data;
          receivedEventData = event;
          spy();
        });
      });
      emitListenerEvent(listener, message);
      await waitFor(() => {
        expect(spy).toHaveBeenCalledTimes(1);
        expect(receivedData).toEqual(message);
        expect(receivedEventData).toBeDefined();
      });
    });
    it("should allow to filter onEvent callbacks", async () => {
      const message = { name: "Maciej", age: 99 };
      const view = renderUseEventMessages(socket, { filter: [listener.topic] });

      act(() => {
        view.result.current.onEvent(spy);
      });
      await act(async () => {
        emitListenerEvent(listener, message);
        await sleep(10);
      });
      expect(spy).toHaveBeenCalledTimes(0);
    });
    it("should allow to pass filter function to onEvent callbacks", async () => {
      const message = { name: "Maciej", age: 99 };
      const view = renderUseEventMessages(socket, {
        filter: (topic) => ![listener.topic].includes(topic as any),
      });

      act(() => {
        view.result.current.onEvent(spy);
      });
      await act(async () => {
        emitListenerEvent(listener, message);
        await sleep(10);
      });
      expect(spy).toHaveBeenCalledTimes(0);
    });
    it("should use config from Provider when available", async () => {
      const message = { name: "Maciej", age: 99 };
      (provider.useProvider as jest.Mock).mockReturnValue({
        config: {
          useEventMessages: {
            filter: [listener.topic],
          },
        },
      });

      const view = renderUseEventMessages(socket);

      act(() => {
        view.result.current.onEvent(spy);
      });
      await act(async () => {
        emitListenerEvent(listener, message);
        await sleep(10);
      });
      expect(spy).toHaveBeenCalledTimes(0);
    });
    it("should work without Provider config", async () => {
      const message = { name: "Maciej", age: 99 };
      const view = renderUseEventMessages(socket);

      act(() => {
        view.result.current.onEvent(spy);
      });
      await act(async () => {
        emitListenerEvent(listener, message);
        await sleep(10);
      });
      expect(spy).toHaveBeenCalledTimes(1);
    });
    it("should handle dependencyTracking when enabled", async () => {
      const message = { name: "Maciej", age: 99 };
      const view = renderUseEventMessages(socket, { dependencyTracking: true });

      let receivedData: any;
      act(() => {
        view.result.current.onEvent((data) => {
          receivedData = data;
          spy();
        });
      });

      await act(async () => {
        emitListenerEvent(listener, message);
        await sleep(10);
      });

      expect(spy).toHaveBeenCalledTimes(1);
      expect(receivedData).toEqual(message);
    });
    it("should not filter events when filter array is empty", async () => {
      const message = { name: "Maciej", age: 99 };
      const view = renderUseEventMessages(socket, { filter: [] });

      act(() => {
        view.result.current.onEvent(spy);
      });

      await act(async () => {
        emitListenerEvent(listener, message);
        await sleep(10);
      });

      expect(spy).toHaveBeenCalledTimes(1);
    });
    it("should handle filter function that returns true", async () => {
      const message = { name: "Maciej", age: 99 };
      const view = renderUseEventMessages(socket, {
        filter: () => true,
      });

      act(() => {
        view.result.current.onEvent(spy);
      });

      emitListenerEvent(listener, message);
      await waitFor(() => {
        expect(spy).toHaveBeenCalledTimes(1);
      });
    });
  });
});
