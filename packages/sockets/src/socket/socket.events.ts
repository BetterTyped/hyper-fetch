import EventEmitter from "events";

import {
  getErrorKey,
  getCloseKey,
  getConnectingKey,
  getListenerEventKey,
  getOpenKey,
  getReconnectingKey,
  getReconnectingFailedKey,
  getListenerEventByTopicKey,
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
import { ExtractAdapterExtraType } from "types";

export const getSocketEvents = <Adapter extends SocketAdapterInstance>(eventEmitter: EventEmitter) =>
  ({
    emitError: <ResponseType>({ error }: { error: ResponseType }): void => {
      eventEmitter.emit(getErrorKey(), { error });
    },
    emitConnected: (): void => {
      eventEmitter.emit(getOpenKey());
    },
    emitDisconnected: (): void => {
      eventEmitter.emit(getCloseKey());
    },
    emitConnecting: ({ connecting }: { connecting: boolean }): void => {
      eventEmitter.emit(getConnectingKey(), { connecting });
    },
    emitReconnecting: ({ attempts }: { attempts: number }): void => {
      eventEmitter.emit(getReconnectingKey(), { attempts });
    },
    emitReconnectingFailed: ({ attempts }: { attempts: number }): void => {
      eventEmitter.emit(getReconnectingFailedKey(), { attempts });
    },
    emitListenerEvent: <ResponseType>({
      topic,
      data,
      extra,
    }: {
      topic: string;
      data: ResponseType;
      extra: ExtractAdapterExtraType<Adapter>;
    }): void => {
      eventEmitter.emit(getListenerEventKey(), { topic, data, extra });
      eventEmitter.emit(getListenerEventByTopicKey(topic), { topic, data, extra });
    },
    emitListenerRemoveEvent: ({ topic }: { topic: string }): void => {
      eventEmitter.emit(getListenerRemoveKey(), { topic });
      eventEmitter.emit(getListenerRemoveByTopicKey(topic), { topic });
    },
    emitEmitterStartEvent: <EmitterType extends EmitterInstance>({ emitter }: { emitter: EmitterType }): void => {
      eventEmitter.emit(getEmitterStartEventKey(), { emitter });
      eventEmitter.emit(getEmitterStartEventByTopicKey(emitter.topic), { emitter });
    },
    emitEmitterError: <EmitterType extends EmitterInstance>({
      error,
      emitter,
    }: {
      error: Error;
      emitter: EmitterType;
    }): void => {
      eventEmitter.emit(getEmitterErrorKey(), { error, emitter });
      eventEmitter.emit(getEmitterErrorByTopicKey(emitter.topic), { error, emitter });
    },
    onError: (callback: <ResponseType>({ error }: { error: ResponseType }) => void): VoidFunction => {
      eventEmitter.on(getErrorKey(), callback);
      return () => eventEmitter.removeListener(getErrorKey(), callback);
    },
    onConnected: (callback: () => void): VoidFunction => {
      eventEmitter.on(getOpenKey(), callback);
      return () => eventEmitter.removeListener(getOpenKey(), callback);
    },
    onDisconnected: (callback: () => void): VoidFunction => {
      eventEmitter.on(getCloseKey(), callback);
      return () => eventEmitter.removeListener(getCloseKey(), callback);
    },
    onConnecting: (callback: ({ connecting }: { connecting: boolean }) => void): VoidFunction => {
      eventEmitter.on(getConnectingKey(), callback);
      return () => eventEmitter.removeListener(getConnectingKey(), callback);
    },
    onReconnecting: (callback: ({ attempts }: { attempts: number }) => void): VoidFunction => {
      eventEmitter.on(getReconnectingKey(), callback);
      return () => eventEmitter.removeListener(getReconnectingKey(), callback);
    },
    onReconnectingFailed: (callback: ({ attempts }: { attempts: number }) => void): VoidFunction => {
      eventEmitter.on(getReconnectingFailedKey(), callback);
      return () => eventEmitter.removeListener(getReconnectingFailedKey(), callback);
    },
    // Emitters
    onEmitterStartEvent: <EmitterType extends EmitterInstance>(
      callback: ({ emitter }: { emitter: EmitterType }) => void,
    ): VoidFunction => {
      eventEmitter.on(getEmitterStartEventKey(), callback);
      return () => eventEmitter.removeListener(getEmitterStartEventKey(), callback);
    },
    onEmitterStartEventByTopic: <EmitterType extends EmitterInstance>(
      emitter: Pick<EmitterType, "topic">,
      callback: ({ emitter }: { emitter: EmitterType }) => void,
    ): VoidFunction => {
      eventEmitter.on(getEmitterStartEventByTopicKey(emitter.topic), callback);
      return () => eventEmitter.removeListener(getEmitterStartEventByTopicKey(emitter.topic), callback);
    },
    onEmitterError: <EmitterType extends EmitterInstance>(
      callback: ({ error, emitter }: { error: Error; emitter: EmitterType }) => void,
    ): VoidFunction => {
      eventEmitter.on(getEmitterErrorKey(), callback);
      return () => eventEmitter.removeListener(getEmitterErrorKey(), callback);
    },
    onEmitterErrorByTopic: <EmitterType extends EmitterInstance>(
      emitter: Pick<EmitterType, "topic">,
      callback: ({ error, emitter }: { error: Error; emitter: EmitterType }) => void,
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
        extra: ExtractAdapterExtraType<Adapter>;
      }) => void,
    ): VoidFunction => {
      eventEmitter.on(getListenerEventKey(), callback);
      return () => eventEmitter.removeListener(getListenerEventKey(), callback);
    },
    onListenerEventByTopic: <ListenerType extends ListenerInstance>(
      listener: Pick<ListenerType, "topic">,
      callback: ({
        topic,
        data,
        extra,
      }: {
        topic: string;
        data: ResponseType;
        extra: ExtractAdapterExtraType<Adapter>;
      }) => void,
    ): VoidFunction => {
      eventEmitter.on(getListenerEventByTopicKey(listener.topic), callback);
      return () => eventEmitter.removeListener(getListenerEventByTopicKey(listener.topic), callback);
    },
    onListenerRemove: (callback: ({ topic }: { topic: string }) => void): VoidFunction => {
      eventEmitter.on(getListenerRemoveKey(), callback);
      return () => eventEmitter.removeListener(getListenerRemoveKey(), callback);
    },
    onListenerRemoveByTopic: <ListenerType extends ListenerInstance>(
      listener: Pick<ListenerType, "topic">,
      callback: ({ topic }: { topic: string }) => void,
    ): VoidFunction => {
      eventEmitter.on(getListenerRemoveByTopicKey(listener.topic), callback);
      return () => eventEmitter.removeListener(getListenerRemoveByTopicKey(listener.topic), callback);
    },
  }) as const;
