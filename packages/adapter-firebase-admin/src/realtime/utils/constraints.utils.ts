import type { RealtimePermittedMethods } from "constraints";
import { RealtimeQueryConstraints, SharedQueryConstraints } from "constraints";
import type { Query } from "firebase-admin/database";

export const applyRealtimeAdminConstraint = (ref: Query, { type, values }: RealtimePermittedMethods) => {
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
      const [[value, key]] = values;
      return ref.startAt(value, key);
    }
    case SharedQueryConstraints.START_AFTER: {
      const [[value, key]] = values;
      return ref.startAfter(value, key);
    }
    case SharedQueryConstraints.END_AT: {
      const [[value, key]] = values;
      return ref.endAt(value, key);
    }
    case SharedQueryConstraints.END_BEFORE: {
      const [[value, key]] = values;
      return ref.endBefore(value, key);
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

export const applyRealtimeAdminConstraints = (ref: Query, constraints: RealtimePermittedMethods[]) => {
  return constraints.reduce((collection, constraint) => {
    return applyRealtimeAdminConstraint(collection, constraint);
  }, ref);
};
