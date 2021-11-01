import { CacheValueType } from "cache";
import { FetchCacheTypes } from "hooks";

export const getCacheState = (
  cacheData: CacheValueType | undefined,
  useOnMount: boolean,
  cacheTime: number,
  cacheType: FetchCacheTypes,
): CacheValueType | undefined => {
  if (useOnMount && cacheData && +cacheData.timestamp + cacheTime < +new Date()) {
    return cacheData;
  }
  return undefined;
};
