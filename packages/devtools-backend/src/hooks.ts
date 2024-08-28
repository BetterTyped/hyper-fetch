import { ClientInstance } from "@hyper-fetch/core";

import { DevtoolsCacheEvent } from "./devtools.types";

export const handleCacheChange = (client: ClientInstance) => {
  const cacheKeys = [...client.cache.storage.keys()];

  const cacheItems = cacheKeys
    .map((key) => {
      const data = client.cache.get(key);

      return {
        cacheKey: key,
        cacheData: data,
      };
    })
    .filter(({ cacheData }) => !!cacheData) as DevtoolsCacheEvent[];

  return cacheItems;
};
