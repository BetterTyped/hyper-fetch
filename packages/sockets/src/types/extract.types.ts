import { WebsocketClientType } from "client";
import { Emitter } from "emitter";
import { Listener } from "listener";

// Emitter

export type ExtractEmitterOptionsType<T extends Record<keyof WebsocketClientType | string, any>> = T["emitterOptions"];

export type ExtractListenerOptionsType<T extends Record<keyof WebsocketClientType | string, any>> =
  T["listenerOptions"];

// Listener

export type ExtractListenerResponseType<T> = T extends Listener<infer R, any> ? R : never;

export type ExtractListenerDataType<T> = T extends Emitter<infer D, any, any> ? D : never;
