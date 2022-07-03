import { BuilderInstance } from "builder";
import { CommandConfig } from "command";
import { ClientDefaultOptionsType } from "client";

export const createCommand = <T extends BuilderInstance, ResponseType = any, RequestDataType = any>(
  builder: T,
  options?: Partial<CommandConfig<string, ClientDefaultOptionsType>>,
) => {
  return builder.createCommand<ResponseType, RequestDataType>()({ endpoint: "/shared-endpoint", ...options });
};
