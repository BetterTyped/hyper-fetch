import { endAt, endBefore, limit, orderBy, startAfter, startAt, where } from "firebase/firestore";

import { FirestoreQueryConstraints } from "../../constraints";

export const mapConstraint = ({ type, values }: { type: FirestoreQueryConstraints; values: any[] }) => {
  switch (type) {
    case FirestoreQueryConstraints.WHERE: {
      const [fieldPath, strOp, value] = values;
      return where(fieldPath, strOp, value);
    }
    case FirestoreQueryConstraints.ORDER_BY: {
      const [field, ord] = values;
      return orderBy(field, ord);
    }
    case FirestoreQueryConstraints.LIMIT: {
      const [limitValue] = values;
      return limit(limitValue);
    }
    case FirestoreQueryConstraints.START_AT: {
      const [docOrFields] = values;
      return startAt(docOrFields);
    }
    case FirestoreQueryConstraints.START_AFTER: {
      const [docOrFields] = values;
      return startAfter(docOrFields);
    }
    case FirestoreQueryConstraints.END_AT: {
      const [docOrFields] = values;
      return endAt(docOrFields);
    }
    case FirestoreQueryConstraints.END_BEFORE: {
      const [docOrFields] = values;
      return endBefore(docOrFields);
    }
    default:
      throw new Error(`Unknown method ${type}`);
  }
};
