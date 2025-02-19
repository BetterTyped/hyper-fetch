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
    socket.events.emitError({ error: value });

    expect(spy).toHaveBeenCalledTimes(1);
    expect(spy).toHaveBeenCalledWith({ error: value });
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
    socket.events.emitConnecting({ connecting: true });

    expect(spy).toHaveBeenCalledTimes(1);
  });

  it("should emit and receive reconnecting event", async () => {
    const value = 1;
    socket.events.onReconnecting(spy);
    socket.events.emitReconnecting({ attempts: value });

    expect(spy).toHaveBeenCalledTimes(1);
    expect(spy).toHaveBeenCalledWith({ attempts: value });
  });

  it("should emit and receive reconnecting stop event", async () => {
    const value = 1;
    socket.events.onReconnectingFailed(spy);
    socket.events.emitReconnectingFailed({ attempts: value });

    expect(spy).toHaveBeenCalledTimes(1);
    expect(spy).toHaveBeenCalledWith({ attempts: value });
  });

  it("should emit and receive listener event", async () => {
    const value = 1;
    const extra = {} as MessageEvent;
    socket.events.onListenerEvent(spy);
    socket.events.onListenerEventByTopic(listener, spy);
    socket.events.emitListenerEvent({ topic: listener.topic, data: value, extra });

    expect(spy).toHaveBeenCalledTimes(2);
    expect(spy).toHaveBeenCalledWith({ topic: listener.topic, data: value, extra });
  });

  it("should emit and receive listener remove event", async () => {
    socket.events.onListenerRemove(spy);
    socket.events.onListenerRemoveByTopic(listener, spy);
    socket.events.emitListenerRemoveEvent({ topic: listener.topic });

    expect(spy).toHaveBeenCalledTimes(2);
    expect(spy).toHaveBeenCalledWith({ topic: listener.topic });
  });

  it("should emit and receive emitter start event", async () => {
    socket.events.onEmitterStartEvent(spy);
    socket.events.onEmitterStartEventByTopic(emitter, spy);
    socket.events.emitEmitterStartEvent({ emitter });

    expect(spy).toHaveBeenCalledTimes(2);
    expect(spy).toHaveBeenCalledWith({ emitter });
  });

  describe("Cleanup functions", () => {
    it("should remove error event listener when cleanup is called", () => {
      const cleanup = socket.events.onError(spy);
      cleanup();
      socket.events.emitError({ error: { test: 1 } });
      expect(spy).not.toHaveBeenCalled();
    });

    it("should remove connected event listener when cleanup is called", () => {
      const cleanup = socket.events.onConnected(spy);
      cleanup();
      socket.events.emitConnected();
      expect(spy).not.toHaveBeenCalled();
    });

    it("should remove disconnected event listener when cleanup is called", () => {
      const cleanup = socket.events.onDisconnected(spy);
      cleanup();
      socket.events.emitDisconnected();
      expect(spy).not.toHaveBeenCalled();
    });

    it("should remove connecting event listener when cleanup is called", () => {
      const cleanup = socket.events.onConnecting(spy);
      cleanup();
      socket.events.emitConnecting({ connecting: true });
      expect(spy).not.toHaveBeenCalled();
    });

    it("should remove reconnecting event listener when cleanup is called", () => {
      const cleanup = socket.events.onReconnecting(spy);
      cleanup();
      socket.events.emitReconnecting({ attempts: 1 });
      expect(spy).not.toHaveBeenCalled();
    });

    it("should remove reconnecting failed event listener when cleanup is called", () => {
      const cleanup = socket.events.onReconnectingFailed(spy);
      cleanup();
      socket.events.emitReconnectingFailed({ attempts: 1 });
      expect(spy).not.toHaveBeenCalled();
    });

    it("should remove listener event handlers when cleanup is called", () => {
      const cleanup1 = socket.events.onListenerEvent(spy);
      const cleanup2 = socket.events.onListenerEventByTopic(listener, spy);

      cleanup1();
      cleanup2();

      socket.events.emitListenerEvent({ topic: listener.topic, data: 1, extra: {} as MessageEvent });
      expect(spy).not.toHaveBeenCalled();
    });

    it("should remove listener remove event handlers when cleanup is called", () => {
      const cleanup1 = socket.events.onListenerRemove(spy);
      const cleanup2 = socket.events.onListenerRemoveByTopic(listener, spy);

      cleanup1();
      cleanup2();

      socket.events.emitListenerRemoveEvent({ topic: listener.topic });
      expect(spy).not.toHaveBeenCalled();
    });

    it("should remove emitter start event handlers when cleanup is called", () => {
      const cleanup1 = socket.events.onEmitterStartEvent(spy);
      const cleanup2 = socket.events.onEmitterStartEventByTopic(emitter, spy);

      cleanup1();
      cleanup2();

      socket.events.emitEmitterStartEvent({ emitter });
      expect(spy).not.toHaveBeenCalled();
    });

    it("should remove emitter error event handlers when cleanup is called", () => {
      const error = new Error("test error");
      const cleanup1 = socket.events.onEmitterError(spy);
      const cleanup2 = socket.events.onEmitterErrorByTopic(emitter, spy);

      cleanup1();
      cleanup2();

      socket.events.emitEmitterError({ error, emitter });
      expect(spy).not.toHaveBeenCalled();
    });
  });
});
