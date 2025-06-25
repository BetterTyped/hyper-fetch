import { SocketAdapterInstance } from "adapter";
import { SocketAdapter } from "adapter/adapter";
import { Emitter } from "emitter";
import { Listener } from "listener";
import { Socket, SocketInstance } from "socket";

export type EventReturnType<GenericDataType, Adapter extends SocketAdapterInstance> = {
  data: GenericDataType;
  extra: ExtractAdapterExtraType<Adapter>;
};

// Emitter

export type ExtractEmitterPayloadType<E> = E extends Emitter<infer P, any, any, any, any> ? P : never;
export type ExtractEmitterTopicType<E> = E extends Emitter<any, infer T, any, any, any> ? T : never;
export type ExtractEmitterSocketType<E> = E extends Emitter<any, any, infer A, any, any> ? A : never;
export type ExtractEmitterHasPayloadType<E> = E extends Emitter<any, any, any, infer D, any> ? D : never;
export type ExtractEmitterHasParamsType<E> = E extends Emitter<any, any, any, any, infer P> ? P : never;

// Listener

export type ExtractListenerResponseType<T> = T extends Listener<infer R, any, any, any> ? R : never;
export type ExtractListenerTopicType<E> = E extends Listener<any, infer T, any, any> ? T : never;
export type ExtractListenerSocketType<E> = E extends Listener<any, any, infer A, any> ? A : never;
export type ExtractListenerHasParamsType<E> = E extends Listener<any, any, any, infer P> ? P : never;

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

export type ExtractAdapterExtraType<T extends SocketAdapterInstance> =
  T extends SocketAdapter<infer P, any, any, any, any, any> ? P : never;
export type ExtractAdapterOptionsType<T extends SocketAdapterInstance> =
  T extends SocketAdapter<any, infer P, any, any, any, any> ? P : never;
export type ExtractAdapterListenerOptionsType<T extends SocketAdapterInstance> =
  T extends SocketAdapter<any, any, infer P, any, any, any> ? P : never;
export type ExtractAdapterEmitterOptionsType<T extends SocketAdapterInstance> =
  T extends SocketAdapter<any, any, any, infer P, any, any> ? P : never;
export type ExtractAdapterQueryParamsType<T extends SocketAdapterInstance> =
  T extends SocketAdapter<any, any, any, any, infer P, any> ? P : never;
export type ExtractAdapterQueryParamsMapperType<T extends SocketAdapterInstance> =
  T extends SocketAdapter<any, any, any, any, any, infer P> ? P : never;
