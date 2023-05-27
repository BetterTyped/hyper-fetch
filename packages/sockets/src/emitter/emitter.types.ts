import { ExtractRouteParams } from "@hyper-fetch/core";

import { SocketAdapterInstance, ExtractEmitterOptionsType } from "adapter";
import { Emitter } from "emitter";

export type EmitterInstance = Emitter<any, any, any, SocketAdapterInstance>;

export type EmitterOptionsType<Name extends string, AdapterType extends SocketAdapterInstance> = {
  name: Name;
  timeout?: number;
  params?: ExtractRouteParams<Name>;
  options?: ExtractEmitterOptionsType<AdapterType>;
};

export type EmitterCloneOptionsType<DataType, Name extends string, AdapterType extends SocketAdapterInstance> = Partial<
  EmitterOptionsType<Name, AdapterType>
> & {
  data: DataType;
};
