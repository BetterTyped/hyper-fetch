import { CommandConfig, ClientDefaultOptionsType } from "@hyper-fetch/core";

import { builder } from "./builder.utils";

export const createCommand = (options?: Partial<CommandConfig<string, ClientDefaultOptionsType>>) => {
  return builder.createCommand<any, any, any, any>()({ endpoint: "/shared-endpoint", ...options });
};
