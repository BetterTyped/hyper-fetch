import { createSocket } from "../../utils/socket.utils";

const socketOptions: Parameters<typeof createSocket>[0] = {
  isSSE: true,
};

describe("Socket [ SSE ]", () => {
  let socket = createSocket(socketOptions);

  beforeEach(() => {
    socket = createSocket(socketOptions);
    jest.resetAllMocks();
  });

  it("should throw emitter create", async () => {
    expect(() => socket.createEmitter({ name: "test" })).toThrow();
  });
});
