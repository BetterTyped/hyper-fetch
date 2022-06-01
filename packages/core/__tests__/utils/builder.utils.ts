import { FetchBuilder, FetchBuilderConfig } from "builder";

export const createBuilder = (config?: Partial<FetchBuilderConfig>) => {
  return new FetchBuilder({ baseUrl: "shared-base-url", ...config });
};
