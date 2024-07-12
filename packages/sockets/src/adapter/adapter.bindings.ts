import { SocketInstance } from "socket";
import { ListenerCallbackType, ListenerInstance } from "listener";
import { EmitterInstance } from "emitter";
import { SocketAdapterInstance } from "adapter";
import { ExtractAdapterExtraType } from "types";

export const getSocketAdapterBindings = <T extends SocketAdapterInstance>(
  socket: SocketInstance,
  options?: {
    connected?: boolean;
    connecting?: boolean;
    forceClosed?: boolean;
    reconnectionAttempts?: number;
  },
) => {
  const logger = socket.loggerManager.init("Socket Adapter");
  const listeners: Map<string, Map<ListenerCallbackType<T, any>, VoidFunction>> = new Map();

  const state = {
    connected: options?.connected ?? false,
    connecting: options?.connecting ?? false,
    forceClosed: options?.forceClosed ?? false,
    reconnectionAttempts: options?.reconnectionAttempts ?? 0,
  };

  // Methods

  const onConnect = (): boolean => {
    if (!socket.appManager.isOnline || state.connecting) {
      logger.warning("Cannot initialize adapter.", {
        connecting: state.connecting,
        online: socket.appManager.isOnline,
      });
      return false;
    }

    state.forceClosed = false;
    state.connecting = true;
    state.reconnectionAttempts = 0;
    socket.events.emitConnecting();
    return true;
  };

  const onDisconnect = (): boolean => {
    logger.debug("Disconnecting", { reconnectionAttempts: state.reconnectionAttempts });
    state.connected = false;
    state.connecting = false;
    state.forceClosed = true;
    state.reconnectionAttempts = 0;
    return true;
  };

  const onReconnect = (disconnect: () => void, connect: () => void): boolean => {
    disconnect();
    if (state.reconnectionAttempts < socket.reconnectAttempts) {
      state.reconnectionAttempts += 1;
      logger.debug("Reconnecting", { reconnectionAttempts: state.reconnectionAttempts });
      connect();
      socket.__onReconnectCallbacks.forEach((callback) => {
        callback(socket);
      });
      socket.events.emitReconnecting(state.reconnectionAttempts);
      return true;
    }
    logger.debug("Stopped reconnecting", { reconnectionAttempts: state.reconnectionAttempts });
    socket.__onReconnectStopCallbacks.forEach((callback) => {
      callback(socket);
    });
    socket.events.emitReconnectingStop(state.reconnectionAttempts);
    return false;
  };

  // Listeners

  const removeListener = (topic: string, callback: ListenerCallbackType<T, any>): boolean => {
    const listenerGroup = listeners.get(topic);
    if (listenerGroup) {
      const unmount = listenerGroup.get(callback);
      logger.debug("Removed event listener", { topic });
      socket.events.emitListenerRemoveEvent(topic);
      listenerGroup.delete(callback);
      unmount?.();
      return true;
    }
    return false;
  };

  const onListen = (
    listener: Pick<ListenerInstance, "topic">,
    callback: ListenerCallbackType<T, any>,
    unmount: VoidFunction = () => null,
  ): (() => void) => {
    const listenerGroup = (listeners.get(listener.topic) ||
      listeners.set(listener.topic, new Map()).get(listener.topic)) as Map<ListenerCallbackType<T, any>, VoidFunction>;

    listenerGroup.set(callback, unmount);
    return () => removeListener(listener.topic, callback);
  };

  // Emitters

  const onEmit = async (emitter: EmitterInstance): Promise<EmitterInstance | null> => {
    if (state.connecting || !state.connected) {
      logger.error("Cannot emit event when connection is not open");
      return null;
    }

    const emitterInstance = await socket.__modifySend(emitter);
    socket.events.emitEmitterStartEvent(emitterInstance);

    return emitterInstance;
  };

  const onEmitError = <ErrorType extends Error>(emitter: EmitterInstance, error: ErrorType) => {
    socket.events.emitEmitterError(error, emitter);
  };

  // Lifecycle

  const onConnected = () => {
    logger.info("Connection open");
    socket.__onConnectedCallbacks.forEach((callback) => {
      callback(socket);
    });
    state.connected = true;
    state.connecting = false;
    socket.events.emitConnected();
  };

  const onDisconnected = () => {
    logger.info("Connection closed");
    socket.__onDisconnectCallbacks.forEach((callback) => {
      callback(socket);
    });
    state.connected = false;
    state.connecting = false;
    socket.events.emitDisconnected();
  };

  const onError = (event: Error) => {
    logger.info("Error message", { event });
    socket.__onErrorCallbacks.forEach((callback) => {
      callback(event, socket);
    });
    socket.events.emitError(event);
  };

  const onEvent = (topic: string, response: any, responseExtra: ExtractAdapterExtraType<T>) => {
    logger.info("New event message", { response, responseExtra });

    const { data, extra } = socket.__modifyResponse({ data: response, extra: responseExtra });

    socket.events.emitListenerEvent(topic, { data, extra });
  };

  return {
    state,
    listeners,
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
    removeListener,
  };
};
