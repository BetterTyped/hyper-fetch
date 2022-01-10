import { CacheValueType } from "@better-typed/hyper-fetch";

export const getCacheState = (
  cacheData: CacheValueType | undefined,
  useOnMount: boolean,
  cacheTime: number,
): CacheValueType | undefined => {
  if (useOnMount && cacheData && +cacheData.timestamp + cacheTime > +new Date()) {
    return cacheData;
  }
  return undefined;
};
