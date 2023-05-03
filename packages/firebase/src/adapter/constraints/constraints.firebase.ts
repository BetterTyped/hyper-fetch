import { OrderByDirection, WhereFilterOp } from "@firebase/firestore";

export enum FirebaseQueryConstraints {
  WHERE = "where",
  ORDER_BY = "orderBy",
  LIMIT = "limit",
  START_AT = "startAt",
  START_AFTER = "startAfter",
  END_AT = "endAt",
  END_BEFORE = "endBefore",
  ORDER_BY_CHILD = "orderByChild",
  ORDER_BY_KEY = "orderByKey",
  ORDER_BY_VALUE = "orderByValue",
  LIMIT_TO_FIRST = "limitToFirst",
  LIMIT_TO_LAST = "limitToLast",
  EQUAL_TO = "equalTo",
}
export const $where = (fieldPath: string, opStr: WhereFilterOp, value: any) => {
  return {
    toString: () => `${FirebaseQueryConstraints.WHERE}_${fieldPath}${opStr}${value}`,
    type: FirebaseQueryConstraints.WHERE,
    values: [fieldPath, opStr, value],
  };
};

export const $orderBy = (fieldPath: string, directionStr?: OrderByDirection) => {
  return {
    toString: () => `${FirebaseQueryConstraints.ORDER_BY}_${fieldPath}_${directionStr || ""}`,
    type: FirebaseQueryConstraints.ORDER_BY,
    values: [fieldPath, directionStr],
  };
};

export const $limit = (num: number) => {
  return {
    toString: () => `${FirebaseQueryConstraints.LIMIT}_${num}`,
    type: FirebaseQueryConstraints.LIMIT,
    values: [num],
  };
};

// TODO - find a better way without using types from any package
const startEndConstraintsImpl = (constraintType: FirebaseQueryConstraints) => {
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

export const $startAt = startEndConstraintsImpl(FirebaseQueryConstraints.START_AT);
export const $startAfter = startEndConstraintsImpl(FirebaseQueryConstraints.START_AFTER);

export const $endAt = startEndConstraintsImpl(FirebaseQueryConstraints.END_AT);
export const $endAfter = startEndConstraintsImpl(FirebaseQueryConstraints.END_BEFORE);

export const $orderByChild = (path: string) => {
  return {
    toString: () => `${FirebaseQueryConstraints.ORDER_BY_CHILD}_${path}`,
    type: FirebaseQueryConstraints.ORDER_BY_CHILD,
    values: [path],
  };
};

export const $orderByKey = () => {
  return {
    toString: () => `${FirebaseQueryConstraints.ORDER_BY_KEY}`,
    type: FirebaseQueryConstraints.ORDER_BY_KEY,
    values: [],
  };
};

export const $orderByValue = () => {
  return {
    toString: () => `${FirebaseQueryConstraints.ORDER_BY_VALUE}`,
    type: FirebaseQueryConstraints.ORDER_BY_VALUE,
    values: [],
  };
};

export const $limitToFirst = (num: number) => {
  return {
    toString: () => `${FirebaseQueryConstraints.LIMIT_TO_FIRST}_${num}`,
    type: FirebaseQueryConstraints.LIMIT_TO_FIRST,
    values: [num],
  };
};

export const $limitToLast = (num: number) => {
  return {
    toString: () => `${FirebaseQueryConstraints.LIMIT_TO_LAST}_${num}`,
    type: FirebaseQueryConstraints.LIMIT_TO_LAST,
    values: [num],
  };
};

export const $equalTo = (value: any) => {
  return {
    toString: () => `${FirebaseQueryConstraints.LIMIT_TO_LAST}_${value}`,
    type: FirebaseQueryConstraints.LIMIT_TO_LAST,
    values: [value],
  };
};
