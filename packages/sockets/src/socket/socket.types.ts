import { ClientQueryParamsType, QueryStringifyOptions, StringifyCallbackType } from "@hyper-fetch/core";

import { WebsocketClientType } from "client";
import { Socket } from "socket";

export type SocketInstance = Socket<any>;

export type SocketConfig<WebsocketType> = {
  url: string;
  isSSE?: boolean;
  auth?: ClientQueryParamsType;
  queryParams?: ClientQueryParamsType | string;
  client?: SocketClientType<WebsocketType>;
  reconnect?: number;
  reconnectTime?: number;
  autoConnect?: boolean;
  queryParamsConfig?: QueryStringifyOptions;
  queryParamsStringify?: StringifyCallbackType;
};

export type SocketClientType<ClientType> = WebsocketClientType extends ClientType ? ClientType : WebsocketClientType;

export type ReconnectCallbackType<WebsocketType> = (websocket: SocketClientType<WebsocketType>) => void;
export type ReconnectStopCallbackType<WebsocketType> = (websocket: SocketClientType<WebsocketType>) => void;
export type OpenCallbackType<WebsocketType> = <Event>(event: Event, websocket: SocketClientType<WebsocketType>) => void;
export type CloseCallbackType<WebsocketType> = <Event>(
  event: Event,
  websocket: SocketClientType<WebsocketType>,
) => void;
export type MessageCallbackType<WebsocketType> = <Event>(
  event: Event,
  websocket: SocketClientType<WebsocketType>,
) => void;
export type SendCallbackType<WebsocketType> = <Event>(event: Event, websocket: SocketClientType<WebsocketType>) => void;
export type ErrorCallbackType<WebsocketType> = <Event>(
  event: Event,
  websocket: SocketClientType<WebsocketType>,
) => void;
