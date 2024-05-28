import { Emitter } from "@hyper-fetch/sockets";
import { act, waitFor } from "@testing-library/react";

import { sleep } from "../../utils";
import { createEmitter } from "../../utils/emitter.utils";
import { renderUseEmitter } from "../../utils/use-emitter.utils";
import { createWsServer } from "../../websocket/websocket.server";

describe("useEmitter [ Base ]", () => {
  const spy = jest.fn();

  let server = createWsServer();
  let emitter = createEmitter();

  beforeEach(async () => {
    server = createWsServer();
    emitter = createEmitter();
    jest.resetModules();
    jest.resetAllMocks();
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
          endpoint: emitter.endpoint,
          data: message,
        }),
      );

      await waitFor(() => {
        expect(view.result.current.connected).toBeTrue();
        expect(view.result.current.connecting).toBeFalse();
        expect(view.result.current.timestamp).toBeNumber();
      });
    });
    it("should trigger onEvent callback", async () => {
      const message = { name: "Maciej", age: 99 };
      const view = renderUseEmitter(emitter);
      let receivedEmitter;
      await act(async () => {
        await sleep(1);
        view.result.current.onEvent((em) => {
          receivedEmitter = em;
          spy();
        });

        view.result.current.emit({ data: message });
      });
      await waitFor(() => {
        expect(spy).toHaveBeenCalledTimes(1);
        expect(receivedEmitter).toBeInstanceOf(Emitter);
      });
    });
  });
});
