import { SocketAdapter } from "adapter";
import { createSocket } from "../../utils/socket.utils";

describe("Socket Adapter [ Base ]", () => {
  let socket = createSocket({ adapterOptions: { autoConnect: false } });

  beforeEach(() => {
    socket = createSocket({ adapterOptions: { autoConnect: false } });
    jest.resetAllMocks();
  });

  it("should initialize with default values", () => {
    expect(socket.adapter.connected).toBe(false);
    expect(socket.adapter.connecting).toBe(false);
    expect(socket.adapter.reconnectionAttempts).toBe(0);
    expect(socket.adapter.forceClosed).toBe(false);
  });

  it("should update connection states", () => {
    socket.adapter.setConnected(true);
    expect(socket.adapter.connected).toBe(true);

    socket.adapter.setConnecting(true);
    expect(socket.adapter.connecting).toBe(true);

    socket.adapter.setReconnectionAttempts(3);
    expect(socket.adapter.reconnectionAttempts).toBe(3);

    socket.adapter.setForceClosed(true);
    expect(socket.adapter.forceClosed).toBe(true);
  });

  it("should initialize with provided default values", () => {
    const socketWithDefaults = new SocketAdapter({
      name: "test",
      defaultConnected: true,
      defaultConnecting: true,
      defaultReconnectionAttempts: 5,
      defaultForceClosed: true,
    });

    expect(socketWithDefaults.connected).toBe(true);
    expect(socketWithDefaults.connecting).toBe(true);
    expect(socketWithDefaults.reconnectionAttempts).toBe(5);
    expect(socketWithDefaults.forceClosed).toBe(true);
  });

  it("should set and get default options correctly", () => {
    const adapter = new SocketAdapter<any, any, any, any, any, any>({ name: "test" });

    const extra = { customField: "value" };
    adapter.setDefaultExtra(extra);
    expect(adapter.defaultExtra).toEqual(extra);

    const adapterOptions = { timeout: 5000 };
    adapter.setOptions(adapterOptions);
    expect(adapter.adapterOptions).toEqual(adapterOptions);

    const listenerOptions = { once: true };
    adapter.setDefaultListenerOptions(listenerOptions);
    expect(adapter.listenerOptions).toEqual(listenerOptions);

    const emitterOptions = { async: true };
    adapter.setDefaultEmitterOptions(emitterOptions);
    expect(adapter.emitterOptions).toEqual(emitterOptions);
  });

  it("should set query params mapper config", () => {
    const adapter = new SocketAdapter<any, any, any, any, any, any>({ name: "test" });

    const queryParamsConfig = {
      transform: true,
      includeTimestamp: true,
    };

    adapter.setQueryParamsMapperConfig(queryParamsConfig);
    // Using any here since unstable_queryParamsMapperConfig is an internal property
    expect((adapter as any).unstable_queryParamsMapperConfig).toEqual(queryParamsConfig);
  });
});
