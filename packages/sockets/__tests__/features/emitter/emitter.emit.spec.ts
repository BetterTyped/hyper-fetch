import { createEmitter } from "../../utils/emitter.utils";
import { createSocket } from "../../utils/socket.utils";
import { wsServer } from "../../websocket/websocket.server";

type DataType = {
  name: string;
  age: number;
};

describe("Emitter [ Emit ]", () => {
  let socket = createSocket();
  let emitter = createEmitter<DataType>(socket);

  beforeEach(() => {
    socket = createSocket();
    emitter = createEmitter<DataType>(socket);
    jest.resetAllMocks();
  });

  it("should emit event message", async () => {
    const message = { name: "Maciej", age: 99 };
    const id = emitter.emit({ data: message });

    await expect(wsServer).toReceiveMessage(
      JSON.stringify({
        id,
        type: emitter.name,
        data: message,
      }),
    );
  });
});
