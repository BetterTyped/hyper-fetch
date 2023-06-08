import { ResponseDetailsType } from "managers";
import { RequestInstance } from "request";
import { ExtractAdapterReturnType } from "types";

export const getCacheData = <T extends RequestInstance>(
  previousResponse: ExtractAdapterReturnType<T> | undefined,
  response: ExtractAdapterReturnType<T> & ResponseDetailsType,
): ExtractAdapterReturnType<T> & ResponseDetailsType => {
  const { data, success } = response;

  const previousData = !success && previousResponse ? previousResponse.data : null;
  const computedData = data || previousData;

  return { ...response, data: computedData };
};

export const getInvalidateEventKey = (key: string): string => {
  return `${key}_invalidate`;
};

export const getCacheKey = (key: string): string => {
  return `${key}_cache`;
};

export const getCacheIdKey = (key: string): string => {
  return `${key}_cache_by_id`;
};
