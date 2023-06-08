import { Emitter } from "emitter";
import { Listener } from "listener";

// Emitter

export type ExtractEmitterPayloadType<E> = E extends Emitter<infer P, any, any, any, any, any, any> ? P : never;
export type ExtractEmitterResponseType<E> = E extends Emitter<any, infer R, any, any, any, any, any> ? R : never;
export type ExtractEmitterEndpointType<E> = E extends Emitter<any, any, infer A, any, any, any, any> ? A : never;
export type ExtractEmitterAdapterType<E> = E extends Emitter<any, any, any, infer A, any, any, any> ? A : never;
export type ExtractEmitterMappedDataType<E> = E extends Emitter<any, any, any, any, infer M, any, any> ? M : never;
export type ExtractEmitterHasParamsType<E> = E extends Emitter<any, any, any, any, any, infer M, any> ? M : never;
export type ExtractEmitterHasDataType<E> = E extends Emitter<any, any, any, any, any, any, infer D> ? D : never;

// Listener

export type ExtractListenerResponseType<T> = T extends Listener<infer R, any, any, any> ? R : never;
export type ExtractListenerEndpointType<E> = E extends Listener<any, infer A, any, any> ? A : never;
export type ExtractListenerAdapterType<E> = E extends Listener<any, any, infer A, any> ? A : never;
export type ExtractListenerHasParams<E> = E extends Listener<any, any, any, infer P> ? P : never;
