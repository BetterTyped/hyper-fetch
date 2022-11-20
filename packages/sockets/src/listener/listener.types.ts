import { Listener } from "listener";

export type ListenerInstance = Listener<any, any, any>;

export type ListenerOptionsType<SocketOptions> = {
  event: string;
  options?: SocketOptions;
};
