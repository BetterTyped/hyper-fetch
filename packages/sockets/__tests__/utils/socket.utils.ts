import { Socket, SocketOptionsType } from "socket";
import { SocketAdapterInstance, WebsocketAdapterType } from "adapter";

export const createSocket = <T extends SocketAdapterInstance = WebsocketAdapterType>(
  config?: Partial<SocketOptionsType<T>>,
) => {
  return new Socket<T>({ url: "ws://localhost:1234", ...config });
};
