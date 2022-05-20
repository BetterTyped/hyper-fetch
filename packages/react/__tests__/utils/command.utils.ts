import { FetchCommandConfig, XHRConfigType } from "@better-typed/hyper-fetch";
import { builder } from "./builder.utils";

export const createCommand = (options?: Partial<FetchCommandConfig<string, XHRConfigType>>) => {
  return builder.createCommand<any, any>()({ endpoint: "/shared-endpoint", ...options });
};
