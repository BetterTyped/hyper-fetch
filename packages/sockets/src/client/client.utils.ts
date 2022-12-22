import { SocketInstance } from "socket";

export const getClient = (socket: SocketInstance) => {
  const queryParams = socket.queryParamsStringify(socket.queryParams).substring(1);
  const authParams = socket.queryParamsStringify(socket.auth).substring(1);
  const connector = queryParams && authParams ? "&" : "";
  const fullUrl = `${socket.url}?${authParams}${connector}${queryParams}`;

  if ("isSSE" in socket.options) {
    if (!window?.EventSource) return null;
    return new EventSource(fullUrl, socket.options.clientOptions?.eventSourceInit);
  }
  if (!window?.WebSocket) return null;
  return new WebSocket(fullUrl, socket.options.clientOptions?.protocols);
};
