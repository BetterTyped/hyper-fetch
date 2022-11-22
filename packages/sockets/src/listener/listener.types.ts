import { Listener } from "listener";

export type ListenerInstance = Listener<any, any>;

export type ListenerOptionsType<SocketOptions> = {
  name: string;
  options?: SocketOptions;
};
