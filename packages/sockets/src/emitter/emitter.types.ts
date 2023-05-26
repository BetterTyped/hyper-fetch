import { SocketAdapterInstance, ExtractEmitterOptionsType } from "adapter";
import { Emitter } from "emitter";

export type EmitterInstance = Emitter<any, any, SocketAdapterInstance>;

export type EmitterOptionsType<AdapterType extends SocketAdapterInstance> = {
  name: string;
  timeout?: number;
  options?: ExtractEmitterOptionsType<AdapterType>;
};

export type EmitterCloneOptionsType<DataType, AdapterType extends SocketAdapterInstance> = Partial<
  EmitterOptionsType<AdapterType>
> & {
  data: DataType;
};
