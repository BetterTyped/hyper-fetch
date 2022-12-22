import { act } from "@testing-library/react";

import { sleep } from "../../utils";
import { createEmitter } from "../../utils/emitter.utils";
import { renderUseEmitter } from "../../utils/use-emitter.utils";
import { createWsServer } from "../../websocket/websocket.server";

describe("useEmitter [ Base ]", () => {
  let server = createWsServer();
  let emitter = createEmitter();

  beforeEach(async () => {
    server = createWsServer();
    emitter = createEmitter();
    jest.resetModules();
  });

  describe("when hook emit event", () => {
    it("should set state with data", async () => {
      let id = "";
      const message = { name: "Maciej", age: 99 };
      const view = renderUseEmitter(emitter);
      await act(async () => {
        await sleep(1);
        id = view.result.current.emit({ data: message });
      });

      await expect(server).toReceiveMessage(
        JSON.stringify({
          id,
          type: emitter.name,
          data: message,
        }),
      );
    });
  });
});
