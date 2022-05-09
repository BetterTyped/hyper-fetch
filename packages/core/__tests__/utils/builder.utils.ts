import { FetchBuilder, FetchBuilderConfig } from "builder";
import { XHRConfigType } from "client";

export const createBuilder = (config?: Partial<FetchBuilderConfig<Error, XHRConfigType>>) => {
  return new FetchBuilder({ baseUrl: "shared-base-url", ...config });
};
