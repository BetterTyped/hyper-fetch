import { Socket, SocketOptionsType } from "socket";
import { SocketAdapterInstance } from "adapter";
import { WebsocketAdapterType } from "adapter-websockets/websocket-adapter";

export const createSocket = <T extends SocketAdapterInstance = WebsocketAdapterType>(
  config?: Partial<SocketOptionsType<T>>,
) => {
  return new Socket<T>({ url: "ws://localhost:1234", ...config });
};
