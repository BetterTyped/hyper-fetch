import { Listener } from "listener";

export type ListenerInstance = Listener<any, any, any>;

export type ListenerOptionsType<SocketOptions> = {
  name: string;
  auth?: boolean;
  options?: SocketOptions;
  offline?: boolean;
};
