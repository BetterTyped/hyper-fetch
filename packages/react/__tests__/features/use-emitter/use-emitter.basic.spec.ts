import { act } from "@testing-library/react";

import { createEmitter } from "../../utils/emitter.utils";
import { renderUseEmitter } from "../../utils/use-emitter.utils";
import { wsServer } from "../../websocket/websocket.server";

describe("useEmitter [ Basic ]", () => {
  let emitter = createEmitter();

  beforeEach(async () => {
    jest.resetModules();
    emitter = createEmitter();
    await wsServer.connected;
  });

  describe("when hook emit event", () => {
    it("should set state with data", async () => {
      let id = "";
      const message = { name: "Maciej", age: 99 };
      const view = renderUseEmitter(emitter);
      act(() => {
        id = view.result.current.emit({ data: message });
      });

      await expect(wsServer).toReceiveMessage(
        JSON.stringify({
          id,
          type: emitter.name,
          data: message,
        }),
      );
    });
  });
});
