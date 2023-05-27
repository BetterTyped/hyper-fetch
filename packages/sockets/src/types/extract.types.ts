import { Emitter } from "emitter";
import { Listener } from "listener";

// Emitter

export type ExtractEmitterPayloadType<E> = E extends Emitter<infer P, any, any, any> ? P : never;
export type ExtractEmitterResponseType<E> = E extends Emitter<any, infer R, any, any> ? R : never;
export type ExtractEmitterAdapterType<E> = E extends Emitter<any, any, infer A, any> ? A : never;
export type ExtractEmitterMappedDataType<E> = E extends Emitter<any, any, any, infer M> ? M : never;

// Listener

export type ExtractListenerResponseType<T> = T extends Listener<infer R, any, any> ? R : never;
export type ExtractListenerNameType<E> = E extends Listener<any, infer A, any> ? A : never;
export type ExtractListenerAdapterType<E> = E extends Listener<any, any, infer A> ? A : never;
