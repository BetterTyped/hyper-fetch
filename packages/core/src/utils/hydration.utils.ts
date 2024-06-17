import { AdapterInstance, ResponseType, parseResponse } from "adapter";
import { RequestCacheType } from "cache";
import { ClientInstance } from "client";
import { RequestInstance } from "request";
import { ExtractAdapterType, ExtractErrorType, ExtractResponseType, NegativeTypes } from "types";

export type HydrationOptions = Partial<RequestCacheType<RequestInstance>> & {
  override?: boolean;
};

export type HydrateDataType<Data = any, Error = any, Adapter extends AdapterInstance = any> = HydrationOptions & {
  cacheKey: string;
  timestamp: number;
  response: ResponseType<Data, Error, Adapter>;
};

export const serialize = <R extends RequestInstance>(
  request: R,
  /**
   * If response is not provided, it will try to get the data from the cache. For ssr make sure to provide response.
   */
  response?: ResponseType<ExtractResponseType<R>, ExtractErrorType<R>, ExtractAdapterType<R>>,
  options?: HydrationOptions,
): HydrateDataType => {
  const { cacheKey } = request;
  return {
    // Cache settings
    ...options,
    // Keys to allow for easy serialization and deserialization
    cacheKey,
    // Data to be stored
    timestamp: Date.now(),
    response: response ?? request.client.cache.get(cacheKey),
  };
};

export const hydrate = (
  client: ClientInstance,
  hydrationData: HydrateDataType[] | NegativeTypes,
  options?: Partial<HydrationOptions> | ((item: HydrateDataType) => Partial<HydrationOptions>),
) => {
  hydrationData?.forEach((item) => {
    const { cacheKey, effectKey, queueKey, endpoint, method, response, ...fallbackOptions } = item;
    const defaults = {
      cache: true,
      cacheTime: null,
      garbageCollection: null,
      override: false,
    } satisfies HydrationOptions;
    const config =
      typeof options === "function"
        ? { ...defaults, ...fallbackOptions, ...options(item) }
        : { ...defaults, ...fallbackOptions, ...options };

    if (!config.override) {
      const cachedData = client.cache.get(cacheKey);
      if (cachedData) {
        return;
      }
    }

    const parsedData = parseResponse(response);
    client.cache.set({ ...config, cacheKey, effectKey, queueKey, endpoint, method }, parsedData);
  });
};
