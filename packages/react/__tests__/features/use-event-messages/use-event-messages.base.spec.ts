import { act, waitFor } from "@testing-library/react";

import { renderUseEventMessages, sleep } from "../../utils";
import { createListener } from "../../utils/listener.utils";
import { createWsServer, sendWsEvent } from "../../websocket/websocket.server";
import { socket } from "../../utils/socket.utils";

describe("useEventMessages [ Base ]", () => {
  const spy = jest.fn();

  let listener = createListener();

  beforeEach(async () => {
    createWsServer();
    listener = createListener();
    jest.resetModules();
    jest.resetAllMocks();
  });

  describe("when hook receive event", () => {
    it("should set state with data", async () => {
      const message = { name: "Maciej", age: 99 };
      const view = renderUseEventMessages(socket);
      sendWsEvent(listener, message);
      await waitFor(() => {
        expect(view.result.current.data).toBeTruthy();
        expect(view.result.current.connected).toBeTrue();
        expect(view.result.current.connecting).toBeFalse();
        expect(view.result.current.timestamp).toBeNumber();
      });
    });
    it("should trigger onEvent callback", async () => {
      const message = { name: "Maciej", age: 99 };
      const view = renderUseEventMessages(socket);
      let receivedData;
      let receivedEventData;
      act(() => {
        view.result.current.onEvent((data, event) => {
          receivedData = data;
          receivedEventData = event;
          spy();
        });
      });
      sendWsEvent(listener, message);
      await waitFor(() => {
        expect(spy).toBeCalledTimes(1);
        expect(receivedData).toEqual(message);
        expect(receivedEventData).toBeDefined();
      });
    });
    it("should allow to filter onEvent callbacks", async () => {
      const message = { name: "Maciej", age: 99 };
      const view = renderUseEventMessages(socket, { filter: [listener.endpoint] });

      act(() => {
        view.result.current.onEvent(spy);
      });
      await act(async () => {
        sendWsEvent(listener, message);
        await sleep(10);
      });
      expect(spy).toBeCalledTimes(0);
    });
    it("should allow to pass filter function to onEvent callbacks", async () => {
      const message = { name: "Maciej", age: 99 };
      const view = renderUseEventMessages(socket, {
        filter: (endpoint) => [listener.endpoint].includes(endpoint as any),
      });

      act(() => {
        view.result.current.onEvent(spy);
      });
      await act(async () => {
        sendWsEvent(listener, message);
        await sleep(10);
      });
      expect(spy).toBeCalledTimes(0);
    });
  });
});
