import type { SocketAdapterInstance } from "adapter";
import type { WebsocketAdapterType } from "adapter-websockets/websocket-adapter";
import type { SocketOptionsType } from "socket";
import { Socket } from "socket";

export function createSocketClient<Adapter extends SocketAdapterInstance = WebsocketAdapterType>(
  options: SocketOptionsType<Adapter>,
): Socket<Adapter> {
  return new Socket<Adapter>(options);
}
