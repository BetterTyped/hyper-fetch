import { CommandConfig, ClientDefaultOptionsType } from "@hyper-fetch/core";

import { builder } from "./builder.utils";

export const createCommand = <ResponseType = any, RequestDataType = any>(
  options?: Partial<CommandConfig<string, ClientDefaultOptionsType>>,
) => {
  return builder.createCommand<ResponseType, RequestDataType, Error>()({ endpoint: "/shared-endpoint", ...options });
};
