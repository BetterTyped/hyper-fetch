import { SocketInstance } from "socket";
import { ListenerInstance } from "listener";
import { EmitterInstance } from "emitter";
import { ExtractSocketExtraType, ListenerCallbackType, SocketAdapterInstance } from "adapter";

export const getSocketAdapterBindings = <T extends SocketAdapterInstance>(socket: SocketInstance) => {
  const logger = socket.loggerManager.init("Socket Adapter");
  const listeners: Map<string, Map<ListenerCallbackType<T, any>, VoidFunction>> = new Map();

  let open = false;
  let connecting = false;
  let forceClosed = false;
  let reconnectionAttempts = 0;

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
    if (reconnectionAttempts < socket.reconnect) {
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

  const removeListener = (name: string, callback: ListenerCallbackType<T, any>): boolean => {
    const listenerGroup = listeners.get(name);
    if (listenerGroup) {
      const unmount = listenerGroup.get(callback);
      logger.debug("Removed event listener", { name });
      socket.events.emitListenerRemoveEvent(name);
      listenerGroup.delete(callback);
      unmount?.();
      return true;
    }
    return false;
  };

  const onListen = (
    listener: Pick<ListenerInstance, "name">,
    callback: ListenerCallbackType<T, any>,
    unmount: VoidFunction = () => null,
  ): (() => void) => {
    const listenerGroup = listeners.get(listener.name) || listeners.set(listener.name, new Map()).get(listener.name);

    listenerGroup.set(callback, unmount);
    return () => removeListener(listener.name, callback);
  };

  // Emitters

  const onEmit = (emitter: EmitterInstance): boolean => {
    if (connecting || !open) {
      logger.error("Cannot emit event when connection is not open");
      return false;
    }
    socket.events.emitEmitterEvent(emitter);
    return true;
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

  const onEvent = (name: string, response: any, resposeExtra: ExtractSocketExtraType<T>) => {
    logger.info("New event message", { response, resposeExtra });

    const { data, extra } = socket.__modifyResponse({ data: response, extra: resposeExtra });

    socket.events.emitListenerEvent(name, { data, extra });
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
    onOpen,
    onClose,
    onError,
    onEvent,
    listeners,
    removeListener,
  };
};
