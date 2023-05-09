import {
  CacheValueType,
  NullableType,
  RequestInstance,
  ResponseReturnType,
  ExtractResponseType,
  ExtractErrorType,
  ExtractAdapterReturnType,
  Dispatcher,
  ExtractAdapterType,
  ExtractAdapterExtraType,
  ResponseDetailsType,
} from "@hyper-fetch/core";

import { initialState, UseTrackedStateType } from "helpers";

export const getDetailsState = (
  state?: UseTrackedStateType<RequestInstance>,
  details?: Partial<ResponseDetailsType>,
): ResponseDetailsType => {
  return {
    retries: state?.retries || 0,
    timestamp: +new Date(),
    isCanceled: false,
    isOffline: false,
    ...details,
  };
};

export const isStaleCacheData = (cacheTime: number, cacheTimestamp: NullableType<Date | number>) => {
  if (!cacheTimestamp) return true;
  return +new Date() > +cacheTimestamp + cacheTime;
};

export const getValidCacheData = <T extends RequestInstance>(
  request: T,
  initialData: NullableType<ExtractAdapterReturnType<T>>,
  cacheData: NullableType<CacheValueType<ExtractResponseType<T>, ExtractErrorType<T>>>,
): CacheValueType<ExtractResponseType<T>, ExtractErrorType<T>> | null => {
  const isStale = isStaleCacheData(request.cacheTime, cacheData?.timestamp);

  if (!isStale && cacheData) {
    return cacheData;
  }

  if (initialData) {
    return {
      ...initialData,
      ...getDetailsState(),
      cacheTime: 1000,
      clearKey: request.client.cache.clearKey,
      garbageCollection: request.garbageCollection,
    };
  }

  return null;
};

export const getTimestamp = (timestamp?: NullableType<number | Date>) => {
  return timestamp ? new Date(timestamp) : null;
};

export const getInitialState = <T extends RequestInstance>(
  initialData: ResponseReturnType<ExtractResponseType<T>, ExtractErrorType<T>, ExtractAdapterType<T>> | null,
  dispatcher: Dispatcher,
  request: T,
): UseTrackedStateType<T> => {
  const { client, cacheKey } = request;
  const { cache } = client;

  const cacheData = cache.get<
    ExtractResponseType<T>,
    ExtractErrorType<T>,
    ExtractAdapterExtraType<ExtractAdapterType<T>>
  >(cacheKey);
  const cacheState = getValidCacheData<T>(request, initialData, cacheData);
  const initialLoading = dispatcher.hasRunningRequests(request.queueKey);

  if (cacheState) {
    return {
      data: cacheState.data,
      error: cacheState.error,
      status: cacheState.status,
      success: cacheState.success,
      extra: cacheState.extra,
      retries: cacheState.retries,
      timestamp: getTimestamp(cacheState.timestamp),
      loading: initialLoading,
    };
  }

  return {
    data: initialState.data,
    error: initialState.error,
    status: initialState.status,
    success: initialState.success,
    extra: request.client.defaultExtra,
    retries: initialState.retries,
    timestamp: getTimestamp(initialState.timestamp),
    loading: initialLoading,
  };
};
