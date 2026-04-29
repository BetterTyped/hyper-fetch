import type { Socket } from "socket";
import type { ListenerCallbackType, ListenerOfAdapter } from "listener";
import type { EmitterInstance } from "emitter";
import type { SocketAdapterInstance } from "adapter";
import type { ExtractAdapterExtraType } from "types";

export const getAdapterBindings = <T extends SocketAdapterInstance>(socket: Socket<T>) => {
  const { adapter } = socket;
  const logger = socket.loggerManager.initialize(socket, "Socket Bindings");

  // Methods

  const onConnect = (): boolean => {
    if (!socket.appManager.isOnline || adapter.connecting) {
      logger.warning({
        title: "Cannot initialize adapter.",
        type: "system",
        extra: {
          connecting: adapter.connecting,
          online: socket.appManager.isOnline,
        },
      });
      return false;
    }

    socket.adapter.setForceClosed(false);
    socket.adapter.setConnecting(true);
    socket.adapter.setReconnectionAttempts(0);
    socket.events.emitConnecting({ connecting: true });
    return true;
  };

  const onDisconnect = (): boolean => {
    logger.debug({
      title: "Disconnecting",
      type: "system",
      extra: { reconnectionAttempts: adapter.reconnectionAttempts },
    });
    socket.adapter.setConnected(false);
    socket.adapter.setConnecting(false);
    socket.adapter.setForceClosed(true);
    socket.adapter.setReconnectionAttempts(0);
    return true;
  };

  const onReconnect = async ({
    disconnect,
    connect,
  }: {
    disconnect: () => Promise<any>;
    connect: () => Promise<any>;
  }): Promise<boolean> => {
    // Capture attempts before disconnect/connect reset them
    const currentAttempts = adapter.reconnectionAttempts;

    socket.unstable_onReconnectCallbacks.forEach((callback) => {
      callback();
    });
    socket.events.emitReconnecting({ attempts: currentAttempts });

    await disconnect();
    if (currentAttempts < socket.reconnectAttempts) {
      const nextAttempts = currentAttempts + 1;
      socket.adapter.setReconnectionAttempts(nextAttempts);
      logger.debug({
        title: "Reconnecting",
        type: "system",
        extra: { reconnectionAttempts: nextAttempts },
      });
      await connect();
      // Restore only if the connection didn't succeed — onConnected resets to 0 on success
      if (!adapter.connected) {
        socket.adapter.setReconnectionAttempts(nextAttempts);
      }
      return true;
    }

    logger.error({
      title: "Stopped reconnecting",
      type: "system",
      extra: { reconnectionAttempts: currentAttempts },
    });
    socket.unstable_onReconnectFailedCallbacks.forEach((callback) => {
      callback();
    });
    socket.events.emitReconnectingFailed({ attempts: currentAttempts });
    return false;
  };

  // Listeners

  const onListen = ({
    listener,
    callback,
    onUnmount = () => null,
  }: {
    listener: Pick<ListenerOfAdapter<T>, "topic">;
    callback: ListenerCallbackType<T, any>;
    onUnmount?: VoidFunction;
  }): (() => void) => {
    const listenerGroup = (adapter.listeners.get(listener.topic) ||
      adapter.listeners.set(listener.topic, new Map()).get(listener.topic)) as Map<
      ListenerCallbackType<T, any>,
      VoidFunction
    >;

    listenerGroup.set(callback, onUnmount);
    return () => socket.adapter.removeListener({ topic: listener.topic, callback });
  };

  // Emitters

  const onEmit = async ({ emitter }: { emitter: EmitterInstance }): Promise<EmitterInstance | null> => {
    if (adapter.connecting || !adapter.connected) {
      logger.error({ title: "Cannot emit event when connection is not open", type: "system", extra: {} });
      return null;
    }

    // eslint-disable-next-line no-param-reassign
    emitter.payload = emitter.unstable_payloadMapper
      ? emitter.unstable_payloadMapper(emitter.payload)
      : emitter.payload;

    const emitterInstance = await socket.unstable__modifySend(emitter);
    socket.events.emitEmitterStartEvent({ emitter: emitterInstance });

    return emitterInstance;
  };

  const onEmitError = <ErrorType extends Error>({ emitter, error }: { emitter: EmitterInstance; error: ErrorType }) => {
    socket.events.emitEmitterError({ error, emitter });
  };

  // Lifecycle

  const onConnected = () => {
    logger.info({ title: "Connection open", type: "system", extra: {} });
    adapter.setConnected(true);
    adapter.setConnecting(false);
    adapter.setReconnectionAttempts(0);
    socket.events.emitConnecting({ connecting: false });
    socket.events.emitConnected();
    socket.unstable_onConnectedCallbacks.forEach((callback) => {
      callback();
    });
  };

  const onDisconnected = () => {
    logger.info({ title: "Connection closed", type: "system", extra: {} });
    adapter.setConnected(false);
    adapter.setConnecting(false);
    socket.events.emitConnecting({ connecting: false });
    socket.events.emitDisconnected();
    socket.unstable_onDisconnectCallbacks.forEach((callback) => {
      callback();
    });
  };

  const onError = ({ error }: { error: Error }) => {
    logger.info({ title: "Error message", type: "system", extra: { error } });
    socket.unstable_onErrorCallbacks.forEach((callback) => {
      callback({ error });
    });
    socket.events.emitError({ error });
  };

  const onEvent = ({ topic, data, extra }: { topic: string; data: any; extra: ExtractAdapterExtraType<T> }) => {
    logger.info({ title: "New event message", type: "system", extra: { topic, data, extra } });

    const { data: modifiedData, extra: modifiedExtra } = socket.unstable__modifyResponse({ data, extra });
    socket.adapter.triggerListeners({ topic, data: modifiedData, extra: modifiedExtra });
    socket.events.emitListenerEvent({ topic, data: modifiedData, extra: modifiedExtra });
  };

  const getQueryParams = () =>
    socket.adapter.unstable_queryParamsMapper(socket.adapter.queryParams, socket.adapter.queryParamsConfig);

  return {
    socket,
    adapter: socket.adapter,
    logger,
    getQueryParams,
    onConnect,
    onReconnect,
    onDisconnect,
    onListen,
    onEmit,
    onEmitError,
    onConnected,
    onDisconnected,
    onError,
    onEvent,
  };
};
