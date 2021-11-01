import { FetchMiddlewareInstance } from "middleware";

export const stringify = (value: unknown): string => {
  try {
    if (typeof value === "string") return value;
    if (value === undefined || value === null) return "";
    return JSON.stringify(value);
  } catch (_) {
    return "";
  }
};

export const getCacheKey = (fetchMiddleware: FetchMiddlewareInstance, customCacheKey: string | undefined): string => {
  /**
   * Bellow stringified values allow to match the response family *random Vin Diesel meme*
   * That's because we have shared endpoint, but data with queryParams '?user=1' will not match regular request without queries.
   * We want both results to be cached in separate places to not override each other.
   *
   * Values to be stringified:
   *
   * endpoint: string;
   * queryParams: string;
   * params: string;
   * data: string;
   */

  let cacheKey = customCacheKey || "";

  if (!customCacheKey) {
    const endpointKey = stringify(fetchMiddleware.endpoint);
    const queryParamsKey = stringify(fetchMiddleware.queryParams);
    const paramsKey = stringify(fetchMiddleware.params);
    const dataKey = stringify(fetchMiddleware.data);

    cacheKey = endpointKey + queryParamsKey + paramsKey + dataKey;
  }

  return cacheKey;
};

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
