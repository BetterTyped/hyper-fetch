import type { SocketOptionsType } from "socket";
import { Socket } from "socket";
import type { SocketAdapterInstance } from "adapter";
import type { WebsocketAdapterType } from "adapter-websockets/websocket-adapter";

export const createSocket = <T extends SocketAdapterInstance = WebsocketAdapterType>(
  config?: Partial<SocketOptionsType<T>>,
) => {
  return new Socket<T>({ url: "ws://localhost:1234", ...config });
};
