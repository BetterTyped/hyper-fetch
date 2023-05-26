import { SocketInstance } from "socket";

const getSocketUrl = (socket: SocketInstance) => {
  const queryParams = socket.queryParamsStringify(socket.queryParams).substring(1);
  const authParams = socket.queryParamsStringify(socket.auth).substring(1);
  const connector = queryParams && authParams ? "&" : "";
  const fullUrl = `${socket.url}?${authParams}${connector}${queryParams}`;
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
