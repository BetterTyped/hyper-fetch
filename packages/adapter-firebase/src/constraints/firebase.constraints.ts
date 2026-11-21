import type { OrderByDirection, WhereFilterOp } from "firebase/firestore";

export enum SharedQueryConstraints {
  START_AT = "startAt",
  START_AFTER = "startAfter",
  END_AT = "endAt",
  END_BEFORE = "endBefore",
}
export enum RealtimeQueryConstraints {
  ORDER_BY_CHILD = "orderByChild",
  ORDER_BY_KEY = "orderByKey",
  ORDER_BY_VALUE = "orderByValue",
  LIMIT_TO_FIRST = "limitToFirst",
  LIMIT_TO_LAST = "limitToLast",
  EQUAL_TO = "equalTo",
}

export enum FirestoreQueryConstraints {
  WHERE = "where",
  ORDER_BY = "orderBy",
  LIMIT = "limit",
}

/**
 * Firestore filter, the HyperFetch form of Firestore's `where()`.
 *
 * @param fieldPath - Field to compare, dot notation reaches nested fields (`"address.city"`)
 * @param opStr - Firestore operator such as `"=="`, `">="`, `"in"` or `"array-contains"`
 * @param value - Value to compare the field with
 * @example
 * getTeas.send({ queryParams: [$where("type", "==", "Green"), $where("year", ">=", 2020)] });
 */
export const $where = (fieldPath: string, opStr: WhereFilterOp, value: any) => {
  return {
    toString: () => `${FirestoreQueryConstraints.WHERE}_${fieldPath}${opStr}${value}`,
    type: FirestoreQueryConstraints.WHERE as const,
    values: [fieldPath, opStr, value],
  };
};

/**
 * Firestore ordering, the HyperFetch form of Firestore's `orderBy()`. Cursors take one value per `$orderBy`, in the same
 * order.
 *
 * @param fieldPath - Field to order by
 * @param directionStr - `"asc"` (default) or `"desc"`
 * @example
 * getTeas.send({ queryParams: [$orderBy("year", "desc"), $orderBy("name")] });
 */
export const $orderBy = (fieldPath: string, directionStr?: OrderByDirection) => {
  return {
    toString: () => `${FirestoreQueryConstraints.ORDER_BY}_${fieldPath}_${directionStr || ""}`,
    type: FirestoreQueryConstraints.ORDER_BY as const,
    values: [fieldPath, directionStr],
  };
};

/**
 * Firestore limit, the HyperFetch form of Firestore's `limit()`.
 *
 * @param num - Maximum number of documents to return
 * @example
 * getTeas.send({ queryParams: [$orderBy("year"), $limit(20)] });
 */
export const $limit = (num: number) => {
  return {
    toString: () => `${FirestoreQueryConstraints.LIMIT}_${num}`,
    type: FirestoreQueryConstraints.LIMIT as const,
    values: [num],
  };
};

const startEndConstraintsImpl = (constraintType: SharedQueryConstraints) => {
  return (...docOrFields: any[]) => {
    if (docOrFields.length === 1 && docOrFields[0].query) {
      return {
        toString: () => `${constraintType}_${docOrFields[0].query?._query?.memoizedTarget?.memoizedCanonicalId}`,
        type: constraintType,
        values: [docOrFields],
      };
    }
    return {
      toString: () => `${constraintType}_${docOrFields}`,
      type: constraintType,
      values: [docOrFields],
    };
  };
};

/**
 * Cursor that starts the ordered query at the given values, inclusive.
 *
 * In Firestore pass one value per `$orderBy`, in the same order. In Realtime Database pass the value of the
 * `$orderBy*` field and, optionally, a key that breaks ties between equal values.
 *
 * @example
 * // Firestore
 * getTeas.send({ queryParams: [$orderBy("year"), $orderBy("name"), $startAt(2022, "Bi Luo Chun")] });
 * // Realtime Database
 * getTeas.send({ queryParams: [$orderByChild("year"), $startAt(2022)] });
 */
export const $startAt = startEndConstraintsImpl(SharedQueryConstraints.START_AT as const);
/**
 * Cursor that starts the ordered query after the given values, exclusive. Use it to load the next page.
 *
 * In Firestore pass one value per `$orderBy`, in the same order. In Realtime Database pass the value of the
 * `$orderBy*` field and, optionally, a key that breaks ties between equal values.
 *
 * @example
 * const last = page.data?.at(-1);
 * getTeas.send({ queryParams: [$orderBy("year"), $startAfter(last?.year), $limit(20)] });
 */
