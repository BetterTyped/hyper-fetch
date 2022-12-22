import { ClientQueryParamsType, QueryStringifyOptions, StringifyCallbackType } from "@hyper-fetch/core";

import { Socket } from "socket";
import { ServerSentEventsClientOptionsType, WebsocketClientOptionsType } from "client";
import { EmitterInstance } from "emitter";

export type SocketInstance = Socket<any>;

export type SocketConfigBaseType<SocketClientType> = {
  url: string;
  client?: SocketClientType;
  auth?: ClientQueryParamsType;
  queryParams?: ClientQueryParamsType | string;
  reconnect?: number;
  reconnectTime?: number;
  autoConnect?: boolean;
  queryParamsConfig?: QueryStringifyOptions;
  queryParamsStringify?: StringifyCallbackType;
};

export type SocketConfig<SocketClientType> =
  | (SocketConfigBaseType<SocketClientType> & { isSSE: true; clientOptions?: ServerSentEventsClientOptionsType })
  | (SocketConfigBaseType<SocketClientType> & {
      clientOptions?: WebsocketClientOptionsType;
    });

export type ReconnectCallbackType<SocketType extends SocketInstance> = (socket: SocketType) => void;
export type ReconnectStopCallbackType<SocketType extends SocketInstance> = (socket: SocketType) => void;
export type OpenCallbackType<SocketType extends SocketInstance, Event> = (event: Event, socket: SocketType) => void;
export type CloseCallbackType<SocketType extends SocketInstance, Event> = (event: Event, socket: SocketType) => void;
export type MessageCallbackType<SocketType extends SocketInstance, Event> = (event: Event, socket: SocketType) => Event;
export type SendCallbackType<EmitterType extends EmitterInstance> = (emitter: EmitterType) => EmitterInstance;
export type ErrorCallbackType<SocketType extends SocketInstance, Event> = (event: Event, socket: SocketType) => void;
