import { BUILTIN_REGISTRIES } from "features/add-components/utils/constants";
import { configSchema } from "config/schema";
import { Config, createConfig } from "utils/get-config";
import deepmerge from "deepmerge";

export function configWithDefaults(config?: Partial<Config> | Config) {
  const baseConfig = createConfig({
    registries: BUILTIN_REGISTRIES,
  });

  if (!config) {
    return baseConfig;
  }

  return configSchema.parse(
    deepmerge(baseConfig, {
      ...config,
      registries: { ...BUILTIN_REGISTRIES, ...config.registries },
    }),
  );
}
