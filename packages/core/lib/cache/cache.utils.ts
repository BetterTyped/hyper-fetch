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

export const getEqualEventKey = (key: string): string => {
  return `${key}_refreshed`;
};

export const getDataKey = (key: string): string => {
  return `${key}_cache`;
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
