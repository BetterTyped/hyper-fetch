import {
  ResponseReturnType,
  ResponseDetailsType,
  RequestInstance,
  ExtractResponseType,
  ExtractErrorType,
  ExtractAdapterType,
  BaseAdapterType,
} from "@hyper-fetch/core";

export const createCacheData = <T extends RequestInstance>(
  request: T,
  rest?: {
    data?: ResponseReturnType<ExtractResponseType<T>, ExtractErrorType<T>, ExtractAdapterType<T>>;
    details?: Partial<ResponseDetailsType>;
  },
) => {
  const dataValue = rest?.data || {
    data: { data: 1 } as ExtractResponseType<T>,
    error: null,
    status: 200,
    additionalData: {},
  };
  const detailsValue = {
    retries: 0,
    timestamp: +new Date(),
    isFailed: false,
    isCanceled: false,
    isRefreshed: false,
    isOffline: false,
    isStopped: false,
    ...rest?.details,
  };

  request.client.cache.storage.set<any, any, BaseAdapterType>(request.cacheKey, {
    data: dataValue,
    details: detailsValue,
    cacheTime: 1000,
    clearKey: request.client.cache.clearKey,
    garbageCollection: Infinity,
  });
  return [dataValue, detailsValue] as const;
};
