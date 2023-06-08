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
  getListenerEventByEndpointKey,
  getEmitterEventByEndpointKey,
  getListenerRemoveKey,
  getListenerRemoveByEndpointKey,
} from "socket";
import { EmitterInstance } from "emitter";
import { ListenerInstance } from "listener";
import { ExtractSocketExtraType, SocketAdapterInstance } from "adapter";

export const getSocketEvents = <T extends SocketAdapterInstance>(eventEmitter: EventEmitter) => ({
  emitError: <ResponseType>(event: ResponseType): void => {
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
  emitListenerEvent: <ResponseType>(
    endpoint: string,
    { data, extra }: { data: ResponseType; extra: ExtractSocketExtraType<T> },
  ): void => {
    eventEmitter.emit(getListenerEventKey(), { endpoint, data, extra });
    eventEmitter.emit(getListenerEventByEndpointKey(endpoint), { endpoint, data, extra });
  },
  emitListenerRemoveEvent: (endpoint: string): void => {
    eventEmitter.emit(getListenerRemoveKey(), endpoint);
    eventEmitter.emit(getListenerRemoveByEndpointKey(endpoint));
  },
  emitEmitterEvent: <EmitterType extends EmitterInstance>(emitter: EmitterType): void => {
    eventEmitter.emit(getEmitterEventKey(), emitter);
    eventEmitter.emit(getEmitterEventByEndpointKey(emitter.endpoint), emitter);
  },

  onError: (callback: <ResponseType>(event: ResponseType) => void): VoidFunction => {
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
  onListenerEvent: <ResponseType = Event>(
    callback: ({
      endpoint,
      data,
      extra,
    }: {
      endpoint: string;
      data: ResponseType;
      extra: ExtractSocketExtraType<T>;
    }) => void,
  ): VoidFunction => {
    eventEmitter.on(getListenerEventKey(), callback);
    return () => eventEmitter.removeListener(getListenerEventKey(), callback);
  },
  onEmitterEvent: <EmitterType extends EmitterInstance>(callback: (emitter: EmitterType) => void): VoidFunction => {
    eventEmitter.on(getEmitterEventKey(), callback);
    return () => eventEmitter.removeListener(getEmitterEventKey(), callback);
  },
  onListenerEventByEndpoint: <ListenerType extends ListenerInstance>(
    listener: ListenerType,
    callback: ({
      endpoint,
      data,
      extra,
    }: {
      endpoint: string;
      data: ResponseType;
      extra: ExtractSocketExtraType<T>;
    }) => void,
  ): VoidFunction => {
    eventEmitter.on(getListenerEventByEndpointKey(listener.endpoint), callback);
    return () => eventEmitter.removeListener(getListenerEventByEndpointKey(listener.endpoint), callback);
  },
  onListenerRemove: (callback: (endpoint: string) => void): VoidFunction => {
    eventEmitter.on(getListenerRemoveKey(), callback);
    return () => eventEmitter.removeListener(getListenerRemoveKey(), callback);
  },
  onListenerRemoveByEndpoint: <ListenerType extends ListenerInstance>(
    listener: ListenerType,
    callback: () => void,
  ): VoidFunction => {
    eventEmitter.on(getListenerRemoveByEndpointKey(listener.endpoint), callback);
    return () => eventEmitter.removeListener(getListenerRemoveByEndpointKey(listener.endpoint), callback);
  },
  onEmitterEventByEndpoint: <EmitterType extends EmitterInstance>(
    emitter: EmitterType,
    callback: (emitter: EmitterType) => void,
  ): VoidFunction => {
    eventEmitter.on(getEmitterEventByEndpointKey(emitter.endpoint), callback);
    return () => eventEmitter.removeListener(getEmitterEventByEndpointKey(emitter.endpoint), callback);
  },
});
