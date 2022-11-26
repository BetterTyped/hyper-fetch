import { ClientQueryParamsType, QueryStringifyOptions, StringifyCallbackType } from "@hyper-fetch/core";

import { WebsocketClientType } from "client";
import { Socket } from "socket";

export type SocketInstance = Socket<any>;

export type SocketConfigBaseType<WebsocketType> = {
  url: string;
  client?: SocketClientType<WebsocketType>;
  auth?: ClientQueryParamsType;
  queryParams?: ClientQueryParamsType | string;
  reconnect?: number;
  reconnectTime?: number;
  debug?: boolean;
  autoConnect?: boolean;
  queryParamsConfig?: QueryStringifyOptions;
  queryParamsStringify?: StringifyCallbackType;
};

export type SocketConfig<WebsocketType> =
  | (SocketConfigBaseType<WebsocketType> & { isSSE: true; additionalOptions?: EventSourceInit })
  | (SocketConfigBaseType<WebsocketType> & { additionalOptions?: { protocols: string[] } });

export type SocketClientType<ClientType extends Record<keyof WebsocketClientType | string, any>> = ClientType;

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
