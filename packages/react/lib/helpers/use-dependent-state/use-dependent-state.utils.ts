import {
  CacheValueType,
  NullableType,
  CommandInstance,
  ClientResponseType,
  ExtractResponse,
  ExtractError,
  ExtractFetchReturn,
} from "@better-typed/hyper-fetch";

import { initialState, UseDependentStateType } from "helpers";

export const getDetailsState = (
  state?: UseDependentStateType,
  details?: Partial<CacheValueType<unknown, unknown>["details"]>,
): CacheValueType<unknown, unknown>["details"] => {
  return {
    retries: state?.retries || 0,
    timestamp: new Date(),
    isFailed: false,
    isCanceled: false,
    isOffline: false,
    ...details,
  };
};

export const isStaleCacheData = (cacheTime: NullableType<number>, cacheTimestamp: NullableType<Date | number>) => {
  if (!cacheTimestamp) return true;
  if (!cacheTime) return false;
  return +new Date() > +cacheTimestamp + cacheTime;
};

export const getValidCacheData = <T extends CommandInstance>(
  command: T,
  initialData: NullableType<ExtractFetchReturn<T>>,
  cacheData: NullableType<CacheValueType<ExtractResponse<T>, ExtractError<T>>>,
): CacheValueType<ExtractResponse<T>, ExtractError<T>> | null => {
  const isStale = isStaleCacheData(command.cacheTime, cacheData?.details.timestamp);

  if (!isStale && cacheData) {
    return cacheData;
  }

  if (initialData) {
    return {
      data: initialData,
      details: getDetailsState(),
    };
  }

  return null;
};

export const getTimestamp = (timestamp?: NullableType<number | Date>) => {
  return timestamp ? new Date(timestamp) : null;
};

export const getInitialState = (
  initialData: NullableType<CacheValueType>,
  initialLoading?: boolean,
): UseDependentStateType<any, any> => ({
  ...initialState,
  data: initialData?.data?.[0] || initialState.data,
  error: initialData?.data?.[1] || initialState.error,
  status: initialData?.data?.[2] || initialState.status,
  retries: initialData?.details.retries || initialState.retries,
  timestamp: getTimestamp(initialData?.details.timestamp || initialState.timestamp),
  loading: initialLoading ?? initialState.loading,
});

export const responseToCacheValue = <T>(
  response: ClientResponseType<ExtractResponse<T>, ExtractError<T>> | null,
): NullableType<CacheValueType> => {
  if (!response) return null;
  return {
    data: response,
    details: getDetailsState(),
  };
};
