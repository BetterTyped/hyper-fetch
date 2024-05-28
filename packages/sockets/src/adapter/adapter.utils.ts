import { parseResponse } from "@hyper-fetch/core";

import { SocketInstance } from "socket";
import { WebsocketEvent } from "./adapter.types";

export const getSocketUrl = (socket: SocketInstance) => {
  const queryParams = socket.queryParamsStringify(socket.queryParams).substring(1);
  const authParams = socket.queryParamsStringify(socket.auth).substring(1);
  const connector = queryParams && authParams ? "&" : "";
  const queryPrefix = authParams || queryParams ? "?" : "";
  const fullUrl = `${socket.url}${queryPrefix}${authParams}${connector}${queryParams}`;
  return fullUrl;
};

export const getWebsocketAdapter = (socket: SocketInstance) => {
  if (!window?.WebSocket) return null;
  return new WebSocket(getSocketUrl(socket), socket.options.adapterOptions?.protocols);
};

export const getSSEAdapter = (socket: SocketInstance) => {
  if (!window?.EventSource) return null;
  return new EventSource(getSocketUrl(socket), socket.options.adapterOptions?.protocols);
};

export const parseMessageEvent = (event: MessageEvent<any>) => {
  return { event, response: parseResponse(event.data) as WebsocketEvent };
};
