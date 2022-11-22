import { WebsocketClientType } from "client";
import { Emitter } from "emitter";
import { Listener } from "listener";
import { SocketClientType } from "socket";

export type ExtractEmitterOptionsType<T extends SocketClientType<WebsocketClientType>> = T["emitterOptions"];

export type ExtractListenerOptionsType<T extends SocketClientType<WebsocketClientType>> = T["listenerOptions"];

export type ExtractListenerResponseType<T> = T extends Listener<infer R, any> ? R : never;

export type ExtractListenerDataType<T> = T extends Emitter<infer D, any, any> ? D : never;
