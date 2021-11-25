import { FetchMiddlewareInstance } from "middleware";
import { ExtractError, ExtractFetchReturn } from "types";

export const getCacheData = <T extends FetchMiddlewareInstance>(
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
    return JSON.stringify(value);
  } catch (_) {
    return "";
  }
};

export const getRevalidateKey = (key: string): string => {
  return `${key}_revalidate`;
};

/**
 * Cache instance for individual middleware that collects individual requests responses from
 * the same endpoint (they may differ base on the custom key, endpoint params etc)
 * @param fetchMiddleware
 * @returns
 */
export const getCacheInstanceKey = (fetchMiddleware: FetchMiddlewareInstance, customCacheKey?: string): string => {
  return customCacheKey || `${fetchMiddleware.method}_${fetchMiddleware.apiConfig.endpoint}`;
};

/**
 * Individual request cache that is packed with the group of cached responses from the same endpoint instance
 * @param fetchMiddleware
 * @param customCacheKey
 * @returns
 */
export const getCacheKey = (fetchMiddleware: FetchMiddlewareInstance, customCacheKey = ""): string => {
  /**
   * Below stringified values allow to match the response family *paste random Vin Diesel meme here*
   * That's because we have shared endpoint, but data with queryParams '?user=1' will not match regular request without queries.
   * We want both results to be cached in separate places to not override each other.
   *
   * Values to be stringified:
   *
   * endpoint: string;
   * queryParams: string;
   * params: string;
   */

  let cacheKey = customCacheKey;

  if (!customCacheKey) {
    const methodKey = stringify(fetchMiddleware.method);
    const endpointKey = stringify(fetchMiddleware.endpoint);
    const queryParamsKey = stringify(fetchMiddleware.queryParams);
    const paramsKey = stringify(fetchMiddleware.params);

    cacheKey = `${methodKey}_${endpointKey}_${queryParamsKey}_${paramsKey}`;
  }

  return cacheKey;
};

// Deep compare

export const isEmpty = (value: any): boolean => {
  if (!value) return true;

  if (Array.isArray(value)) return !value.length;

  if (typeof value === "object") return !Object.keys(value).length;

  return false;
};

export const deepCompare = (firstValue: any, secondValue: any): boolean => {
  const firstValueType = Object.prototype.toString.call(firstValue);
  const secondValueType = Object.prototype.toString.call(secondValue);

  if (firstValueType !== secondValueType) return false;

  if (typeof firstValue === "function") return `${firstValue}` === `${secondValue}`;

  // null, undefined, string, number, bool, NaN
  if (firstValueType !== "[object Object]" && firstValueType !== "[object Array]") {
    if (firstValueType === "[object Number]" && Number.isNaN(firstValue) && Number.isNaN(secondValue)) return true;
    return firstValue === secondValue;
  }

  if (Array.isArray(firstValue) && Array.isArray(secondValue)) {
    if (firstValue.length !== secondValue.length) return false;

    if (!firstValue.length && !secondValue.length) return true;

    return firstValue.every((firstValueEl, i) => deepCompare(firstValueEl, secondValue[i]));
  }

  if (isEmpty(firstValue) && isEmpty(secondValue)) return true;
  if (Object.keys(firstValue).length !== Object.keys(secondValue).length) return false;

  return Object.entries(firstValue).every(
    ([key, value]) => Object.prototype.hasOwnProperty.call(secondValue, key) && deepCompare(value, secondValue[key]),
  );
};
