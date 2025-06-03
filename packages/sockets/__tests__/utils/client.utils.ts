import { SocketInstance } from "socket";
import { WebsocketAdapter } from "adapter";

export const createAdapter = <T extends SocketInstance>(socket: T, options?: T["options"]["adapterOptions"]) => {
  // eslint-disable-next-line no-param-reassign
  socket.options.adapterOptions = options;
  return WebsocketAdapter(socket);
};
