import { SocketAdapter } from "adapter";
import { Socket, SocketAdapterOptionsType, SocketInstance } from "socket";
import { wsUrl } from "../websocket/websocket.server";

export const createSocket = (config?: Partial<SocketAdapterOptionsType<SocketAdapter<SocketInstance>>>) => {
  return new Socket({ url: wsUrl, ...config });
};
