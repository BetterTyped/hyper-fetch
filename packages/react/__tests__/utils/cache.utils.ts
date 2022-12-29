import {
  ResponseType,
  ResponseDetailsType,
  RequestInstance,
  ExtractResponseType,
  ExtractErrorType,
} from "@hyper-fetch/core";

export const createCacheData = <T extends RequestInstance>(
  request: T,
  rest?: {
    data?: ResponseType<ExtractResponseType<T>, ExtractErrorType<T>>;
    details?: Partial<ResponseDetailsType>;
  },
) => {
  const dataValue = rest?.data || [{ data: 1 } as ExtractResponseType<T>, null, 200];
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

  request.client.cache.storage.set(request.cacheKey, {
    data: dataValue,
    details: detailsValue,
    cacheTime: 1000,
    clearKey: request.client.cache.clearKey,
  });
  return [dataValue, detailsValue] as const;
};
