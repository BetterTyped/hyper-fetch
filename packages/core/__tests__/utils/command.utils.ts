import { BuilderInstance } from "builder";
import { CommandConfig } from "command";
import { ClientDefaultOptionsType } from "client";

export const createCommand = <T extends BuilderInstance>(
  builder: T,
  options?: Partial<CommandConfig<string, ClientDefaultOptionsType>>,
) => {
  return builder.createCommand<any, any>()({ endpoint: "/shared-endpoint", ...options });
};
