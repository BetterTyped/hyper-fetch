import {
  ClientResponseType,
  CommandResponseDetails,
  CommandInstance,
  ExtractResponse,
  ExtractError,
} from "@hyper-fetch/core";

export const createCacheData = <T extends CommandInstance>(
  command: T,
  rest?: {
    data?: ClientResponseType<ExtractResponse<T>, ExtractError<T>>;
    details?: Partial<CommandResponseDetails>;
  },
) => {
  const dataValue = rest?.data || [{ data: 1 } as ExtractResponse<T>, null, 200];
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

  command.builder.cache.storage.set(command.cacheKey, {
    data: dataValue,
    details: detailsValue,
    cacheTime: 1000,
    clearKey: command.builder.cache.clearKey,
  });
  return [dataValue, detailsValue] as const;
};
