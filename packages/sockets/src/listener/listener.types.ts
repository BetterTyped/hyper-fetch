import { Listener } from "listener";

export type ListenerInstance = Listener<any, any, any, any, any>;

export type ListenerOptionsType<SocketOptions> = {
  name: string;
  headers?: HeadersInit;
  auth?: boolean;
  options?: SocketOptions;
  offline?: boolean;
};

export type ListenerCloneOptionsType<QueryParams, SocketOptions> = ListenerOptionsType<SocketOptions> & {
  queryParams: QueryParams;
  used?: boolean;
};
