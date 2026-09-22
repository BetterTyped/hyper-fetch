import { getAdapterBindings } from "adapter";

import { createSocket } from "../../utils/socket.utils";

describe("Socket Adapter [ Bindings ]", () => {
  let socket = createSocket({ adapterOptions: { autoConnect: false } });

  beforeEach(() => {
    socket = createSocket({ adapterOptions: { autoConnect: false } });
    vi.resetAllMocks();
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

    const spy = vi.fn();
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

  it("should get query params from adapter", () => {
    const { getQueryParams } = getAdapterBindings(socket);

    socket.adapter.queryParams = {
      test: 123,
    };

    expect(getQueryParams()).toBe("?test=123");
  });

  it("should map explicitly provided query params", () => {
    const { getQueryParams } = getAdapterBindings(socket);

    socket.adapter.queryParams = { test: 123 };

    expect(getQueryParams({ other: "value" })).toBe("?other=value");
    expect(getQueryParams({})).toBe("");
  });

  it("should not open a connection attempt when offline, already connecting or already connected", async () => {
    const { onConnect } = getAdapterBindings(socket);

    socket.appManager.setOnline(false);
    await expect(onConnect()).resolves.toBeNull();

    socket.appManager.setOnline(true);
    socket.adapter.setConnecting(true);
    await expect(onConnect()).resolves.toBeNull();

    socket.adapter.setConnecting(false);
    socket.adapter.setConnected(true);
    await expect(onConnect()).resolves.toBeNull();
  });

  it("should prepare the connection from socket defaults and mark the adapter as connecting", async () => {
    socket = createSocket({ adapterOptions: { autoConnect: false, protocols: "v1" }, queryParams: { a: 1 } });
    const connectingSpy = vi.fn();
    socket.events.onConnecting(connectingSpy);
    const { onConnect } = getAdapterBindings(socket);

    await expect(onConnect()).resolves.toEqual({
      url: "ws://localhost:1234",
      queryParams: { a: 1 },
      adapterOptions: { autoConnect: false, protocols: "v1" },
    });
    expect(socket.adapter.connecting).toBe(true);
    expect(socket.adapter.forceClosed).toBe(false);
    expect(connectingSpy).toHaveBeenCalledWith({ connecting: true });
  });

  it("should pass the connection through onConnect interceptors in order", async () => {
    socket.onConnect(({ connection }) => ({ ...connection, url: `${connection.url}/first` }));
    socket.onConnect(async ({ connection, attempt }) => ({
      ...connection,
      url: `${connection.url}/second`,
      queryParams: { attempt },
    }));
    const { onConnect } = getAdapterBindings(socket);

    await expect(onConnect()).resolves.toEqual({
      url: "ws://localhost:1234/first/second",
      queryParams: { attempt: 0 },
      adapterOptions: { autoConnect: false },
    });
  });

  it("should pass the reconnection attempt number to onConnect interceptors", async () => {
    const attemptSpy = vi.fn();
    socket.onConnect(({ connection, attempt }) => {
      attemptSpy(attempt);
      return connection;
    });
    const { onConnect } = getAdapterBindings(socket);

    socket.adapter.setReconnectionAttempts(3);
    await onConnect();

    expect(attemptSpy).toHaveBeenCalledWith(3);
  });

  it("should fail the attempt when an onConnect interceptor throws", async () => {
    const errorSpy = vi.fn();
    const connectingSpy = vi.fn();
    socket.events.onError(errorSpy);
    socket.events.onConnecting(connectingSpy);
    socket.onConnect(() => {
      throw new Error("boom");
    });
    const { onConnect } = getAdapterBindings(socket);

    await expect(onConnect()).resolves.toBeNull();

    expect(socket.adapter.connecting).toBe(false);
    expect(connectingSpy).toHaveBeenLastCalledWith({ connecting: false });
    expect(errorSpy).toHaveBeenCalledWith({ error: new Error("boom") });
  });

  it("should wrap non-error values thrown by onConnect interceptors", async () => {
    const errorSpy = vi.fn();
    socket.events.onError(errorSpy);
    socket.onConnect(() => {
      // eslint-disable-next-line @typescript-eslint/only-throw-error
      throw "boom";
    });
    const { onConnect } = getAdapterBindings(socket);

    await expect(onConnect()).resolves.toBeNull();

    expect(errorSpy.mock.calls[0][0].error).toBeInstanceOf(Error);
    expect(errorSpy.mock.calls[0][0].error.message).toBe("boom");
  });

  it("should cancel the attempt when the adapter stops connecting while preparing", async () => {
    let resolveConnection: () => void = () => null;
    const interceptorStarted = new Promise<void>((started) => {
      socket.onConnect(
        ({ connection }) =>
          new Promise((resolve) => {
            resolveConnection = () => resolve(connection);
            started();
          }),
      );
    });
    const { onConnect } = getAdapterBindings(socket);

    const promise = onConnect();
    await interceptorStarted;
    socket.adapter.setConnecting(false);
    resolveConnection();

    await expect(promise).resolves.toBeNull();
  });

  it("should reset connecting state and emit error on onConnectFailed", async () => {
    const errorSpy = vi.fn();
    const connectingSpy = vi.fn();
    socket.events.onError(errorSpy);
    socket.events.onConnecting(connectingSpy);
    socket.adapter.setConnecting(true);
    const { onConnectFailed } = getAdapterBindings(socket);

    const error = new Error("transport");
    onConnectFailed({ error });

    expect(socket.adapter.connecting).toBe(false);
    expect(connectingSpy).toHaveBeenCalledWith({ connecting: false });
    expect(errorSpy).toHaveBeenCalledWith({ error });
  });
});
