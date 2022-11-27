import { WebsocketClientType } from "client";
import { Socket, SocketConfig } from "socket";
import { wsUrl } from "../websocket/websocket.server";

export const createSocket = (config?: Partial<SocketConfig<WebsocketClientType>>) => {
  return new Socket({ url: wsUrl, ...config });
};
