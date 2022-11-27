import { Emitter } from "emitter";

export type EmitterInstance = Emitter<any, any, any>;

export type EmitterOptionsType<AdditionalEmitterOptions> = {
  name: string;
  timeout?: number;
  options?: AdditionalEmitterOptions;
};

export type EmitterCloneOptionsType<DataType, AdditionalEmitterOptions> = Partial<
  EmitterOptionsType<AdditionalEmitterOptions>
> & {
  data: DataType;
};
