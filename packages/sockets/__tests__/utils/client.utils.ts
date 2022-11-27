import { SocketInstance } from "socket";
import { SocketClient } from "client";

export const createClient = <T extends SocketInstance>(socket: T, options?: T["options"]["clientOptions"]) => {
  // eslint-disable-next-line no-param-reassign
  socket.options.clientOptions = options;
  return new SocketClient(socket);
};
