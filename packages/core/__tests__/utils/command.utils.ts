import { FetchBuilderInstance } from "builder";
import { FetchCommandConfig } from "command";
import { XHRConfigType } from "client";

export const createCommand = <T extends FetchBuilderInstance>(
  builder: T,
  options?: Partial<FetchCommandConfig<string, XHRConfigType>>,
) => {
  return builder.createCommand<any, any>()({ endpoint: "/shared-endpoint", ...options });
};
