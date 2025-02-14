import { createEmitter } from "../../utils/emitter.utils";
import { createListener } from "../../utils/listener.utils";
import { createSocket } from "../../utils/socket.utils";

describe("Socket [ Events ]", () => {
  const spy = jest.fn();
  let socket = createSocket();
  let emitter = createEmitter(socket);
  let listener = createListener(socket);

  beforeEach(() => {
    socket = createSocket();
    emitter = createEmitter(socket);
    listener = createListener(socket);
    jest.resetAllMocks();
  });

  it("should emit and receive error event", async () => {
    const value = { test: 1 };
    socket.events.onError(spy);
    socket.events.emitError(value);

    expect(spy).toHaveBeenCalledTimes(1);
    expect(spy).toHaveBeenCalledWith(value);
  });

  it("should emit and receive open event", async () => {
    socket.events.onConnected(spy);
    socket.events.emitConnected();

    expect(spy).toHaveBeenCalledTimes(1);
  });

  it("should emit and receive close event", async () => {
    socket.events.onDisconnected(spy);
    socket.events.emitDisconnected();

    expect(spy).toHaveBeenCalledTimes(1);
  });

  it("should emit and receive connecting event", async () => {
    socket.events.onConnecting(spy);
    socket.events.emitConnecting();

    expect(spy).toHaveBeenCalledTimes(1);
  });

  it("should emit and receive reconnecting event", async () => {
    const value = 1;
    socket.events.onReconnecting(spy);
    socket.events.emitReconnecting(value);

    expect(spy).toHaveBeenCalledTimes(1);
    expect(spy).toHaveBeenCalledWith(value);
  });

  it("should emit and receive reconnecting stop event", async () => {
    const value = 1;
    socket.events.onReconnectingFailed(spy);
    socket.events.emitReconnectingFailed(value);

    expect(spy).toHaveBeenCalledTimes(1);
    expect(spy).toHaveBeenCalledWith(value);
  });

  it("should emit and receive listener event", async () => {
    const value = 1;
    const extra = {} as MessageEvent;
    socket.events.onListenerEvent(spy);
    socket.events.onListenerEventByTopic(listener, spy);
    socket.events.emitListenerEvent(listener.topic, { data: value, extra });

    expect(spy).toHaveBeenCalledTimes(2);
    expect(spy).toHaveBeenCalledWith({ topic: listener.topic, data: value, extra });
  });

  it("should emit and receive listener remove event", async () => {
    socket.events.onListenerRemove(spy);
    socket.events.onListenerRemoveByTopic(listener, spy);
    socket.events.emitListenerRemoveEvent(listener.topic);

    expect(spy).toHaveBeenCalledTimes(2);
    expect(spy).toHaveBeenCalledWith(listener.topic);
  });

  it("should emit and receive emitter start event", async () => {
    socket.events.onEmitterStartEvent(spy);
    socket.events.onEmitterStartEventByTopic(emitter, spy);
    socket.events.emitEmitterStartEvent(emitter);

    expect(spy).toHaveBeenCalledTimes(2);
    expect(spy).toHaveBeenCalledWith(emitter);
  });
});
