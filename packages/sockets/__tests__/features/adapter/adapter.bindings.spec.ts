import { createSocket } from "../../utils/socket.utils";
import { getAdapterBindings } from "adapter";

describe("Socket Adapter [ Bindings ]", () => {
  let socket = createSocket({ adapterOptions: { autoConnect: false } });

  beforeEach(() => {
    socket = createSocket({ adapterOptions: { autoConnect: false } });
    jest.resetAllMocks();
  });

  it("should allow remove listener without unmount callback", async () => {
    const {
      adapter: { listeners, removeListener },
    } = getAdapterBindings(socket);

    const callback = () => null;
    listeners.set("test", new Map().set(callback, null));

    expect(() => removeListener({ topic: "test", callback })).not.toThrow();
  });

  it("should emit error event when emitter encounters an error", () => {
    const { onEmitError } = getAdapterBindings(socket);

    const mockError = new Error("Test error");
    const mockEmitter = socket.createEmitter()({ topic: "test" });

    const spy = jest.fn();
    socket.events.onEmitterError(spy);

    onEmitError({
      emitter: mockEmitter,
      error: mockError,
    });

    expect(spy).toHaveBeenCalledWith({
      error: mockError,
      emitter: mockEmitter,
    });
  });

  it("should not emit error event when adapter is connecting", async () => {
    // Simulate connecting state
    socket.adapter.setConnected(false);
    socket.adapter.setConnecting(true);

    const { onEmit } = getAdapterBindings(socket);

    const emitter = socket.createEmitter()({ topic: "test" });

    const result = await onEmit({ emitter });

    expect(result).toBeNull();
  });

  it("should call adapter's removeListener with correct parameters", () => {
    const { onListen } = getAdapterBindings(socket);

    const removeListener = onListen({
      listener: socket.createListener()({ topic: "test" }),
      callback: () => null,
    });

    expect(socket.adapter.listeners.get("test")?.size).toBe(1);

    removeListener();

    expect(socket.adapter.listeners.get("test")?.size).toBe(0);
  });
});
