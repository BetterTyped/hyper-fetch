import { Socket } from "socket";
import { wsUrl } from "../../websocket/websocket.server";

describe("Socket [ Base ]", () => {
  it("should initialize Socket", async () => {
    const socket = new Socket({ url: wsUrl });
    expect(socket).toBeDefined();
  });
  it("should initialize with autoConnect", async () => {
    const socket = new Socket({ url: wsUrl, autoConnect: true });
    expect(socket.autoConnect).toBeTrue();
  });
});
