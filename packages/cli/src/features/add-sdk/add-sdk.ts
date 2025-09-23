import { createClient } from "@hyper-fetch/core";

import { registrySchema } from "features/schema/schema";
import { Config } from "config/schema";

const getRegistryUrl = (name: string, config: Config) => {
  const registry = config.registries?.[name];

  if (!registry) {
    // when we pass a url, we don't need to get the registry url
    return name;
  }
  return registry.url;
};

export async function addSdk(options: {
  name: string;
  headers?: Record<string, string>;
  queryParams?: Record<string, string>;
  config: Config;
}) {
  const { name, headers, queryParams, config } = options;

  const url = getRegistryUrl(name, config);

  const client = createClient({ url: "" });
  const sdkRequest = client
    .createRequest<{ response: any; queryParams?: Record<string, string> }>()({
      endpoint: url,
      method: "GET",
      headers,
    })
    .setQueryParams(queryParams ?? {});

  const { data, error } = await sdkRequest.send();

  if (error) {
    throw error;
  }

  if (data) {
    const schema = registrySchema.parse(data);
  }
}
