import { ResponseDetailsType } from "managers";
import { RequestInstance } from "request";
import { ExtractAdapterResolvedType } from "types";

export const getCacheData = <T extends RequestInstance>(
  previousResponse: ExtractAdapterResolvedType<T> | undefined,
  response: ExtractAdapterResolvedType<T> & ResponseDetailsType,
): ExtractAdapterResolvedType<T> & ResponseDetailsType => {
  const { data, success } = response;

  const previousData = !success && previousResponse ? previousResponse.data : null;
  const computedData = data || previousData;

  return { ...response, data: computedData };
};

export const getInvalidateByKey = (key: string): string => {
  return `${key}_invalidate`;
};
export const getInvalidateKey = (): string => {
  return `invalidate`;
};
export const getCacheByKey = (key: string): string => {
  return `${key}_cache`;
};
export const getCacheKey = (): string => {
  return `cache`;
};
