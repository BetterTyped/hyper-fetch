import { Socket } from "socket";

export type SocketInstance = Socket<any, any, any, any>;

export type SocketConfig = {
  url: string;
  client?: unknown;
  reconnect?: number;
  reconnectTime?: number;
  autoConnect?: boolean;
};
