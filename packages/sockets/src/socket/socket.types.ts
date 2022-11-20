import { ClientQueryParamsType, QueryStringifyOptions, StringifyCallbackType } from "@hyper-fetch/core";

import { WebsocketClientType } from "client";
import { Socket } from "socket";

export type SocketInstance = Socket<any, any, any, any>;

export type SocketConfig<WebsocketType, QueryParams extends ClientQueryParamsType | string> = {
  url: string;
  auth?: ClientQueryParamsType;
  queryParams?: QueryParams;
  client?: WebsocketClientType<WebsocketType>;
  reconnect?: number;
  reconnectTime?: number;
  autoConnect?: boolean;
  queryParamsConfig?: QueryStringifyOptions;
  queryParamsStringify?: StringifyCallbackType;
};

export type ReconnectCallbackType<WebsocketType extends WebsocketClientType<any>> = (websocket: WebsocketType) => void;
export type ReconnectStopCallbackType<WebsocketType extends WebsocketClientType<any>> = (
  websocket: WebsocketType,
) => void;
export type OpenCallbackType<WebsocketType extends WebsocketClientType<any>> = <Event>(
  event: Event,
  websocket: WebsocketType,
) => void;
export type CloseCallbackType<WebsocketType extends WebsocketClientType<any>> = <Event>(
  event: Event,
  websocket: WebsocketType,
) => void;
export type MessageCallbackType<WebsocketType extends WebsocketClientType<any>> = <Event>(
  event: Event,
  websocket: WebsocketType,
) => void;
export type SendCallbackType<WebsocketType extends WebsocketClientType<any>> = <Event>(
  event: Event,
  websocket: WebsocketType,
) => void;
export type ErrorCallbackType<WebsocketType extends WebsocketClientType<any>> = <Event>(
  event: Event,
  websocket: WebsocketType,
) => void;
