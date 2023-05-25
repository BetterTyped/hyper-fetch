import { Reference } from "firebase-admin/lib/database";

import { FirebaseQueryConstraints } from "../../constraints";

export const applyConstraint = (
  ref: Reference,
  { type, values }: { type: FirebaseQueryConstraints; values: any[] },
) => {
  switch (type) {
    case FirebaseQueryConstraints.ORDER_BY_CHILD: {
      const [value] = values;
      return ref.orderByChild(value);
    }
    case FirebaseQueryConstraints.ORDER_BY_KEY: {
      return ref.orderByKey();
    }
    case FirebaseQueryConstraints.ORDER_BY_VALUE: {
      return ref.orderByValue();
    }
    case FirebaseQueryConstraints.START_AT: {
      const [[value]] = values;
      return ref.startAt(value);
    }
    case FirebaseQueryConstraints.START_AFTER: {
      const [[value]] = values;
      return ref.startAfter(value);
    }
    case FirebaseQueryConstraints.END_AT: {
      const [[value]] = values;
      return ref.endAt(value);
    }
    case FirebaseQueryConstraints.END_BEFORE: {
      const [[value]] = values;
      return ref.endBefore(value);
    }
    case FirebaseQueryConstraints.LIMIT_TO_FIRST: {
      const [value] = values;
      return ref.limitToFirst(value);
    }
    case FirebaseQueryConstraints.LIMIT_TO_LAST: {
      const [value] = values;
      return ref.limitToLast(value);
    }
    case FirebaseQueryConstraints.EQUAL_TO: {
      const [value] = values;
      return ref.equalTo(value);
    }
    default:
      throw new Error(`Unknown method ${type}`);
  }
};

export const applyConstraints = (ref: Reference, constraints: { type: FirebaseQueryConstraints; values: any[] }[]) => {
  return constraints.reduce((collection, constraint) => {
    return applyConstraint(collection, constraint);
  }, ref);
};
