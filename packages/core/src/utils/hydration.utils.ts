import { ResponseReturnType, parseResponse } from "adapter";
import { RequestCacheType } from "cache";
import { ClientInstance } from "client";
import { RequestInstance } from "request";
import { ExtractAdapterType, ExtractErrorType, ExtractResponseType, NegativeTypes } from "types";

export type HydrationOptions = Partial<RequestCacheType<RequestInstance>> & {
  override?: boolean;
};

export type HydrateDataType<Data> = HydrationOptions & {
  cacheKey: string;
  timestamp: number;
  data: Data;
};

export const serialize = <R extends RequestInstance>(
  request: R,
  /**
   * If response is not provided, it will try to get the data from the cache. For ssr make sure to provide response.
   */
  response?: ResponseReturnType<ExtractResponseType<R>, ExtractErrorType<R>, ExtractAdapterType<R>>,
  options?: HydrationOptions,
): HydrateDataType<string> => {
  const { cacheKey } = request;
  const data = response ?? request.client.cache.get(cacheKey);
  return {
    // Cache settings
    ...options,
    // Keys to allow for easy serialization and deserialization
    cacheKey,
    // Data to be stored
    timestamp: Date.now(),
    data: JSON.stringify(data),
  };
};

export const hydrate = (
  client: ClientInstance,
  fallbacks: HydrateDataType<string>[] | NegativeTypes,
  options?: Partial<HydrationOptions> | ((fallback: HydrateDataType<string>) => Partial<HydrationOptions>),
) => {
  fallbacks?.forEach((fallback) => {
    const { cacheKey, data, ...fallbackOptions } = fallback;
    const defaults = {
      cache: true,
      cacheTime: null,
      garbageCollection: null,
      override: false,
    } satisfies HydrationOptions;
    const config =
      typeof options === "function"
        ? { ...defaults, ...fallbackOptions, ...options(fallback) }
        : { ...defaults, ...fallbackOptions, ...options };

    if (!config.override) {
      const cachedData = client.cache.get(cacheKey);
      if (cachedData) {
        return;
      }
    }

    const parsedData = parseResponse(data);
    client.cache.set({ ...config, cacheKey }, parsedData);
  });
};
