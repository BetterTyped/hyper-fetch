import { waitFor } from "@testing-library/react";

import { createListener } from "../../utils/listener.utils";
import { renderUseListener } from "../../utils/use-listener.utils";
import { sendWsEvent, wsServer } from "../../websocket/websocket.server";

describe("useListener [ Base ]", () => {
  let listener = createListener();

  beforeEach(async () => {
    jest.resetModules();
    listener = createListener();
    await wsServer.connected;
  });

  describe("when hook receive event", () => {
    it("should set state with data", async () => {
      const message = { name: "Maciej", age: 99 };
      const view = renderUseListener(listener);
      sendWsEvent(listener, message);
      await waitFor(() => {
        expect(view.result.current.data).toBeTruthy();
      });
    });
  });
});
