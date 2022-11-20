import { Builder, BuilderConfig } from "builder";

export const createBuilder = (config?: Partial<BuilderConfig>) => {
  return new Builder({ url: "shared-base-url", ...config });
};
