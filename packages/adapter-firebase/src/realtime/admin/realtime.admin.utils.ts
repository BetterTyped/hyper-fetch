import { Reference } from "firebase-admin/lib/database";

import { RealtimePermittedMethods, RealtimeQueryConstraints, SharedQueryConstraints } from "../../constraints";

export const applyConstraint = (ref: Reference, { type, values }: RealtimePermittedMethods) => {
  switch (type) {
    case RealtimeQueryConstraints.ORDER_BY_CHILD: {
      const [value] = values;
      return ref.orderByChild(value);
    }
    case RealtimeQueryConstraints.ORDER_BY_KEY: {
      return ref.orderByKey();
    }
    case RealtimeQueryConstraints.ORDER_BY_VALUE: {
      return ref.orderByValue();
    }
    case SharedQueryConstraints.START_AT: {
      const [[value]] = values;
      return ref.startAt(value);
    }
    case SharedQueryConstraints.START_AFTER: {
      const [[value]] = values;
      return ref.startAfter(value);
    }
    case SharedQueryConstraints.END_AT: {
      const [[value]] = values;
      return ref.endAt(value);
    }
    case SharedQueryConstraints.END_BEFORE: {
      const [[value]] = values;
      return ref.endBefore(value);
    }
    case RealtimeQueryConstraints.LIMIT_TO_FIRST: {
      const [value] = values;
      return ref.limitToFirst(value);
    }
    case RealtimeQueryConstraints.LIMIT_TO_LAST: {
      const [value] = values;
      return ref.limitToLast(value);
    }
    case RealtimeQueryConstraints.EQUAL_TO: {
      const [value] = values;
      return ref.equalTo(value);
    }
    default:
      throw new Error(`Unknown method ${type}`);
  }
};

export const applyConstraints = (ref: Reference, constraints: RealtimePermittedMethods[]) => {
  return constraints.reduce((collection, constraint) => {
    return applyConstraint(collection, constraint);
  }, ref);
};
