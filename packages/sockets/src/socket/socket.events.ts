import EventEmitter from "events";

import {
  getErrorKey,
  getCloseKey,
  getConnectingKey,
  getEmitterEventKey,
  getListenerEventKey,
  getOpenKey,
  getReconnectingKey,
  getReconnectingStopKey,
  getListenerEventByNameKey,
  getEmitterEventByNameKey,
  getListenerRemoveKey,
  getListenerRemoveByNameKey,
} from "socket";
import { EmitterInstance } from "emitter";
import { ListenerInstance } from "listener";
import { ExtractListenerResponseType } from "types/extract.types";

export const getSocketEvents = (eventEmitter: EventEmitter) => ({
  emitError: <ResponseType = MessageEvent>(event: ResponseType): void => {
    eventEmitter.emit(getErrorKey(), event);
  },
  emitOpen: (): void => {
    eventEmitter.emit(getOpenKey());
  },
  emitClose: (): void => {
    eventEmitter.emit(getCloseKey());
  },
  emitConnecting: (): void => {
    eventEmitter.emit(getConnectingKey());
  },
  emitReconnecting: (attempts: number): void => {
    eventEmitter.emit(getReconnectingKey(), attempts);
  },
  emitReconnectingStop: (attempts: number): void => {
    eventEmitter.emit(getReconnectingStopKey(), attempts);
  },
  emitListenerEvent: <ResponseType = MessageEvent>(type: string, data: ResponseType): void => {
    eventEmitter.emit(getListenerEventKey(), data);
    eventEmitter.emit(getListenerEventByNameKey(type), data);
  },
  emitListenerRemoveEvent: (type: string): void => {
    eventEmitter.emit(getListenerRemoveKey(), type);
    eventEmitter.emit(getListenerRemoveByNameKey(type));
  },
  emitEmitterEvent: <EmitterType extends EmitterInstance>(emitter: EmitterType): void => {
    eventEmitter.emit(getEmitterEventKey(), emitter);
    eventEmitter.emit(getEmitterEventByNameKey(emitter.name), emitter);
  },

  onError: (callback: <ResponseType = MessageEvent>(event: ResponseType) => void): VoidFunction => {
    eventEmitter.on(getErrorKey(), callback);
    return () => eventEmitter.removeListener(getErrorKey(), callback);
  },
  onOpen: (callback: () => void): VoidFunction => {
    eventEmitter.on(getOpenKey(), callback);
    return () => eventEmitter.removeListener(getOpenKey(), callback);
  },
  onClose: (callback: () => void): VoidFunction => {
    eventEmitter.on(getCloseKey(), callback);
    return () => eventEmitter.removeListener(getCloseKey(), callback);
  },
  onConnecting: (callback: () => void): VoidFunction => {
    eventEmitter.on(getConnectingKey(), callback);
    return () => eventEmitter.removeListener(getConnectingKey(), callback);
  },
  onReconnecting: (callback: (attempts: number) => void): VoidFunction => {
    eventEmitter.on(getReconnectingKey(), callback);
    return () => eventEmitter.removeListener(getReconnectingKey(), callback);
  },
  onReconnectingStop: (callback: (attempts: number) => void): VoidFunction => {
    eventEmitter.on(getReconnectingStopKey(), callback);
    return () => eventEmitter.removeListener(getReconnectingStopKey(), callback);
  },
  onListenerEvent: <ResponseType = Event>(callback: (data: ResponseType) => void): VoidFunction => {
    eventEmitter.on(getListenerEventKey(), callback);
    return () => eventEmitter.removeListener(getListenerEventKey(), callback);
  },
  onEmitterEvent: <EmitterType extends EmitterInstance>(callback: (emitter: EmitterType) => void): VoidFunction => {
    eventEmitter.on(getEmitterEventKey(), callback);
    return () => eventEmitter.removeListener(getEmitterEventKey(), callback);
  },
  onListenerEventByName: <ListenerType extends ListenerInstance>(
    listener: ListenerType,
    callback: (data: ExtractListenerResponseType<ListenerType>) => void,
  ): VoidFunction => {
    eventEmitter.on(getListenerEventByNameKey(listener.name), callback);
    return () => eventEmitter.removeListener(getListenerEventByNameKey(listener.name), callback);
  },
  onListenerRemove: (callback: (type: string) => void): VoidFunction => {
    eventEmitter.on(getListenerRemoveKey(), callback);
    return () => eventEmitter.removeListener(getListenerRemoveKey(), callback);
  },
  onListenerRemoveByName: <ListenerType extends ListenerInstance>(
    listener: ListenerType,
    callback: () => void,
  ): VoidFunction => {
    eventEmitter.on(getListenerRemoveByNameKey(listener.name), callback);
    return () => eventEmitter.removeListener(getListenerRemoveByNameKey(listener.name), callback);
  },
  onEmitterEventByName: <EmitterType extends EmitterInstance>(
    emitter: EmitterType,
    callback: (emitter: EmitterType) => void,
  ): VoidFunction => {
    eventEmitter.on(getEmitterEventByNameKey(emitter.name), callback);
    return () => eventEmitter.removeListener(getEmitterEventByNameKey(emitter.name), callback);
  },
});
