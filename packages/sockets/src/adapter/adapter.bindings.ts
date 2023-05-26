import { parseResponse } from "@hyper-fetch/core";

import { SocketInstance } from "socket";
import { ListenerInstance } from "listener";
import { EmitterInstance } from "emitter";
import { ExtractSocketExtraType, ExtractSocketFormatType, ListenerCallbackType, SocketAdapterInstance } from "adapter";

export const adapterBindingsSocket = <T extends SocketAdapterInstance>(socket: SocketInstance) => {
  const logger = socket.loggerManager.init("Socket Adapter");
  const listeners: Map<string, Set<ListenerCallbackType<T, any>>> = new Map();

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
    socket.events.emitConnecting();
    return true;
  };

  const onDisconnect = (): boolean => {
    logger.debug("Disconnecting", { reconnectionAttempts });
    open = false;
    connecting = false;
    forceClosed = true;
    return true;
  };

  const onReconnect = (): boolean => {
    onDisconnect();
    if (reconnectionAttempts < socket.reconnect) {
      reconnectionAttempts += 1;
      logger.debug("Reconnecting", { reconnectionAttempts });
      onConnect();
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
    if (listenerGroup && listenerGroup.has(callback)) {
      logger.debug("Removed event listener", { name });
      socket.events.emitListenerRemoveEvent(name);
      listenerGroup.delete(callback);
      return true;
    }
    return false;
  };

  const onListen = (listener: Pick<ListenerInstance, "name">, callback: ListenerCallbackType<T, any>): (() => void) => {
    const listenerGroup = listeners.get(listener.name) || listeners.set(listener.name, new Set()).get(listener.name);

    listenerGroup.add(callback);
    return () => removeListener(listener.name, callback);
  };

  // Emitters

  const onEmit = (emitter: EmitterInstance): boolean => {
    if (!connecting || !open) {
      logger.error("Cannot emit event when connection is not open");
      return false;
    }
    socket.events.emitEmitterEvent(emitter);
    return true;
  };

  // Lifecycle

  const onOpen = (event: ExtractSocketFormatType<T>) => {
    logger.info("Connection open", { event });
    socket.__onOpenCallbacks.forEach((callback) => {
      callback(event, socket);
    });
    open = true;
    connecting = false;
    socket.events.emitOpen();
  };

  const onClose = (event: ExtractSocketFormatType<T>) => {
    logger.info("Connection closed", { event });
    socket.__onCloseCallbacks.forEach((callback) => {
      callback(event, socket);
    });
    open = false;
    connecting = false;
    socket.events.emitClose();
  };

  const onError = (event: ExtractSocketFormatType<T>) => {
    logger.info("Error message", { event });
    socket.__onErrorCallbacks.forEach((callback) => {
      callback(event, socket);
    });
    socket.events.emitError(event);
  };

  const onEvent = (event: ExtractSocketFormatType<T>, extra: ExtractSocketExtraType<T>) => {
    logger.info("New event message", { event });

    const response = socket.__modifyResponse(event);
    const data = parseResponse(response.data);
    const eventListeners = listeners.get(data.name) || [];
    eventListeners.forEach((callback) => {
      callback(data, event);
    });
    socket.events.emitListenerEvent(data.name, { data, event, extra });
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
