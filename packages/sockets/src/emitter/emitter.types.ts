export type EmitterOptionsType<SocketOptions> = {
  event: string;
  headers?: HeadersInit;
  auth?: boolean;
  options?: SocketOptions;
  retry?: number;
  retryTime?: number;
  offline?: boolean;
};

export type EmitterCloneOptionsType<DataType, ArgsType, QueryParams, SocketOptions> =
  EmitterOptionsType<SocketOptions> & {
    data: DataType;
    args: ArgsType;
    queryParams: QueryParams;
    used?: boolean;
  };
