import type { SocketAdapterInstance } from "adapter";
import type { WebsocketAdapterType } from "adapter-websockets/websocket-adapter";
import type { SocketOptionsType } from "socket";
import { Socket } from "socket";

export const createSocket = <T extends SocketAdapterInstance = WebsocketAdapterType>(
  config?: Partial<SocketOptionsType<T>>,
) => {
  return new Socket<T>({ url: "ws://localhost:1234", ...config });
};
