import { Socket, SocketOptionsType } from "socket";
import { SocketAdapterInstance, WebsocketAdapterType } from "adapter";
import { wsUrl } from "../websocket/websocket.server";

export const createSocket = <T extends SocketAdapterInstance = WebsocketAdapterType>(
  config?: Partial<SocketOptionsType<T>>,
) => {
  return new Socket<T>({ url: wsUrl, ...config });
};
