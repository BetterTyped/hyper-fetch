/* eslint-disable @typescript-eslint/naming-convention */
import {
  CacheValueType,
  NullableType,
  RequestInstance,
  ExtractResponseType,
  ExtractErrorType,
  ExtractAdapterResolvedType,
  Dispatcher,
  ExtractAdapterType,
  ExtractAdapterExtraType,
  ResponseDetailsType,
  ExtractAdapterStatusType,
} from "@hyper-fetch/core";

import { initialState, UseTrackedStateType } from "helpers";

export const getDetailsState = (
  state?: UseTrackedStateType<RequestInstance>,
  details?: Partial<ResponseDetailsType>,
): ResponseDetailsType => {
  return {
    retries: state?.retries || 0,
    isCanceled: false,
    isOffline: false,
    addedTimestamp: +new Date(),
    triggerTimestamp: +new Date(),
    requestTimestamp: +new Date(),
    responseTimestamp: +new Date(),
    ...details,
  };
};

export const isStaleCacheData = (cacheTime: number, cacheTimestamp: NullableType<Date | number>) => {
  if (!cacheTimestamp) return true;
  return +new Date() > +cacheTimestamp + cacheTime;
};

export const getValidCacheData = <T extends RequestInstance>(
  request: T,
  initialData: NullableType<Partial<ExtractAdapterResolvedType<T>>>,
  cacheData: NullableType<CacheValueType<ExtractResponseType<T>, ExtractErrorType<T>, ExtractAdapterType<T>>>,
): CacheValueType<ExtractResponseType<T>, ExtractErrorType<T>, ExtractAdapterType<T>> | null => {
  const isStale = isStaleCacheData(request.cacheTime, cacheData?.responseTimestamp);

  if (!isStale && cacheData) {
    return cacheData;
  }

  if (initialData) {
    return {
      data: null,
      error: null,
      status: null,
      success: true,
      extra: null,
      ...((initialData || {}) as Partial<ExtractAdapterResolvedType<T>>),
      ...getDetailsState(),
      cacheTime: 1000,
      version: request.client.cache.version,
      cacheKey: request.cacheKey,
      garbageCollection: request.garbageCollection,
      requestTimestamp: initialData?.requestTimestamp ?? +new Date(),
      responseTimestamp: initialData?.responseTimestamp ?? +new Date(),
    };
  }

  return null;
};

export const getTimestamp = (timestamp?: NullableType<number | Date>) => {
  return timestamp ? new Date(timestamp) : null;
};

export const getInitialState = <T extends RequestInstance>(
  initialData: NullableType<Partial<ExtractAdapterResolvedType<T>>>,
  dispatcher: Dispatcher,
  request: T,
): UseTrackedStateType<T> => {
  const { client, cacheKey, __responseMapper } = request;
  const { cache } = client;

  const cacheData = cache.get<ExtractResponseType<T>, ExtractErrorType<T>, ExtractAdapterType<T>>(cacheKey);
  const cacheState = getValidCacheData<T>(request, initialData, cacheData);
  const initialLoading = dispatcher.hasRunningRequests(request.queryKey);

  if (cacheState) {
    const mappedData = __responseMapper ? __responseMapper(cacheState) : cacheState;
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
      extra: (mappedData.extra || client.defaultExtra) as ExtractAdapterExtraType<ExtractAdapterType<T>>,
      retries: cacheState.retries,
      timestamp: getTimestamp(cacheState.responseTimestamp),
      loading: initialLoading,
    };
  }

  return {
    data: initialState.data,
    error: initialState.error,
    status: initialState.status as ExtractAdapterStatusType<ExtractAdapterType<T>>,
    success: initialState.success,
    extra: request.client.defaultExtra as ExtractAdapterExtraType<ExtractAdapterType<T>>,
    retries: initialState.retries,
    timestamp: getTimestamp(initialState.timestamp),
    loading: initialLoading,
  };
};
