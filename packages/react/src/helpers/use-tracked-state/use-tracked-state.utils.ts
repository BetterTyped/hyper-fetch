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
  ExtractAdapterAdditionalDataType,
} from "@hyper-fetch/core";

import { initialState, UseTrackedStateType } from "helpers";

export const getDetailsState = (
  state?: UseTrackedStateType<RequestInstance>,
  details?: Partial<CacheValueType<unknown, unknown>["details"]>,
): CacheValueType<unknown, unknown>["details"] => {
  return {
    retries: state?.retries || 0,
    timestamp: +new Date(),
    isSuccess: true,
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
  const isStale = isStaleCacheData(request.cacheTime, cacheData?.details.timestamp);

  if (!isStale && cacheData) {
    return cacheData;
  }

  if (initialData) {
    return {
      data: initialData,
      details: getDetailsState(),
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
    ExtractAdapterAdditionalDataType<ExtractAdapterType<T>>
  >(cacheKey);
  const cacheState = getValidCacheData<T>(request, initialData, cacheData);
  const initialLoading = dispatcher.hasRunningRequests(request.queueKey);

  return {
    data: cacheState?.data.data ?? initialState.data,
    error: cacheState?.data.error ?? initialState.error,
    status: cacheState?.data.status ?? initialState.status,
    isSuccess: cacheState?.data.isSuccess ?? initialState.isSuccess,
    additionalData: cacheState?.data.additionalData ?? request.client.defaultAdditionalData,
    retries: cacheState?.details.retries ?? initialState.retries,
    timestamp: getTimestamp(cacheState?.details.timestamp ?? initialState.timestamp),
    loading: initialLoading,
  };
};
