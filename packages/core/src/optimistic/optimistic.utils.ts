import type { OptimisticInsertOptionsType } from "./optimistic.types";

/** Erased match - a predicate or a plain value compared with the `key` field */
export type OptimisticMatcher = ((item: any) => boolean) | unknown;

/** Selects list items: the match and the field a plain value is compared with */
export type OptimisticSelector = { match: OptimisticMatcher; key?: PropertyKey };

type Item = Record<PropertyKey, unknown>;

const isComparableId = (value: unknown): value is string | number =>
  typeof value === "string" || typeof value === "number";

/**
 * Tells if the item is selected by the match. Plain values are compared with the `key` field of the item, numbers and
 * strings match each other the same way route params do (`"1"` matches `1`).
 */
export const isOptimisticMatch = (item: unknown, match: OptimisticMatcher, key: PropertyKey = "id"): boolean => {
  if (typeof match === "function") {
    return !!match(item);
  }
  if (item === null || typeof item !== "object") {
    return false;
  }
  const value = (item as Item)[key];
  if (Object.is(value, match)) {
    return true;
  }
  return isComparableId(value) && isComparableId(match) && String(value) === String(match);
};

const assertList = (list: unknown): unknown[] => {
  if (!Array.isArray(list)) {
    throw new TypeError("Optimistic list helpers need an array, use .list(field) for an array inside an object");
  }
  return list;
};

const assertEntry = (data: unknown): Item => {
  if (data === null || typeof data !== "object" || Array.isArray(data)) {
    throw new TypeError("Optimistic increment(field, by) needs an object, use increment(match, field, by) on a list");
  }
  return data as Item;
};

const addToField = (item: Item, field: PropertyKey, by: number): Item => {
  const value = item[field];
  return { ...item, [field]: (typeof value === "number" ? value : 0) + by };
};

/**
 * Maps the matching items. The list keeps its reference when nothing matched, so unchanged data produces no write.
 */
const mapMatching = (list: unknown, { match, key }: OptimisticSelector, map: (item: Item) => Item): unknown[] => {
  const items = assertList(list);
  let changed = false;
  const next = items.map((item) => {
    if (!isOptimisticMatch(item, match, key)) {
      return item;
    }
    changed = true;
    return map(item as Item);
  });
  return changed ? next : items;
};

export const patchItems = (list: unknown, selector: OptimisticSelector, fields: object): unknown[] => {
  return mapMatching(list, selector, (item) => ({ ...item, ...fields }));
};

export const insertItem = (list: unknown, item: unknown, options?: OptimisticInsertOptionsType): unknown[] => {
  const items = assertList(list);
  const at = options?.at ?? "end";
  if (at === "start") {
    return [item, ...items];
  }
  if (at === "end") {
    return [...items, item];
  }
  const next = [...items];
  next.splice(at, 0, item);
  return next;
};

export const removeItems = (list: unknown, { match, key }: OptimisticSelector): unknown[] => {
  const items = assertList(list);
  const next = items.filter((item) => !isOptimisticMatch(item, match, key));
  return next.length === items.length ? items : next;
};

export const incrementItems = (
  list: unknown,
  selector: OptimisticSelector,
  { field, by }: { field: PropertyKey; by: number },
): unknown[] => {
  return mapMatching(list, selector, (item) => addToField(item, field, by));
};

export const incrementField = (data: unknown, field: PropertyKey, by: number): Item => {
  return addToField(assertEntry(data), field, by);
};

/**
 * Runs a list helper on the array held in `field`. A missing list counts as empty, the object keeps its reference when
 * the list did not change.
 */
export const updateListField = (data: unknown, field: PropertyKey, update: (list: unknown[]) => unknown[]): Item => {
  const entry = assertEntry(data);
  const list = entry[field] ?? [];
  const next = update(assertList(list));
  return next === list ? entry : { ...entry, [field]: next };
};
