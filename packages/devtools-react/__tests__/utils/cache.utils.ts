import {
  ResponseType,
  ResponseDetailsType,
  RequestInstance,
  ExtractResponseType,
  ExtractErrorType,
  ExtractAdapterType,
  AdapterType,
  xhrExtra,
} from "@hyper-fetch/core";

export const createCacheData = <T extends RequestInstance>(
  request: T,
  rest?: {
    data?: ResponseType<ExtractResponseType<T>, ExtractErrorType<T>, ExtractAdapterType<T>>;
    details?: Partial<ResponseDetailsType>;
  },
) => {
  const dataValue = rest?.data || {
    data: { data: 1 } as ExtractResponseType<T>,
    error: null,
    status: 200,
    success: true,
    extra: xhrExtra,
  };
  const detailsValue: ResponseDetailsType = {
    retries: 0,
    timestamp: +new Date(),
    isCanceled: false,
    isOffline: false,
    ...rest?.details,
  };

  request.client.cache.storage.set<any, any, AdapterType>(request.cacheKey, {
    ...dataValue,
    ...detailsValue,
    cacheTime: 1000,
    clearKey: request.client.cache.clearKey,
    garbageCollection: Infinity,
  });
  return [dataValue, detailsValue] as const;
};
