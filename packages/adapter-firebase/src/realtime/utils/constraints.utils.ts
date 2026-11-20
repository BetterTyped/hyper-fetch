import type { RealtimePermittedMethods } from "constraints";
import { RealtimeQueryConstraints, SharedQueryConstraints } from "constraints";
import {
  endAt,
  endBefore,
  equalTo,
  limitToFirst,
  limitToLast,
  orderByChild,
  orderByKey,
  orderByValue,
  startAfter,
  startAt,
} from "firebase/database";

export const mapRealtimeConstraint = ({ type, values }: RealtimePermittedMethods) => {
  switch (type) {
    case RealtimeQueryConstraints.ORDER_BY_CHILD: {
      const [value] = values;
      return orderByChild(value);
    }
    case RealtimeQueryConstraints.ORDER_BY_KEY: {
      return orderByKey();
    }
    case RealtimeQueryConstraints.ORDER_BY_VALUE: {
      return orderByValue();
    }
    case SharedQueryConstraints.START_AT: {
      const [[value, key]] = values;
      return startAt(value, key);
    }
    case SharedQueryConstraints.START_AFTER: {
      const [[value, key]] = values;
      return startAfter(value, key);
    }
    case SharedQueryConstraints.END_AT: {
      const [[value, key]] = values;
      return endAt(value, key);
    }
    case SharedQueryConstraints.END_BEFORE: {
      const [[value, key]] = values;
      return endBefore(value, key);
    }
    case RealtimeQueryConstraints.LIMIT_TO_FIRST: {
      const [value] = values;
      return limitToFirst(value);
    }
    case RealtimeQueryConstraints.LIMIT_TO_LAST: {
      const [value] = values;
      return limitToLast(value);
    }
    case RealtimeQueryConstraints.EQUAL_TO: {
      const [value, key] = values;
      return equalTo(value, key);
    }
    default:
      throw new Error(`Unknown method ${type}`);
  }
};