export const $startAfter = startEndConstraintsImpl(SharedQueryConstraints.START_AFTER as const);

/**
 * Cursor that ends the ordered query at the given values, inclusive.
 *
 * In Firestore pass one value per `$orderBy`, in the same order. In Realtime Database pass the value of the
 * `$orderBy*` field and, optionally, a key that breaks ties between equal values.
 *
 * @example
 * getTeas.send({ queryParams: [$orderBy("year"), $endAt(2011)] });
 */
export const $endAt = startEndConstraintsImpl(SharedQueryConstraints.END_AT as const);
/**
 * Cursor that ends the ordered query before the given values, exclusive.
 *
 * In Firestore pass one value per `$orderBy`, in the same order. In Realtime Database pass the value of the
 * `$orderBy*` field and, optionally, a key that breaks ties between equal values.
 *
 * @example
 * getTeas.send({ queryParams: [$orderBy("year"), $endBefore(2011)] });
 */
export const $endBefore = startEndConstraintsImpl(SharedQueryConstraints.END_BEFORE as const);

/**
 * Realtime Database ordering by a child value, the HyperFetch form of `orderByChild()`. A query can have one `$orderBy*`.
 *
 * @param path - Child path to order by, for example `"year"` or `"author/name"`
 * @example
 * getTeas.send({ queryParams: [$orderByChild("year"), $limitToFirst(10)] });
 */
export const $orderByChild = (path: string) => {
  return {
    toString: () => `${RealtimeQueryConstraints.ORDER_BY_CHILD}_${path}`,
    type: RealtimeQueryConstraints.ORDER_BY_CHILD as const,
    values: [path],
  };
};

/**
 * Realtime Database ordering by key, the HyperFetch form of `orderByKey()`. A query can have one `$orderBy*`.
 *
 * @example
 * getTeas.send({ queryParams: [$orderByKey(), $limitToLast(10)] });
 */
export const $orderByKey = () => {
  return {
    toString: () => `${RealtimeQueryConstraints.ORDER_BY_KEY}`,
    type: RealtimeQueryConstraints.ORDER_BY_KEY as const,
    values: [],
  };
};

/**
 * Realtime Database ordering by the child values themselves, the HyperFetch form of `orderByValue()`. A query can have
 * one `$orderBy*`.
 *
 * @example
 * getScores.send({ queryParams: [$orderByValue(), $limitToLast(3)] });
 */
export const $orderByValue = () => {
  return {
    toString: () => `${RealtimeQueryConstraints.ORDER_BY_VALUE}`,
    type: RealtimeQueryConstraints.ORDER_BY_VALUE as const,
    values: [],
  };
};

/**
 * Realtime Database limit from the start of the ordered list, the HyperFetch form of `limitToFirst()`.
 *
 * @param num - Maximum number of children to return
 * @example
 * getTeas.send({ queryParams: [$orderByChild("year"), $limitToFirst(5)] });
 */
export const $limitToFirst = (num: number) => {
  return {
    toString: () => `${RealtimeQueryConstraints.LIMIT_TO_FIRST}_${num}`,
    type: RealtimeQueryConstraints.LIMIT_TO_FIRST as const,
    values: [num],
  };
};

/**
 * Realtime Database limit from the end of the ordered list, the HyperFetch form of `limitToLast()`.
 *
 * @param num - Maximum number of children to return
 * @example
 * getMessages.send({ queryParams: [$orderByChild("sentAt"), $limitToLast(50)] });
 */
export const $limitToLast = (num: number) => {
  return {
    toString: () => `${RealtimeQueryConstraints.LIMIT_TO_LAST}_${num}`,
    type: RealtimeQueryConstraints.LIMIT_TO_LAST as const,
    values: [num],
  };
};

/**
 * Realtime Database filter for children equal to a value, the HyperFetch form of `equalTo()`. Combine it with an
 * `$orderBy*` that picks the compared value.
 *
 * @param value - Value the ordered field must equal
 * @param key - Optional key that breaks ties between children with the same value
 * @example
 * getTeas.send({ queryParams: [$orderByChild("type"), $equalTo("Green")] });
 */
export const $equalTo = (value: any, key?: string) => {
  return {
    toString: () => `${RealtimeQueryConstraints.EQUAL_TO}_${value}${key === undefined ? "" : `_${key}`}`,
    type: RealtimeQueryConstraints.EQUAL_TO as const,
    values: key === undefined ? [value] : [value, key],
  };
};
