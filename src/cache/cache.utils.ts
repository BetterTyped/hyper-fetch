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

export const getRevalidateKey = (key: string): string => {
  return `${key}_revalidate`;
};

/**
 * Cache instance for individual command that collects individual requests responses from
 * the same endpoint (they may differ base on the custom key, endpoint params etc)
 * @param fetchCommand
 * @returns
 */
export const getCacheEndpointKey = (fetchCommand: FetchCommandInstance, customCacheKey?: string): string => {
  return customCacheKey || `${fetchCommand.method}_${fetchCommand.commandOptions.endpoint}`;
};

/**
 * Individual request cache that is packed with the group of cached responses from the same endpoint instance
 * @param fetchCommand
 * @param customCacheKey
 * @returns
 */
export const getCacheKey = (fetchCommand: FetchCommandInstance, customCacheKey = ""): string => {
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
    const methodKey = stringify(fetchCommand.method);
    const endpointKey = stringify(fetchCommand.endpoint);
    const queryParamsKey = stringify(fetchCommand.queryParams);
    const paramsKey = stringify(fetchCommand.params);

    cacheKey = `${methodKey}_${endpointKey}_${queryParamsKey}_${paramsKey}`;
  }

  return cacheKey;
};

// Deep compare
export const isEmpty = (value: unknown): boolean => {
  const valueType = Object.prototype.toString.call(value);
  if (Array.isArray(value)) return !value.length;
  if (typeof value === "object" && value !== null && valueType === "[object Object]") return !Object.keys(value).length;
  return false;
};

/**
 * Allow to deep compare any values passed from response
 * @param firstValue unknown
 * @param secondValue unknown
 * @returns true when elements are equal
 */
export const isEqual = (firstValue: unknown, secondValue: unknown): boolean => {
  const firstValueType = Object.prototype.toString.call(firstValue);
  const secondValueType = Object.prototype.toString.call(secondValue);

  const firstType = typeof firstValue;
  const secondType = typeof secondValue;

  const isType = (type: unknown) => firstType === type && secondType === type;
  const isTypeValue = (type: unknown) => firstValueType === type && secondValueType === type;

  // Compared types are different
  if (firstValueType !== secondValueType) return false;

  // Null
  if (firstValue === null && secondValue === null) return true;

  // NaN
  if (isType("number") && Number.isNaN(firstValue) && Number.isNaN(secondValue)) return true;

  // Empty Array or Object
  if (isEmpty(firstValue) && isEmpty(secondValue)) return true;

  // Array
  if (Array.isArray(firstValue) && Array.isArray(secondValue)) {
    if (firstValue.length !== secondValue.length) return false;

    return !firstValue.some((element, i) => !isEqual(element, secondValue[i]));
  }

  // Object
  if (isType("object") && isTypeValue("[object Object]")) {
    if (Object.keys(firstValue as object).length !== Object.keys(secondValue as object).length) return false;

    return !Object.entries(firstValue as object).some(
      ([key, value]) => !isEqual(value, (secondValue as Record<string, unknown>)[key]),
    );
  }

  // Date
  if (firstValue instanceof Date && secondValue instanceof Date) {
    return +firstValue === +secondValue;
  }

  // undefined, string, number, bool
  return firstValue === secondValue;
};
