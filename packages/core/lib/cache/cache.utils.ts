import { FetchCommandInstance } from "command";
import { ExtractError, ExtractFetchReturn } from "types";

export const getCacheData = <T extends FetchCommandInstance>(
  previousResponse: ExtractFetchReturn<T> | undefined,
  response: ExtractFetchReturn<T>,
  refreshError: ExtractError<T> | null,
  retryError: ExtractError<T> | null,
): ExtractFetchReturn<T> => {
  if ((retryError || refreshError) && previousResponse?.[0]) {
    return previousResponse;
  }
  return response;
};

export const stringify = (value: unknown): string => {
  try {
    if (typeof value === "string") return value;
    if (value === undefined || value === null) return "";
    const data = JSON.stringify(value);
    if (typeof data !== "string") throw new Error();
    return data;
  } catch (_) {
    return "";
  }
};

export const getRevalidateEventKey = (key: string): string => {
  return `${key}_revalidate`;
};

export const getCacheKey = (key: string): string => {
  return `${key}_cache`;
};
