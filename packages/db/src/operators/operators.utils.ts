import type { ComparisonNode, ExpressionNode } from "./operators.types";

/** Turns a value into the form the db compares: dates become their instant */
const normalize = (value: unknown): unknown => (value instanceof Date ? value.getTime() : value);

/** Compares two strings by Unicode code point, so the order does not depend on the runtime's locale */
const compareStrings = (left: string, right: string): number => {
  const leftPoints = [...left];
  const rightPoints = [...right];
  const length = Math.min(leftPoints.length, rightPoints.length);
  for (let index = 0; index < length; index += 1) {
    const difference = leftPoints[index].codePointAt(0)! - rightPoints[index].codePointAt(0)!;
    if (difference !== 0) {
      return difference < 0 ? -1 : 1;
    }
  }
  if (leftPoints.length === rightPoints.length) {
    return 0;
  }
  return leftPoints.length < rightPoints.length ? -1 : 1;
};

/** Two values are equal when they are the same value, or dates of the same instant */
export const isEqualValue = (left: unknown, right: unknown): boolean => {
  return Object.is(normalize(left), normalize(right));
};

/**
 * Orders two values. `null` and `undefined` sort before every other value. Strings compare by code point, dates by
 * instant, and values of different types by their type name, so the order is always total.
 */
export const compareValues = (left: unknown, right: unknown): number => {
  const a = normalize(left);
  const b = normalize(right);
  const aEmpty = a === null || a === undefined;
  const bEmpty = b === null || b === undefined;
  if (aEmpty || bEmpty) {
    if (aEmpty && bEmpty) {
      return 0;
    }
    return aEmpty ? -1 : 1;
  }
  if (typeof a === "string" && typeof b === "string") {
    return compareStrings(a, b);
  }
  if (typeof a !== typeof b) {
    return compareStrings(typeof a, typeof b);
  }
  if (Object.is(a, b)) {
    return 0;
  }
  // NaN sorts after every number, so the order stays consistent
  if (Number.isNaN(a) || Number.isNaN(b)) {
    return Number.isNaN(a) ? 1 : -1;
  }
  return (a as number) < (b as number) ? -1 : 1;
};

const isEmpty = (value: unknown) => value === null || value === undefined;

const evaluateComparison = (node: ComparisonNode, row: Record<string, unknown>): boolean => {
  const value = row[node.field];
  switch (node.op) {
    case "eq": {
      return isEqualValue(value, node.value);
    }
    case "inArray": {
      return (node.value as unknown[]).some((item) => isEqualValue(value, item));
    }
    case "gt": {
      return !isEmpty(value) && compareValues(value, node.value) > 0;
    }
    case "gte": {
      return !isEmpty(value) && compareValues(value, node.value) >= 0;
    }
    case "lt": {
      return !isEmpty(value) && compareValues(value, node.value) < 0;
    }
    default: {
      return !isEmpty(value) && compareValues(value, node.value) <= 0;
    }
  }
};

/** Evaluates a filter expression on one row */
export const evaluate = (node: ExpressionNode, row: Record<string, unknown>): boolean => {
  switch (node.op) {
    case "and": {
      return node.items.every((item) => evaluate(item, row));
    }
    case "or": {
      return node.items.some((item) => evaluate(item, row));
    }
    case "not": {
      return !evaluate(node.item, row);
    }
    case "server": {
      // Only the server can tell, so the subset that loaded the row decides whether it belongs
      return true;
    }
    default: {
      return evaluateComparison(node, row);
    }
  }
};

/** Splits an expression at its top-level `and`, flattening nested `and` nodes */
export const splitAnd = (node: ExpressionNode | undefined): ExpressionNode[] => {
  if (!node) {
    return [];
  }
  if (node.op === "and") {
    return node.items.flatMap((item) => splitAnd(item));
  }
  return [node];
};

/** The fields an expression reads */
export const getExpressionFields = (node: ExpressionNode): string[] => {
  switch (node.op) {
    case "and":
    case "or": {
      return node.items.flatMap((item) => getExpressionFields(item));
    }
    case "not": {
      return getExpressionFields(node.item);
    }
    default: {
      return [node.field];
    }
  }
};

/** A JSON value that identifies a value structurally. Dates keep their instant. */
export const toStableValue = (value: unknown): unknown => {
  if (value instanceof Date) {
    return { $date: value.getTime() };
  }
  // JSON cannot tell these apart from each other or from null, so two different queries would share a subset
  if (typeof value === "bigint") {
    return { $bigint: value.toString() };
  }
  if (typeof value === "number" && !Number.isFinite(value)) {
    return { $number: String(value) };
  }
  if (value === undefined) {
    return { $undefined: true };
  }
  if (value instanceof Map) {
    return { $map: [...value.entries()].map(([key, item]) => [toStableValue(key), toStableValue(item)]) };
  }
  if (value instanceof Set) {
    return { $set: [...value].map((item) => toStableValue(item)) };
  }
  if (Array.isArray(value)) {
    return value.map((item) => toStableValue(item));
  }
  if (value && typeof value === "object") {
    return Object.fromEntries(
      Object.keys(value)
        .toSorted()
        .map((key) => [key, toStableValue((value as Record<string, unknown>)[key])]),
    );
  }
  return value;
};

/** A string that is equal for structurally equal values */
export const stableStringify = (value: unknown): string => JSON.stringify(toStableValue(value));
