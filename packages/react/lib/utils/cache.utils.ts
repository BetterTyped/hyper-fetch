import {
  CacheValueType,
  ExtractFetchReturn,
  ExtractResponse,
  ExtractError,
  NullableType,
  FetchCommandInstance,
} from "@better-typed/hyper-fetch";

export const getCacheInitialData = <T extends FetchCommandInstance>(
  response: NullableType<ExtractFetchReturn<T>>,
): CacheValueType<ExtractResponse<T>, ExtractError<T>> | null => {
  if (!response) {
    return null;
  }

  return {
    response,
    retries: 0,
    timestamp: +new Date(),
    isRefreshed: false,
  };
};

export const getFreshCacheState = (
  cacheData: CacheValueType | undefined,
  useOnMount: boolean,
  cacheTime?: number,
): CacheValueType | undefined => {
  if (useOnMount && cacheData && cacheTime && +cacheData.timestamp + cacheTime > +new Date()) {
    return cacheData;
  }
  return undefined;
};

export const isStaleCacheData = (cacheTime: NullableType<number>, timestamp: NullableType<Date | number>) => {
  if (!timestamp) return true;
  if (!cacheTime) return false;
  return +new Date() > +timestamp + cacheTime;
};
