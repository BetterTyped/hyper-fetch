import { EmitterInstance } from "emitter";
import { interceptEmitter, interceptListener, Socket } from "socket";
import { wsUrl } from "../../websocket/websocket.server";

describe("Socket [ Utils ]", () => {
  beforeEach(() => {
    jest.resetAllMocks();
  });

  it("should throw on invalid listener interceptor", async () => {
    const socket = new Socket({ url: wsUrl });

    socket.onMessage(() => null);
    expect(() => interceptListener(socket.__onMessageCallbacks, {} as MessageEvent, socket)).toThrow();
  });

  it("should throw on invalid listener interceptor", async () => {
    const socket = new Socket({ url: wsUrl });

    socket.onSend(() => null);
    expect(() => interceptEmitter(socket.__onSendCallbacks, {} as EmitterInstance)).toThrow();
  });
});
