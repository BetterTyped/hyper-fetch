import { createSocket } from "../../utils/socket.utils";
import { getAdapterBindings } from "adapter";

describe("Socket Adapter [ Bindings ]", () => {
  let socket = createSocket({ adapterOptions: { autoConnect: false } });

  beforeEach(() => {
    socket = createSocket({ adapterOptions: { autoConnect: false } });
    jest.resetAllMocks();
  });

  // it("should allow to pass defaults", async () => {
  //   const {
  //     socket: {
  //       adapter: { connected, connecting, reconnectionAttempts, forceClosed },
  //     },
  //   } = getAdapterBindings(socket);

  //   expect(connected).toBeTrue();
  //   expect(connecting).toBeTrue();
  //   expect(reconnectionAttempts).toBe(10);
  //   expect(forceClosed).toBeTrue();
  // });

  it("should allow remove listener without unmount callback", async () => {
    const {
      adapter: { listeners, removeListener },
    } = getAdapterBindings(socket);

    const callback = () => null;
    listeners.set("test", new Map().set(callback, null));

    expect(() => removeListener({ topic: "test", callback })).not.toThrow();
  });
});
