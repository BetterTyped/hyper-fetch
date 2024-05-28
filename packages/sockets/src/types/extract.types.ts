import { TypeWithDefaults } from "@hyper-fetch/core";

import { SocketAdapterInstance, SocketAdapterType } from "adapter";
import { Emitter, EmitterInstance } from "emitter";
import { Listener, ListenerInstance } from "listener";
import { Socket, SocketInstance } from "socket";

export type EventReturnType<GenericDataType, Adapter extends SocketAdapterInstance> = {
  data: GenericDataType;
  extra: ExtractAdapterExtraType<Adapter>;
};

// Emitter

export type ExtractEmitterPayloadType<E extends EmitterInstance> =
  E extends Emitter<infer Properties> ? TypeWithDefaults<Properties, "payload", undefined> : never;
export type ExtractEmitterResponseType<E extends EmitterInstance> =
  E extends Emitter<infer Properties> ? TypeWithDefaults<Properties, "response", undefined> : never;
export type ExtractEmitterTopicType<E extends EmitterInstance> =
  E extends Emitter<infer Properties> ? TypeWithDefaults<Properties, "topic", string> : never;
export type ExtractEmitterAdapterType<E extends EmitterInstance> =
  E extends Emitter<infer Properties> ? TypeWithDefaults<Properties, "adapter", SocketAdapterType> : never;
export type ExtractEmitterMappedDataType<E extends EmitterInstance> =
  E extends Emitter<infer Properties> ? TypeWithDefaults<Properties, "mappedData", void> : never;
export type ExtractEmitterHasParamsType<E extends EmitterInstance> =
  E extends Emitter<infer Properties> ? TypeWithDefaults<Properties, "hasParams", false> : never;
export type ExtractEmitterHasDataType<E extends EmitterInstance> =
  E extends Emitter<infer Properties> ? TypeWithDefaults<Properties, "hasData", false> : never;

// Listener

export type ExtractListenerResponseType<T extends ListenerInstance> =
  T extends Listener<infer Properties> ? TypeWithDefaults<Properties, "response", undefined> : never;
export type ExtractListenerTopicType<T extends ListenerInstance> =
  T extends Listener<infer Properties> ? TypeWithDefaults<Properties, "topic", string> : never;
export type ExtractListenerAdapterType<T extends ListenerInstance> =
  T extends Listener<infer Properties> ? TypeWithDefaults<Properties, "adapter", SocketAdapterType> : never;
export type ExtractListenerHasParams<T extends ListenerInstance> =
  T extends Listener<infer Properties> ? TypeWithDefaults<Properties, "hasParams", false> : never;

// Socket

export type ExtractSocketAdapterType<T extends SocketInstance> = T extends Socket<infer Adapter> ? Adapter : never;
export type ExtractSocketOptionsType<T extends SocketInstance> =
  T extends Socket<infer Adapter> ? ExtractAdapterOptionsType<Adapter> : never;
export type ExtractSocketExtraType<T extends SocketInstance> =
  T extends Socket<infer Adapter> ? ExtractAdapterExtraType<Adapter> : never;
export type ExtractListenerOptionsType<T extends SocketInstance> =
  T extends Socket<infer Adapter> ? ExtractAdapterListenerOptionsType<Adapter> : never;
export type ExtractEmitterOptionsType<T extends SocketInstance> =
  T extends Socket<infer Adapter> ? ExtractAdapterEmitterOptionsType<Adapter> : never;

// Adapter

export type ExtractAdapterOptionsType<T extends SocketAdapterInstance> =
  T extends SocketAdapterType<infer Properties> ? TypeWithDefaults<Properties, "options", never> : never;
export type ExtractAdapterExtraType<T extends SocketAdapterInstance> =
  T extends SocketAdapterType<infer Properties> ? TypeWithDefaults<Properties, "extra", Record<never, never>> : never;
export type ExtractAdapterListenerOptionsType<T extends SocketAdapterInstance> =
  T extends SocketAdapterType<infer Properties> ? TypeWithDefaults<Properties, "listenerOptions", never> : never;
export type ExtractAdapterEmitterOptionsType<T extends SocketAdapterInstance> =
  T extends SocketAdapterType<infer Properties> ? TypeWithDefaults<Properties, "emitterOptions", never> : never;
