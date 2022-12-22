import { waitFor } from "@testing-library/react";

import { renderUseEventMessages } from "../../utils";
import { createListener } from "../../utils/listener.utils";
import { createWsServer, sendWsEvent } from "../../websocket/websocket.server";
import { socket } from "../../utils/socket.utils";

describe("useEventMessages [ Base ]", () => {
  let listener = createListener();

  beforeEach(async () => {
    createWsServer();
    listener = createListener();
    jest.resetModules();
  });

  describe("when hook receive event", () => {
    it("should set state with data", async () => {
      const message = { name: "Maciej", age: 99 };
      const view = renderUseEventMessages(socket);
      sendWsEvent(listener, message);
      await waitFor(() => {
        expect(view.result.current.data).toBeTruthy();
      });
    });
  });
});
