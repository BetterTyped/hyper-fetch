import { parseResponse } from "@hyper-fetch/core";

import { SocketInstance } from "socket";
import { ServerSentEvent, SocketEvent } from "./adapter.types";

export const getSocketUrl = (socket: SocketInstance) => {
  const queryParams = socket.queryParamsStringify(socket.queryParams).substring(1);
  const queryPrefix = queryParams ? "?" : "";
  const fullUrl = `${socket.url}${queryPrefix}${queryParams}`;
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

export const parseMessageEvent = <T extends SocketEvent | ServerSentEvent>(event: MessageEvent<any>) => {
  const parsedEvent = parseResponse(event.data) as T;
  return { ...parsedEvent, event };
};
