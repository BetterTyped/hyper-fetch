import { endAt, endBefore, limit, orderBy, startAfter, startAt, where, OrderByDirection } from "firebase/firestore";

import { FirestorePermittedMethods, FirestoreQueryConstraints, SharedQueryConstraints } from "constraints";

export const mapConstraint = ({ type, values }: FirestorePermittedMethods) => {
  switch (type) {
    case FirestoreQueryConstraints.WHERE: {
      const [fieldPath, strOp, value] = values;
      return where(fieldPath, strOp, value);
    }
    case FirestoreQueryConstraints.ORDER_BY: {
      const [field, ord] = values;
      return orderBy(field, ord as OrderByDirection);
    }
    case FirestoreQueryConstraints.LIMIT: {
      const [limitValue] = values;
      return limit(limitValue);
    }
    case SharedQueryConstraints.START_AT: {
      const [docOrFields] = values;
      return startAt(docOrFields);
    }
    case SharedQueryConstraints.START_AFTER: {
      const [docOrFields] = values;
      return startAfter(docOrFields);
    }
    case SharedQueryConstraints.END_AT: {
      const [docOrFields] = values;
      return endAt(docOrFields);
    }
    case SharedQueryConstraints.END_BEFORE: {
      const [docOrFields] = values;
      return endBefore(docOrFields);
    }
    default:
      throw new Error(`Unknown method ${type}`);
  }
};
