import {
  CacheValueType,
  NullableType,
  RequestInstance,
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
  initialData: NullableType<Partial<ExtractAdapterReturnType<T>>>,
  cacheData: NullableType<CacheValueType<ExtractResponseType<T>, ExtractErrorType<T>, ExtractAdapterType<T>>>,
): CacheValueType<ExtractResponseType<T>, ExtractErrorType<T>, ExtractAdapterType<T>> | null => {
  const isStale = isStaleCacheData(request.cacheTime, cacheData?.timestamp);

  if (!isStale && cacheData) {
    return cacheData;
  }

  if (initialData) {
    return {
      data: null,
      error: null,
      status: null,
      success: null,
      extra: null,
      ...((initialData || {}) as Partial<ExtractAdapterReturnType<T>>),
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
  initialData: NullableType<Partial<ExtractAdapterReturnType<T>>>,
  dispatcher: Dispatcher,
  request: T,
): UseTrackedStateType<T> => {
  const { client, cacheKey, responseMapper } = request;
  const { cache } = client;

  const cacheData = cache.get<ExtractResponseType<T>, ExtractErrorType<T>, ExtractAdapterType<T>>(cacheKey);
  const cacheState = getValidCacheData<T>(request, initialData, cacheData);
  const initialLoading = dispatcher.hasRunningRequests(request.queueKey);

  if (cacheState) {
    const mappedData = responseMapper ? responseMapper(cacheState) : cacheState;
    if (mappedData instanceof Promise) {
      // For the async mapper we cannot return async values
      // So we have return the initial state instead
      return initialState;
    }
    return {
      data: mappedData.data,
      error: mappedData.error,
      status: mappedData.status,
      success: mappedData.success,
      extra: mappedData.extra,
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
    extra: request.client.defaultExtra as unknown as ExtractAdapterExtraType<ExtractAdapterType<T>>,
    retries: initialState.retries,
    timestamp: getTimestamp(initialState.timestamp),
    loading: initialLoading,
  };
};
