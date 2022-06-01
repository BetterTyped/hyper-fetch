import {
  ClientResponseType,
  CommandResponseDetails,
  FetchCommandInstance,
  ExtractResponse,
  ExtractError,
} from "@better-typed/hyper-fetch";

export const createCacheData = <T extends FetchCommandInstance>(
  command: T,
  rest?: {
    data?: ClientResponseType<ExtractResponse<T>, ExtractError<T>>;
    details?: CommandResponseDetails;
  },
) => {
  const dataValue = rest?.data || [{ data: 1 } as ExtractResponse<T>, null, 200];
  const detailsValue = rest?.details || {
    retries: 0,
    timestamp: new Date(),
    isFailed: false,
    isCanceled: false,
    isRefreshed: false,
    isOffline: false,
    isStopped: false,
  };

  command.builder.cache.storage.set(command.cacheKey, { data: dataValue, details: detailsValue });
  return dataValue;
};
