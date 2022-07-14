import { CommandInstance } from "command";
import { isFailedRequest } from "dispatcher";
import { ExtractClientReturnType } from "types";

export const getCacheData = <T extends CommandInstance>(
  previousResponse: ExtractClientReturnType<T> | undefined,
  response: ExtractClientReturnType<T>,
): ExtractClientReturnType<T> => {
  const isFailed = isFailedRequest(response);

  const previousData = isFailed && previousResponse ? previousResponse[0] : null;
  const data = response[0] || previousData;
  const error = response[1];
  const status = response[2];

  return [data, error, status];
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
