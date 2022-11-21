import { WebsocketClientType } from "client";
import { SocketClientType } from "socket";

export type ExtractEmitterOptionsType<T extends SocketClientType<WebsocketClientType>> = T["emitterOptions"];

export type ExtractListenerOptionsType<T extends SocketClientType<WebsocketClientType>> = T["listenerOptions"];
