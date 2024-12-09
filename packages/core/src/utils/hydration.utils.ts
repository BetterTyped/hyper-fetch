import { AdapterInstance, ResponseType } from "adapter";
import { RequestCacheType } from "cache";
import { RequestInstance } from "request";
import { ExtractAdapterType, ExtractErrorType, ExtractResponseType } from "types";

export type HydrationOptions = RequestCacheType<RequestInstance> & {
  override?: boolean;
};

export type HydrateDataType<Data = any, Error = any, Adapter extends AdapterInstance = any> = HydrationOptions & {
  timestamp: number;
  response: ResponseType<Data, Error, Adapter>;
  hydrated: true;
};

export const serialize = <R extends RequestInstance>(
  request: R,
  /**
   * If response is not provided, it will try to get the data from the cache. For ssr make sure to provide response.
   */
  response: ResponseType<ExtractResponseType<R>, ExtractErrorType<R>, ExtractAdapterType<R>>,
  options?: HydrationOptions,
): HydrateDataType => {
  const { cacheKey, cache, staleTime, cacheTime } = request;
  return {
    ...options,
    cacheKey,
    cache,
    staleTime,
    cacheTime,
    timestamp: Date.now(),
    response,
    hydrated: true,
  };
};
