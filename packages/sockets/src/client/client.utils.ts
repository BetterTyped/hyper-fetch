import { SocketInstance } from "socket";

export const getClient = (socket: SocketInstance) => {
  const queryParams = socket.queryParamsStringify(socket.queryParams).substring(1);
  const authParams = socket.queryParamsStringify(socket.auth).substring(1);
  const connector = queryParams && authParams ? "&" : "";
  const fullUrl = `${socket.url}?${authParams}${connector}${queryParams}`;

  if ("isSSE" in socket.options) {
    return new EventSource(fullUrl, socket.options.clientOptions?.eventSourceInit);
  }
  return new WebSocket(fullUrl, socket.options.clientOptions?.protocols);
};
