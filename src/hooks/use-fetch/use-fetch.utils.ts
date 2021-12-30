import { CacheValueType } from "cache";
import { ExtractFetchReturn, ExtractResponse, ExtractError, NullableType } from "types";
import { FetchCommandInstance } from "command";

export const getCacheState = (
  cacheData: CacheValueType | undefined,
  useOnMount: boolean,
  cacheTime?: number,
): CacheValueType | undefined => {
  if (useOnMount && cacheData && cacheTime && +cacheData.timestamp + cacheTime > +new Date()) {
    return cacheData;
  }
  return undefined;
};

export const getUseFetchInitialData = <T extends FetchCommandInstance>(
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

export const isStaleCacheData = (cacheTime: NullableType<number>, timestamp: NullableType<Date | number>) => {
  if (!timestamp) return true;
  if (!cacheTime) return false;
  return +new Date() > +timestamp + cacheTime;
};
