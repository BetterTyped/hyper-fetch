import type {
  ComparableValue,
  Condition,
  ExtractConditionEq,
  ExtractConditionTokens,
  FieldRef,
  LocalToken,
} from "./operators.types";

const comparison = (op: "eq" | "gt" | "gte" | "lt" | "lte" | "inArray", ref: FieldRef, value: unknown) => {
  return { kind: "condition", node: { op, field: ref.field, value } } as const;
};

/** Matches rows whose field equals the value. Dates are equal when they are the same instant. */
export const eq = <Name extends string, Value>(
  ref: FieldRef<Name, Value>,
  value: NoInfer<Value>,
): Condition<`${Name}:eq`, Name> => comparison("eq", ref, value);

/** Matches rows whose field is greater than the value */
export const gt = <Name extends string, Value extends ComparableValue | null | undefined>(
  ref: FieldRef<Name, Value>,
  value: NoInfer<NonNullable<Value>>,
): Condition<`${Name}:gt`, never> => comparison("gt", ref, value);

/** Matches rows whose field is greater than or equal to the value */
export const gte = <Name extends string, Value extends ComparableValue | null | undefined>(
  ref: FieldRef<Name, Value>,
  value: NoInfer<NonNullable<Value>>,
): Condition<`${Name}:gte`, never> => comparison("gte", ref, value);

/** Matches rows whose field is less than the value */
export const lt = <Name extends string, Value extends ComparableValue | null | undefined>(
  ref: FieldRef<Name, Value>,
  value: NoInfer<NonNullable<Value>>,
): Condition<`${Name}:lt`, never> => comparison("lt", ref, value);

/** Matches rows whose field is less than or equal to the value */
export const lte = <Name extends string, Value extends ComparableValue | null | undefined>(
  ref: FieldRef<Name, Value>,
  value: NoInfer<NonNullable<Value>>,
): Condition<`${Name}:lte`, never> => comparison("lte", ref, value);

/** Matches rows whose field equals one of the values */
export const inArray = <Name extends string, Value>(
  ref: FieldRef<Name, Value>,
  values: readonly NoInfer<Value>[],
): Condition<`${Name}:inArray`, never> => comparison("inArray", ref, values);

/**
 * A server-only operator, such as full-text search, which has no meaning on the client. A loader maps it under its
 * name like any operator, as in `title: { search: (text: string) => ({ queryParams: { q: text } }) }`. A query that
 * uses one must send it, or it does not compile. Its subset never answers other queries, and new rows never join it:
 * an insert marks it stale instead.
 *
 * @example
 * db.post.where((post) => op("search", post.title, "tea"));
 */
export const op = <Operator extends string, Name extends string, Value>(
  name: Operator,
  ref: FieldRef<Name, unknown>,
  value: Value,
): Condition<`${Name}:${Operator}`, never> => ({
  kind: "condition",
  node: { op: "server", name, field: ref.field, value },
});

/**
 * Matches rows that match every condition. Top-level `and` is where the db splits a query: the conditions a loader
 * declares are sent to the backend and the rest run on the rows the db holds.
 */
export const and = <Conditions extends readonly Condition<string, string>[]>(
  ...conditions: Conditions
): Condition<ExtractConditionTokens<Conditions[number]>, ExtractConditionEq<Conditions[number]>> => ({
  kind: "condition",
  node: { op: "and", items: conditions.map((condition) => condition.node) },
});

/** Matches rows that match at least one condition. It runs on the rows the db holds. */
export const or = (...conditions: readonly Condition<string, string>[]): Condition<LocalToken, never> => ({
  kind: "condition",
  node: { op: "or", items: conditions.map((condition) => condition.node) },
});

/** Matches rows that do not match the condition. It runs on the rows the db holds. */
export const not = (condition: Condition<string, string>): Condition<LocalToken, never> => ({
  kind: "condition",
  node: { op: "not", item: condition.node },
});
