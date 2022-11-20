import { Emitter } from "emitter";

export type EmitterInstance = Emitter<any, any, any, any, any, any, any>;

export type EmitterOptionsType<SocketOptions> = {
  event: string;
  options?: SocketOptions;
};

export type EmitterCloneOptionsType<DataType, ArgsType, QueryParams, SocketOptions> =
  EmitterOptionsType<SocketOptions> & {
    data: DataType;
    args: ArgsType;
    queryParams: QueryParams;
  };
