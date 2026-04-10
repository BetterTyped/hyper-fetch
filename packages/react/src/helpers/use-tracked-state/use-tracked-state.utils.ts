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
  ResponseType,
  scopeKey,
} from "@hyper-fetch/core";

import { initialState, UseTrackedStateType } from "helpers";

/**
 * Extracts the "identity" portion of a cache key (method + endpoint with resolved params),
 * stripping the query params part. Cache keys follow the format: `method_endpoint_queryParams`.
 */
const getCacheKeyIdentity = (cacheKey: string): string => {
  const lastUnderscoreIndex = cacheKey.lastIndexOf("_");
  if (lastUnderscoreIndex === -1) return cacheKey;
  return cacheKey.substring(0, lastUnderscoreIndex);
};

/**
 * Determines whether state should be cleared when the cache key changes.
 *
 * - `"clean"` — always clear
 * - `"preserve"` — never clear
 * - `"auto"` — clear when the resource identity changed (URL params), preserve when only query params changed
 */
export const getShouldClearState = (
  mode: "auto" | "preserve" | "clean",
  oldCacheKey: string,
  newCacheKey: string,
): boolean => {
  if (oldCacheKey === newCacheKey) return false;

  if (mode === "clean") return true;
  if (mode === "preserve") return false;

  // "auto" — compare the identity part (method + endpoint with params)
  return getCacheKeyIdentity(oldCacheKey) !== getCacheKeyIdentity(newCacheKey);
};

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

export const isStaleCacheData = (staleTime: number, staleTimestamp: NullableType<Date | number>) => {
  if (!staleTimestamp) return true;
  return +new Date() > +staleTimestamp + staleTime;
};

export const getValidCacheData = <T extends RequestInstance>(
  request: T,
  initialResponse: NullableType<Partial<ExtractAdapterResolvedType<T>>>,
  cacheData: NullableType<CacheValueType<ExtractResponseType<T>, ExtractErrorType<T>, ExtractAdapterType<T>>>,
): CacheValueType<ExtractResponseType<T>, ExtractErrorType<T>, ExtractAdapterType<T>> | null => {
  const isStale = isStaleCacheData(request.staleTime, cacheData?.responseTimestamp);

  if (!isStale && cacheData) {
    return cacheData;
  }

  if (initialResponse) {
    return {
      data: null,
      error: null,
      status: null,
      success: true,
      extra: null,
      cached: !!request.cache,
      ...(initialResponse as Partial<ExtractAdapterResolvedType<T>>),
      ...getDetailsState(),
      staleTime: 1000,
      version: request.client.cache.version,
      cacheKey: request.cacheKey,
      cacheTime: request.cacheTime,
      requestTimestamp: initialResponse?.requestTimestamp ?? +new Date(),
      responseTimestamp: initialResponse?.responseTimestamp ?? +new Date(),
    };
  }

  return null;
};

export const getTimestamp = (timestamp?: NullableType<number | Date>) => {
  return timestamp ? new Date(timestamp) : null;
};

export const getIsInitiallyLoading = <T extends RequestInstance>({
  queryKey,
  dispatcher,
  hasState,
  revalidate,
  disabled,
}: {
  queryKey: string;
  dispatcher: Dispatcher<ExtractAdapterType<T>>;
  hasState: boolean;
  revalidate?: boolean;
  disabled?: boolean;
}) => {
  if (!revalidate && hasState) {
    return false;
  }

  const queue = dispatcher.getQueue(queryKey);
  const isInitiallyLoading = dispatcher.hasRunningRequests(queryKey) || (!queue.stopped && disabled === false);

  return isInitiallyLoading;
};

export const getInitialState = <T extends RequestInstance>({
  initialResponse,
  dispatcher,
  request,
  disabled,
  revalidate,
}: {
  initialResponse: NullableType<Partial<ExtractAdapterResolvedType<T>>>;
  dispatcher: Dispatcher<ExtractAdapterType<T>>;
  request: T;
  disabled?: boolean; // useFetch only
  revalidate?: boolean; // useFetch only
}): UseTrackedStateType<T> => {
  const { client, cacheKey, unstable_responseMapper } = request;
  const { cache } = client;

  const cacheData = cache.get<ExtractResponseType<T>, ExtractErrorType<T>>(cacheKey);
  const cacheState = getValidCacheData<T>(request, initialResponse, cacheData);

  const initialLoading = getIsInitiallyLoading({
    queryKey: scopeKey(request.queryKey, request.scope),
    dispatcher,
    disabled,
    revalidate,
    hasState: !!cacheState,
  });

  if (cacheState) {
    const mappedData = unstable_responseMapper
      ? unstable_responseMapper(cacheState as ResponseType<any, any, ExtractAdapterType<T>>)
      : cacheState;
    if (mappedData instanceof Promise) {
      // For the async mapper we cannot return async values
      // So we have return the initial state instead
      return initialState;
    }
    return {
      data: mappedData.data,
      error: mappedData.error,
      status: mappedData.status as ExtractAdapterStatusType<ExtractAdapterType<T>>,
      success: mappedData.success,
      extra: (mappedData.extra || client.adapter.defaultExtra) as ExtractAdapterExtraType<ExtractAdapterType<T>>,
      retries: cacheState.retries,
      requestTimestamp: getTimestamp(cacheState.requestTimestamp),
      responseTimestamp: getTimestamp(cacheState.responseTimestamp),
      loading: initialLoading,
    };
  }

  return {
    data: initialState.data,
    error: initialState.error,
    status: initialState.status as ExtractAdapterStatusType<ExtractAdapterType<T>>,
    success: initialState.success,
    extra: request.client.adapter.defaultExtra as ExtractAdapterExtraType<ExtractAdapterType<T>>,
    retries: initialState.retries,
    requestTimestamp: getTimestamp(initialState.requestTimestamp),
    responseTimestamp: getTimestamp(initialState.responseTimestamp),
    loading: initialLoading,
  };
};
