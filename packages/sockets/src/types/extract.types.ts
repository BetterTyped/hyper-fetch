import { TypeWithDefaults } from "@hyper-fetch/core";

import { SocketAdapterInstance, SocketAdapterType } from "adapter";
import { Emitter, EmitterInstance } from "emitter";
import { Listener, ListenerInstance } from "listener";

// Emitter

export type ExtractEmitterPayloadType<E extends EmitterInstance> =
  E extends Emitter<infer Properties> ? TypeWithDefaults<Properties, "payload", undefined> : never;
export type ExtractEmitterResponseType<E extends EmitterInstance> =
  E extends Emitter<infer Properties> ? TypeWithDefaults<Properties, "response", undefined> : never;
export type ExtractEmitterEndpointType<E extends EmitterInstance> =
  E extends Emitter<infer Properties> ? TypeWithDefaults<Properties, "endpoint", string> : never;
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
export type ExtractListenerEndpointType<T extends ListenerInstance> =
  T extends Listener<infer Properties> ? TypeWithDefaults<Properties, "endpoint", string> : never;
export type ExtractListenerAdapterType<T extends ListenerInstance> =
  T extends Listener<infer Properties> ? TypeWithDefaults<Properties, "adapter", SocketAdapterType> : never;
export type ExtractListenerHasParams<T extends ListenerInstance> =
  T extends Listener<infer Properties> ? TypeWithDefaults<Properties, "hasParams", false> : never;

// Socket

export type ExtractSocketOptionsType<T extends SocketAdapterInstance> =
  T extends SocketAdapterType<infer Properties> ? TypeWithDefaults<Properties, "options", never> : never;
export type ExtractSocketExtraType<T extends SocketAdapterInstance> =
  T extends SocketAdapterType<infer Properties> ? TypeWithDefaults<Properties, "extra", Record<never, never>> : never;
export type ExtractListenerOptionsType<T extends SocketAdapterInstance> =
  T extends SocketAdapterType<infer Properties> ? TypeWithDefaults<Properties, "listenerOptions", never> : never;
export type ExtractEmitterOptionsType<T extends SocketAdapterInstance> =
  T extends SocketAdapterType<infer Properties> ? TypeWithDefaults<Properties, "emitterOptions", never> : never;
