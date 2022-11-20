import { Emitter } from "emitter";

export type EmitterInstance = Emitter<any, any, any, any>;

export type EmitterOptionsType<AdditionalEmitterOptions> = {
  event: string;
  options?: AdditionalEmitterOptions;
  offline?: boolean;
};

export type EmitterCloneOptionsType<DataType, AdditionalEmitterOptions> = Partial<
  EmitterOptionsType<AdditionalEmitterOptions>
> & {
  data: DataType;
};
