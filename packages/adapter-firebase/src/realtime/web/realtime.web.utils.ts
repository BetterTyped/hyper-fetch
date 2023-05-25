import { FirebaseQueryConstraints } from "../../constraints";
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

export const mapConstraint = ({ type, values }: { type: FirebaseQueryConstraints; values: any[] }) => {
  switch (type) {
    case FirebaseQueryConstraints.ORDER_BY_CHILD: {
      const [value] = values;
      return orderByChild(value);
    }
    case FirebaseQueryConstraints.ORDER_BY_KEY: {
      return orderByKey();
    }
    case FirebaseQueryConstraints.ORDER_BY_VALUE: {
      return orderByValue();
    }
    case FirebaseQueryConstraints.START_AT: {
      const [[value]] = values;
      return startAt(value);
    }
    case FirebaseQueryConstraints.START_AFTER: {
      const [[value]] = values;
      return startAfter(value);
    }
    case FirebaseQueryConstraints.END_AT: {
      const [[value]] = values;
      return endAt(value);
    }
    case FirebaseQueryConstraints.END_BEFORE: {
      const [[value]] = values;
      return endBefore(value);
    }
    case FirebaseQueryConstraints.LIMIT_TO_FIRST: {
      const [value] = values;
      return limitToFirst(value);
    }
    case FirebaseQueryConstraints.LIMIT_TO_LAST: {
      const [value] = values;
      return limitToLast(value);
    }
    case FirebaseQueryConstraints.EQUAL_TO: {
      const [value] = values;
      return equalTo(value);
    }
    default:
      throw new Error(`Unknown method ${type}`);
  }
};
