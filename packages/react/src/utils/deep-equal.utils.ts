/**
 * Check if value is empty
 * @param value any object or primitive
 * @returns true when value is empty
 */
export const isEmpty = (value: unknown): boolean => {
  const valueType = Object.prototype.toString.call(value);
  if (Array.isArray(value)) return !value.length;
  if (typeof value === "object" && value !== null && valueType === "[object Object]") return !Object.keys(value).length;
  return false;
};

/**
 * Allow to deep compare any passed values
 * @param firstValue unknown
 * @param secondValue unknown
 * @returns true when elements are equal
 */
export const isEqual = (firstValue: unknown, secondValue: unknown): boolean => {
  if (firstValue === secondValue) return true;

  try {
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
  } catch (err) {
    console.error(err);
    return false;
  }
};
