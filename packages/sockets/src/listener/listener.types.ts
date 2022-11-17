export type ListenerOptionsType<SocketOptions> = {
  event: string;
  headers?: HeadersInit;
  auth?: boolean;
  options?: SocketOptions;
  offline?: boolean;
};

export type ListenerCloneOptionsType<QueryParams, SocketOptions> = ListenerOptionsType<SocketOptions> & {
  queryParams: QueryParams;
  used?: boolean;
};
