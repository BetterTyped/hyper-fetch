import { SocketClient } from "client";
import { Socket, SocketConfig, SocketInstance } from "socket";
import { wsUrl } from "../websocket/websocket.server";

export const createSocket = (config?: Partial<SocketConfig<SocketClient<SocketInstance>>>) => {
  return new Socket({ url: wsUrl, ...config });
};
