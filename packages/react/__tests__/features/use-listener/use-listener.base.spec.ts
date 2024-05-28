import { act, waitFor } from "@testing-library/react";

import { createListener } from "../../utils/listener.utils";
import { renderUseListener } from "../../utils/use-listener.utils";
import { createWsServer, sendWsEvent } from "../../websocket/websocket.server";

describe("useListener [ Base ]", () => {
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
      const view = renderUseListener(listener);
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
      const view = renderUseListener(listener);
      let receivedData;
      let receivedEventData;
      act(() => {
        view.result.current.onEvent(({ data, extra }) => {
          receivedData = data;
          receivedEventData = extra;
          spy();
        });
      });
      sendWsEvent(listener, message);
      await waitFor(() => {
        expect(spy).toHaveBeenCalledTimes(1);
        expect(receivedData).toEqual(message);
        expect(receivedEventData).toBeDefined();
      });
    });
  });
});
