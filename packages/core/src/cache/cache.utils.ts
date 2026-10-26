import type { ResponseDetailsType } from "managers";
import type { RequestInstance } from "request";
import type { ExtractAdapterResolvedType } from "types";

export const getCacheData = <T extends RequestInstance>(
  previousResponse: ExtractAdapterResolvedType<T> | undefined,
  response: ExtractAdapterResolvedType<T> & ResponseDetailsType,
): ExtractAdapterResolvedType<T> & ResponseDetailsType => {
  const { data, success } = response;

  const previousData = !success && previousResponse ? previousResponse.data : null;
  const computedData = data || previousData;

  return { ...response, data: computedData };
};

export const getInvalidateKey = (): string => {
  return `invalidate`;
};
export const getInvalidateByKey = (key: string): string => {
  return `${key}_invalidate`;
};
export const getDeleteKey = (): string => {
  return `delete`;
};
export const getDeleteByKey = (key: string): string => {
  return `${key}_delete`;
};
export const getCacheByKey = (key: string): string => {
  return `${key}_cache`;
};
export const getCacheKey = (): string => {
  return `cache`;
};

/**
 * Check if value is a plain object (object literal or `Object.create(null)`).
 * Class instances, Dates, Maps, Blobs etc. are not plain objects.
 */
export const isPlainObject = (value: unknown): value is Record<string, unknown> => {
  if (Object.prototype.toString.call(value) !== "[object Object]") {
    return false;
  }
  const prototype = Object.getPrototypeOf(value);
  return prototype === null || prototype === Object.prototype;
};

const isPlainArray = (value: unknown): value is unknown[] => {
  return Array.isArray(value) && Object.keys(value).length === value.length;
};

/**
 * Structural sharing - returns `next` with every part that is deeply equal to `prev` replaced by the `prev` reference.
 * When both values are deeply equal the `prev` reference is returned, so consumers can rely on `===` checks.
 * Only plain objects and arrays are traversed, other values are compared with `Object.is`.
 * @param prev previous value
 * @param next incoming value
 * @returns `next` sharing unchanged references with `prev`
 */
export const replaceEqualDeep = <T>(prev: unknown, next: T): T => {
  if (Object.is(prev, next)) {
    return prev as T;
  }

  const isArray = isPlainArray(prev) && isPlainArray(next);
  if (!isArray && !(isPlainObject(prev) && isPlainObject(next))) {
    return next;
  }

  const prevItems = prev as Record<string, unknown>;
  const nextItems = next as Record<string, unknown>;
  const prevKeys = Object.keys(prevItems);
  const nextKeys = Object.keys(nextItems);
  const copy: Record<string, unknown> = isArray ? ([] as unknown as Record<string, unknown>) : {};

  let equalItems = 0;
  nextKeys.forEach((key) => {
    const prevValue = prevItems[key];
    const nextValue = nextItems[key];
    const value = replaceEqualDeep(prevValue, nextValue);
    copy[key] = value;
    // undefined values are equal only when the key existed before
    // eslint-disable-next-line prefer-object-has-own -- Object.hasOwn is not available in older runtimes
    if (value === prevValue && (value !== undefined || Object.prototype.hasOwnProperty.call(prevItems, key))) {
      equalItems += 1;
    }
  });

  return (prevKeys.length === nextKeys.length && equalItems === prevKeys.length ? prev : copy) as T;
};
