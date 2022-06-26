import { BuilderInstance } from "builder";
import { CommandConfig } from "command";
import { ClientDefaultOptionsType } from "client";

export const createCommand = <T extends BuilderInstance, ResponseType = any, PayLoadType = any>(
  builder: T,
  options?: Partial<CommandConfig<string, ClientDefaultOptionsType>>,
) => {
  return builder.createCommand<ResponseType, PayLoadType>()({ endpoint: "/shared-endpoint", ...options });
};
