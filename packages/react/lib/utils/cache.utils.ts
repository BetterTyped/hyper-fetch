import {
  CacheValueType,
  ExtractFetchReturn,
  ExtractResponse,
  ExtractError,
  NullableType,
  FetchCommandInstance,
} from "@better-typed/hyper-fetch";
import { getDetailsState } from "./use-dependent-state";

export const getCacheInitialData = <T extends FetchCommandInstance>(
  command: T,
  response: NullableType<ExtractFetchReturn<T>>,
): CacheValueType<ExtractResponse<T>, ExtractError<T>> | null => {
  if (!response) {
    return null;
  }

  return {
    data: response,
    details: getDetailsState(command),
    refreshError: null,
    retryError: null,
  };
};

export const getFreshCacheState = (
  cacheData: CacheValueType | undefined,
  useOnMount: boolean,
  cacheTime?: number,
): CacheValueType | undefined => {
  if (useOnMount && cacheData && cacheTime && +cacheData.details.timestamp + cacheTime > +new Date()) {
    return cacheData;
  }
  return undefined;
};

export const isStaleCacheData = (cacheTime: NullableType<number>, timestamp: NullableType<Date | number>) => {
  if (!timestamp) return true;
  if (!cacheTime) return false;
  return +new Date() > +timestamp + cacheTime;
};
