import { RequestInstance } from "request";
import { isFailedRequest } from "dispatcher";
import { ExtractAdapterReturnType } from "types";

export const getCacheData = <T extends RequestInstance>(
  previousResponse: ExtractAdapterReturnType<T> | undefined,
  response: ExtractAdapterReturnType<T>,
): ExtractAdapterReturnType<T> => {
  const { error, additionalData, status } = response;
  const isFailed = isFailedRequest(response);

  const previousData = isFailed && previousResponse ? previousResponse.data : null;
  const data = response.data || previousData;

  return { data, error, status, additionalData };
};

export const getRevalidateEventKey = (key: string): string => {
  return `${key}_revalidate`;
};

export const getCacheKey = (key: string): string => {
  return `${key}_cache`;
};

export const getCacheIdKey = (key: string): string => {
  return `${key}_cache_by_id`;
};
