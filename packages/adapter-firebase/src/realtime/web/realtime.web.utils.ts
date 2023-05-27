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

import { RealtimeQueryConstraints, SharedQueryConstraints } from "../../constraints";

export const mapConstraint = ({
  type,
  values,
}: {
  type: RealtimeQueryConstraints | SharedQueryConstraints;
  values: any[];
}) => {
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
      const [[value]] = values;
      return startAt(value);
    }
    case SharedQueryConstraints.START_AFTER: {
      const [[value]] = values;
      return startAfter(value);
    }
    case SharedQueryConstraints.END_AT: {
      const [[value]] = values;
      return endAt(value);
    }
    case SharedQueryConstraints.END_BEFORE: {
      const [[value]] = values;
      return endBefore(value);
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
      const [value] = values;
      return equalTo(value);
    }
    default:
      throw new Error(`Unknown method ${type}`);
  }
};
