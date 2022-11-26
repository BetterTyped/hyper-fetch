import { ClientQueryParamsType, QueryStringifyOptions, StringifyCallbackType } from "@hyper-fetch/core";

import { Socket } from "socket";

export type SocketInstance = Socket<any>;

export type SocketConfigBaseType<WebsocketType> = {
  url: string;
  client?: WebsocketType;
  auth?: ClientQueryParamsType;
  queryParams?: ClientQueryParamsType | string;
  reconnect?: number;
  reconnectTime?: number;
  debug?: boolean;
  autoConnect?: boolean;
  queryParamsConfig?: QueryStringifyOptions;
  queryParamsStringify?: StringifyCallbackType;
};

export type ServerSentEventsClientOptionsType = {
  eventSourceInit: EventSourceInit;
  reconnectTimeout: number;
};

export type WebsocketClientOptionsType = {
  protocols: string[];
  pingTimeout: number;
  pongTimeout: number;
  reconnectTimeout: number;
  heartbeatMessage: string;
};

export type SocketConfig<WebsocketType> =
  | (SocketConfigBaseType<WebsocketType> & { isSSE: true; clientOptions?: ServerSentEventsClientOptionsType })
  | (SocketConfigBaseType<WebsocketType> & {
      clientOptions?: WebsocketClientOptionsType;
    });

export type ReconnectCallbackType<WebsocketType> = (websocket: WebsocketType) => void;
export type ReconnectStopCallbackType<WebsocketType> = (websocket: WebsocketType) => void;
export type OpenCallbackType<WebsocketType> = <Event>(event: Event, websocket: WebsocketType) => void;
export type CloseCallbackType<WebsocketType> = <Event>(event: Event, websocket: WebsocketType) => void;
export type MessageCallbackType<WebsocketType> = <Event>(event: Event, websocket: WebsocketType) => void;
export type SendCallbackType<WebsocketType> = <Event>(event: Event, websocket: WebsocketType) => void;
export type ErrorCallbackType<WebsocketType> = <Event>(event: Event, websocket: WebsocketType) => void;
