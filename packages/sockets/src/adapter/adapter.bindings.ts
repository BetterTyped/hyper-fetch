import { SocketInstance } from "socket";
import { ListenerCallbackType, ListenerInstance } from "listener";
import { EmitterInstance } from "emitter";
import { SocketAdapterInstance } from "adapter";
import { EventReturnType, ExtractAdapterExtraType } from "types";

export const getSocketAdapterBindings = <T extends SocketAdapterInstance>(
  socket: SocketInstance,
  options?: {
    open?: boolean;
    connecting?: boolean;
    forceClosed?: boolean;
    reconnectionAttempts?: number;
  },
) => {
  const logger = socket.loggerManager.init("Socket Adapter");
  const listeners: Map<string, Map<ListenerCallbackType<T, any>, VoidFunction>> = new Map();

  let open = options?.open ?? false;
  let connecting = options?.connecting ?? false;
  let forceClosed = options?.forceClosed ?? false;
  let reconnectionAttempts = options?.reconnectionAttempts ?? 0;

  // Methods

  const onConnect = (): boolean => {
    if (!socket.appManager.isOnline || connecting) {
      logger.warning("Cannot initialize adapter.", {
        connecting,
        online: socket.appManager.isOnline,
      });
      return false;
    }

    forceClosed = false;
    connecting = true;
    reconnectionAttempts = 0;
    socket.events.emitConnecting();
    return true;
  };

  const onDisconnect = (): boolean => {
    logger.debug("Disconnecting", { reconnectionAttempts });
    open = false;
    connecting = false;
    forceClosed = true;
    reconnectionAttempts = 0;
    return true;
  };

  const onReconnect = (disconnect: () => void, connect: () => void): boolean => {
    disconnect();
    if (reconnectionAttempts < socket.reconnectAttempts) {
      reconnectionAttempts += 1;
      logger.debug("Reconnecting", { reconnectionAttempts });
      connect();
      socket.__onReconnectCallbacks.forEach((callback) => {
        callback(socket);
      });
      socket.events.emitReconnecting(reconnectionAttempts);
      return true;
    }
    logger.debug("Stopped reconnecting", { reconnectionAttempts });
    socket.__onReconnectStopCallbacks.forEach((callback) => {
      callback(socket);
    });
    socket.events.emitReconnectingStop(reconnectionAttempts);
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
    const listenerGroup = listeners.get(listener.topic) || listeners.set(listener.topic, new Map()).get(listener.topic);

    listenerGroup.set(callback, unmount);
    return () => removeListener(listener.topic, callback);
  };

  // Emitters

  const onEmit = async (emitter: EmitterInstance): Promise<EmitterInstance | null> => {
    if (connecting || !open) {
      logger.error("Cannot emit event when connection is not open");
      return null;
    }

    const emitterInstance = await socket.__modifySend(emitter);
    socket.events.emitEmitterStartEvent(emitterInstance);

    return emitterInstance;
  };

  const onEmitResponse = (emitter: EmitterInstance, response: EventReturnType<any, ExtractAdapterExtraType<T>>) => {
    socket.events.emitEmitterEvent(emitter, response);
  };

  const onEmitError = <ErrorType extends Error>(emitter: EmitterInstance, error?: ErrorType) => {
    socket.events.emitEmitterError(error, emitter);
  };

  // Lifecycle

  const onOpen = () => {
    logger.info("Connection open");
    socket.__onOpenCallbacks.forEach((callback) => {
      callback(socket);
    });
    open = true;
    connecting = false;
    socket.events.emitOpen();
  };

  const onClose = () => {
    logger.info("Connection closed");
    socket.__onCloseCallbacks.forEach((callback) => {
      callback(socket);
    });
    open = false;
    connecting = false;
    socket.events.emitClose();
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
    open,
    connecting,
    reconnectionAttempts,
    forceClosed,
    onConnect,
    onReconnect,
    onDisconnect,
    onListen,
    onEmit,
    onEmitResponse,
    onEmitError,
    onOpen,
    onClose,
    onError,
    onEvent,
    listeners,
    removeListener,
  };
};
