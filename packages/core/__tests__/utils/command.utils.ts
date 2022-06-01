import { FetchBuilderInstance } from "builder";
import { FetchCommandConfig } from "command";
import { ClientDefaultOptionsType } from "client";

export const createCommand = <T extends FetchBuilderInstance>(
  builder: T,
  options?: Partial<FetchCommandConfig<string, ClientDefaultOptionsType>>,
) => {
  return builder.createCommand<any, any>()({ endpoint: "/shared-endpoint", ...options });
};
