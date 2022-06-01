import { FetchCommandConfig, ClientDefaultOptionsType } from "@better-typed/hyper-fetch";
import { builder } from "./builder.utils";

export const createCommand = (options?: Partial<FetchCommandConfig<string, ClientDefaultOptionsType>>) => {
  return builder.createCommand<any, any>()({ endpoint: "/shared-endpoint", ...options });
};
