import { Builder, BuilderConfig } from "builder";

export const createBuilder = (config?: Partial<BuilderConfig>) => {
  return new Builder({ baseUrl: "shared-base-url", ...config });
};
