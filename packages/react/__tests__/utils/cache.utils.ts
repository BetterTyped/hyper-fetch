import type {
  ResponseType,
  ResponseDetailsType,
  RequestInstance,
  ExtractResponseType,
  ExtractErrorType,
  ExtractAdapterType,
  HttpAdapterType,
  ExtractAdapterStatusType,
  ExtractAdapterExtraType,
} from "@hyper-fetch/core";
import { xhrExtra } from "@hyper-fetch/core";

export const createCacheData = <T extends RequestInstance>(
  request: T,
  response?: {
    data?: ResponseType<ExtractResponseType<T>, ExtractErrorType<T>, ExtractAdapterType<T>>;
    details?: Partial<ResponseDetailsType>;
  },
) => {
  const dataValue: ResponseType<
    ExtractResponseType<T>,
    ExtractErrorType<T>,
    ExtractAdapterType<T>
  > = response?.data || {
    data: { data: 1 } as ExtractResponseType<T>,
    error: null,
    status: 200 as unknown as ExtractAdapterStatusType<ExtractAdapterType<T>>,
    success: true,
    extra: xhrExtra as unknown as ExtractAdapterExtraType<ExtractAdapterType<T>>,
    requestTimestamp: +new Date(),
    responseTimestamp: +new Date(),
  };
  const detailsValue: ResponseDetailsType = {
    retries: 0,
    triggerTimestamp: +new Date(),
    addedTimestamp: +new Date(),
    requestTimestamp: +new Date(),
    responseTimestamp: +new Date(),
    isCanceled: false,
    isOffline: false,
    willRetry: false,
    ...response?.details,
  };

  request.client.cache.storage.set<any, any, HttpAdapterType>(request.cacheKey, {
    ...(dataValue as any),
    ...detailsValue,
    staleTime: 1000,
    version: request.client.cache.version,
    cacheTime: Infinity,
    cached: true,
  });
  return [dataValue, detailsValue] as const;
};
