import { parseResponse } from "@hyper-fetch/core";

import { SocketInstance } from "socket";
import { ListenerInstance } from "listener";
import { EmitterInstance } from "emitter";
import { ListenerCallbackType } from "adapter";

export const adapterBindingsSocket = (socket: SocketInstance) => {
  const logger = socket.loggerManager.init("Socket Adapter");
  const listeners: Map<string, Set<ListenerCallbackType>> = new Map();

  let open = false;
  let connecting = false;
  let forceClosed = false;
  let reconnectionAttempts = 0;

  // Methods

  const connect = () => {
    if (!socket.appManager.isOnline || connecting) {
      return logger.warning("Cannot initialize adapter.", {
        connecting,
        online: socket.appManager.isOnline,
      });
    }

    forceClosed = false;
    connecting = true;
    socket.events.emitConnecting();
  };

  const disconnect = () => {
    logger.debug("Disconnecting", { reconnectionAttempts });
    open = false;
    connecting = false;
    forceClosed = true;
  };

  const reconnect = () => {
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

  const removeListener = (name: string, callback: ListenerCallbackType) => {
    const listenerGroup = listeners.get(name);
    if (listenerGroup && listenerGroup.has(callback)) {
      logger.debug("Removed event listener", { name });
      socket.events.emitListenerRemoveEvent(name);
      listenerGroup.delete(callback);
      return true;
    }
    return false;
  };

  const listen = (listener: ListenerInstance, callback: ListenerCallbackType) => {
    const listenerGroup = listeners.get(listener.name) || listeners.set(listener.name, new Set()).get(listener.name);

    listenerGroup.add(callback);
    return () => removeListener(listener.name, callback);
  };

  // Emitters

  const emit = (emitter: EmitterInstance) => {
    socket.events.emitEmitterEvent(emitter);
  };

  // Lifecycle

  const onOpen = (event) => {
    logger.info("Connection open", { event });
    socket.__onOpenCallbacks.forEach((callback) => {
      callback(event, socket);
    });
    open = true;
    connecting = false;
    socket.events.emitOpen();
  };

  const onClose = (event) => {
    logger.info("Connection closed", { event });
    socket.__onCloseCallbacks.forEach((callback) => {
      callback(event, socket);
    });
    open = false;
    connecting = false;
    socket.events.emitClose();
  };

  const onError = (event) => {
    logger.info("Error message", { event });
    socket.__onErrorCallbacks.forEach((callback) => {
      callback(event, socket);
    });
    socket.events.emitError(event);
  };

  const onEvent = (event) => {
    logger.info("New event message", { event });

    const response = socket.__modifyResponse(event);
    const data = parseResponse(response.data);
    const eventListeners = listeners.get(data.name) || [];
    eventListeners.forEach((callback) => {
      callback(data, event);
    });
    socket.events.emitListenerEvent(data.name, data, event);
  };

  return {
    open,
    connecting,
    reconnectionAttempts,
    forceClosed,
    connect,
    reconnect,
    disconnect,
    listen,
    emit,
    onOpen,
    onClose,
    onError,
    onEvent,
  };
};
