import { FetchCommandInstance } from "command";
import { ExtractFetchReturn } from "types";

export const getCacheData = <T extends FetchCommandInstance>(
  previousResponse: ExtractFetchReturn<T> | undefined,
  response: ExtractFetchReturn<T>,
): ExtractFetchReturn<T> => {
  const data = response[0] || previousResponse?.[0] || null;
  const error = response[1];
  const status = response[2];

  return [data, error, status];
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
