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
  getListenerEventByTopicKey,
  getEmitterEventByTopicKey,
  getListenerRemoveKey,
  getListenerRemoveByTopicKey,
  getEmitterStartEventKey,
  getEmitterStartEventByTopicKey,
  getEmitterErrorKey,
  getEmitterErrorByTopicKey,
} from "socket";
import { EmitterInstance } from "emitter";
import { ListenerInstance } from "listener";
import { SocketAdapterInstance } from "adapter";
import { EventReturnType, ExtractAdapterExtraType, ExtractEmitterAdapterType, ExtractEmitterResponseType } from "types";

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
    topic: string,
    { data, extra }: EventReturnType<ResponseType, ExtractAdapterExtraType<T>>,
  ): void => {
    eventEmitter.emit(getListenerEventKey(), { topic, data, extra });
    eventEmitter.emit(getListenerEventByTopicKey(topic), { topic, data, extra });
  },
  emitListenerRemoveEvent: (topic: string): void => {
    eventEmitter.emit(getListenerRemoveKey(), topic);
    eventEmitter.emit(getListenerRemoveByTopicKey(topic));
  },
  emitEmitterStartEvent: <EmitterType extends EmitterInstance>(emitter: EmitterType): void => {
    eventEmitter.emit(getEmitterStartEventKey(), emitter);
    eventEmitter.emit(getEmitterStartEventByTopicKey(emitter.topic), emitter);
  },
  emitEmitterEvent: <EmitterType extends EmitterInstance>(
    emitter: EmitterType,
    response: {
      data: ExtractEmitterResponseType<EmitterType>;
      extra: ExtractAdapterExtraType<ExtractEmitterAdapterType<EmitterType>>;
    },
  ): void => {
    eventEmitter.emit(getEmitterEventKey(), response, emitter);
    eventEmitter.emit(getEmitterEventByTopicKey(emitter.topic), response, emitter);
  },
  emitEmitterError: <EmitterType extends EmitterInstance>(error: Error, emitter: EmitterType): void => {
    eventEmitter.emit(getEmitterErrorKey(), error, emitter);
    eventEmitter.emit(getEmitterErrorByTopicKey(emitter.topic), error, emitter);
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
  // Emitters
  onEmitterEvent: <EmitterType extends EmitterInstance>(
    callback: (
      response: EventReturnType<ExtractEmitterResponseType<EmitterType>, ExtractEmitterAdapterType<EmitterType>>,
      emitter: EmitterType,
    ) => void,
  ): VoidFunction => {
    eventEmitter.on(getEmitterEventKey(), callback);
    return () => eventEmitter.removeListener(getEmitterEventKey(), callback);
  },
  onEmitterEventByTopic: <EmitterType extends EmitterInstance>(
    emitter: EmitterType,
    callback: (
      response: EventReturnType<ExtractEmitterResponseType<EmitterType>, ExtractEmitterAdapterType<EmitterType>>,
      emitter: EmitterType,
    ) => void,
  ): VoidFunction => {
    eventEmitter.on(getEmitterEventByTopicKey(emitter.topic), callback);
    return () => eventEmitter.removeListener(getEmitterEventByTopicKey(emitter.topic), callback);
  },
  onEmitterStartEvent: <EmitterType extends EmitterInstance>(
    callback: (emitter: EmitterType) => void,
  ): VoidFunction => {
    eventEmitter.on(getEmitterStartEventKey(), callback);
    return () => eventEmitter.removeListener(getEmitterStartEventKey(), callback);
  },
  onEmitterStartEventByTopic: <EmitterType extends EmitterInstance>(
    emitter: EmitterType,
    callback: (emitter: EmitterType) => void,
  ): VoidFunction => {
    eventEmitter.on(getEmitterStartEventByTopicKey(emitter.topic), callback);
    return () => eventEmitter.removeListener(getEmitterStartEventByTopicKey(emitter.topic), callback);
  },
  onEmitterError: <EmitterType extends EmitterInstance>(
    callback: (error: Error, emitter: EmitterType) => void,
  ): VoidFunction => {
    eventEmitter.on(getEmitterErrorKey(), callback);
    return () => eventEmitter.removeListener(getEmitterErrorKey(), callback);
  },
  onEmitterErrorByTopic: <EmitterType extends EmitterInstance>(
    emitter: EmitterType,
    callback: (error: Error, emitter: EmitterType) => void,
  ): VoidFunction => {
    eventEmitter.on(getEmitterErrorByTopicKey(emitter.topic), callback);
    return () => eventEmitter.removeListener(getEmitterErrorByTopicKey(emitter.topic), callback);
  },
  // Listeners
  onListenerEvent: <ResponseType = Event>(
    callback: ({
      topic,
      data,
      extra,
    }: {
      topic: string;
      data: ResponseType;
      extra: ExtractAdapterExtraType<T>;
    }) => void,
  ): VoidFunction => {
    eventEmitter.on(getListenerEventKey(), callback);
    return () => eventEmitter.removeListener(getListenerEventKey(), callback);
  },
  onListenerEventByTopic: <ListenerType extends ListenerInstance>(
    listener: ListenerType,
    callback: ({
      topic,
      data,
      extra,
    }: {
      topic: string;
      data: ResponseType;
      extra: ExtractAdapterExtraType<T>;
    }) => void,
  ): VoidFunction => {
    eventEmitter.on(getListenerEventByTopicKey(listener.topic), callback);
    return () => eventEmitter.removeListener(getListenerEventByTopicKey(listener.topic), callback);
  },
  onListenerRemove: (callback: (topic: string) => void): VoidFunction => {
    eventEmitter.on(getListenerRemoveKey(), callback);
    return () => eventEmitter.removeListener(getListenerRemoveKey(), callback);
  },
  onListenerRemoveByTopic: <ListenerType extends ListenerInstance>(
    listener: ListenerType,
    callback: () => void,
  ): VoidFunction => {
    eventEmitter.on(getListenerRemoveByTopicKey(listener.topic), callback);
    return () => eventEmitter.removeListener(getListenerRemoveByTopicKey(listener.topic), callback);
  },
});
