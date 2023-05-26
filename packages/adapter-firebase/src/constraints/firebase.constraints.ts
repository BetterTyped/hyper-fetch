import { OrderByDirection, WhereFilterOp } from "firebase/firestore";

export enum RealtimeQueryConstraints {
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

export enum FirestoreQueryConstraints {
  WHERE = "where",
  ORDER_BY = "orderBy",
  LIMIT = "limit",
  START_AT = "startAt",
  START_AFTER = "startAfter",
  END_AT = "endAt",
  END_BEFORE = "endBefore",
}

export const $where = (fieldPath: string, opStr: WhereFilterOp, value: any) => {
  return {
    toString: () => `${FirestoreQueryConstraints.WHERE}_${fieldPath}${opStr}${value}`,
    type: FirestoreQueryConstraints.WHERE as const,
    values: [fieldPath, opStr, value],
  };
};

export const $orderBy = (fieldPath: string, directionStr?: OrderByDirection) => {
  return {
    toString: () => `${FirestoreQueryConstraints.ORDER_BY}_${fieldPath}_${directionStr || ""}`,
    type: FirestoreQueryConstraints.ORDER_BY as const,
    values: [fieldPath, directionStr],
  };
};

export const $limit = (num: number) => {
  return {
    toString: () => `${FirestoreQueryConstraints.LIMIT}_${num}`,
    type: FirestoreQueryConstraints.LIMIT as const,
    values: [num],
  };
};

const startEndConstraintsImpl = (constraintType: RealtimeQueryConstraints) => {
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

export const $startAt = startEndConstraintsImpl(RealtimeQueryConstraints.START_AT as const);
export const $startAfter = startEndConstraintsImpl(RealtimeQueryConstraints.START_AFTER as const);

export const $endAt = startEndConstraintsImpl(RealtimeQueryConstraints.END_AT as const);
export const $endBefore = startEndConstraintsImpl(RealtimeQueryConstraints.END_BEFORE as const);

export const $orderByChild = (path: string) => {
  return {
    toString: () => `${RealtimeQueryConstraints.ORDER_BY_CHILD}_${path}`,
    type: RealtimeQueryConstraints.ORDER_BY_CHILD as const,
    values: [path],
  };
};

export const $orderByKey = () => {
  return {
    toString: () => `${RealtimeQueryConstraints.ORDER_BY_KEY}`,
    type: RealtimeQueryConstraints.ORDER_BY_KEY as const,
    values: [],
  };
};

export const $orderByValue = () => {
  return {
    toString: () => `${RealtimeQueryConstraints.ORDER_BY_VALUE}`,
    type: RealtimeQueryConstraints.ORDER_BY_VALUE as const,
    values: [],
  };
};

export const $limitToFirst = (num: number) => {
  return {
    toString: () => `${RealtimeQueryConstraints.LIMIT_TO_FIRST}_${num}`,
    type: RealtimeQueryConstraints.LIMIT_TO_FIRST as const,
    values: [num],
  };
};

export const $limitToLast = (num: number) => {
  return {
    toString: () => `${RealtimeQueryConstraints.LIMIT_TO_LAST}_${num}`,
    type: RealtimeQueryConstraints.LIMIT_TO_LAST as const,
    values: [num],
  };
};

export const $equalTo = (value: any) => {
  return {
    toString: () => `${RealtimeQueryConstraints.LIMIT_TO_LAST}_${value}`,
    type: RealtimeQueryConstraints.EQUAL_TO as const,
    values: [value],
  };
};
