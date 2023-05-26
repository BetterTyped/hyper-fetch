import { waitFor } from "@testing-library/dom";

import { createEmitter } from "../../utils/emitter.utils";
import { createSocket } from "../../utils/socket.utils";
import { createWsServer } from "../../websocket/websocket.server";

type DataType = {
  name: string;
  age: number;
};

describe("Emitter [ Emit ]", () => {
  let server = createWsServer();
  let socket = createSocket();
  let emitter = createEmitter<DataType>(socket, { timeout: 10 });

  beforeEach(async () => {
    server = createWsServer();
    socket = createSocket();
    emitter = createEmitter<DataType>(socket, { timeout: 10 });
    jest.resetAllMocks();
    await server.connected;
  });

  it("should emit event message", async () => {
    const message = { name: "Maciej", age: 99 };
    const id = emitter.emit({ data: message });

    await expect(server).toReceiveMessage(
      JSON.stringify({
        id,
        name: emitter.name,
        data: message,
      }),
    );
  });

  it("should acknowledge event message", async () => {
    const message = { name: "Maciej", age: 99 };
    const spy = jest.fn();
    const id = emitter.emit({ data: message }, spy);
    const response = { id, data: "test" };

    await expect(server).toReceiveMessage(
      JSON.stringify({
        id,
        name: emitter.name,
        data: message,
      }),
    );

    server.send(JSON.stringify({ id, name: emitter.name, data: response }));

    await waitFor(() => {
      expect(spy).toBeCalledTimes(1);
      expect(spy).toBeCalledWith(null, { id, name: emitter.name, data: response, extra: undefined });
    });
  });

  it("should not acknowledge event message", async () => {
    const message = { name: "Maciej", age: 99 };
    const spy = jest.fn();
    const id = emitter.emit({ data: message }, spy);

    await expect(server).toReceiveMessage(
      JSON.stringify({
        id,
        name: emitter.name,
        data: message,
      }),
    );

    await waitFor(() => {
      expect(spy).toBeCalledTimes(1);
      expect(spy).toBeCalledWith(new Error("Server did not acknowledge the event"), null);
    });
  });
});
