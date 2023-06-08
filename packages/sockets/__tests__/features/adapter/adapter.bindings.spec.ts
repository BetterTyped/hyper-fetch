import { createSocket } from "../../utils/socket.utils";
import { getSocketAdapterBindings } from "adapter";

describe("Socket Adapter [ Bindings ]", () => {
  let socket = createSocket({ autoConnect: false });

  beforeEach(() => {
    socket = createSocket({ autoConnect: false });
    jest.resetAllMocks();
  });

  it("should allow to pass defaults", async () => {
    const { open, connecting, reconnectionAttempts, forceClosed } = getSocketAdapterBindings(socket, {
      open: true,
      connecting: true,
      reconnectionAttempts: 10,
      forceClosed: true,
    });

    expect(open).toBeTrue();
    expect(connecting).toBeTrue();
    expect(reconnectionAttempts).toBe(10);
    expect(forceClosed).toBeTrue();
  });

  it("should allow remove listener without unmount callback", async () => {
    const { listeners, removeListener } = getSocketAdapterBindings(socket);

    const callback = () => null;
    listeners.set("test", new Map().set(callback, null));

    expect(() => removeListener("test", callback)).not.toThrow();
  });
});
