import { endAt, endBefore, limit, orderBy, startAfter, startAt, where } from "firebase/firestore";

import { FirebaseQueryConstraints } from "../../constraints";

export const mapConstraint = ({ type, values }: { type: FirebaseQueryConstraints; values: any[] }) => {
  switch (type) {
    case FirebaseQueryConstraints.WHERE: {
      const [fieldPath, strOp, value] = values;
      return where(fieldPath, strOp, value);
    }
    case FirebaseQueryConstraints.ORDER_BY: {
      const [field, ord] = values;
      return orderBy(field, ord);
    }
    case FirebaseQueryConstraints.LIMIT: {
      const [limitValue] = values;
      return limit(limitValue);
    }
    case FirebaseQueryConstraints.START_AT: {
      const [docOrFields] = values;
      return startAt(docOrFields);
    }
    case FirebaseQueryConstraints.START_AFTER: {
      const [docOrFields] = values;
      return startAfter(docOrFields);
    }
    case FirebaseQueryConstraints.END_AT: {
      const [docOrFields] = values;
      return endAt(docOrFields);
    }
    case FirebaseQueryConstraints.END_BEFORE: {
      const [docOrFields] = values;
      return endBefore(docOrFields);
    }
    default:
      throw new Error(`Unknown method ${type}`);
  }
};
