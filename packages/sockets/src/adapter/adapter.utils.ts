import { SocketInstance } from "socket";

export const getWebsocketAdapter = (socket: SocketInstance) => {
  if (!window?.WebSocket) return null;
  return new WebSocket(socket.url, socket.options.adapterOptions?.protocols);
};

export const getSSEAdapter = (socket: SocketInstance) => {
  if (!window?.EventSource) return null;
  return new EventSource(socket.url, socket.options.adapterOptions?.protocols);
};
