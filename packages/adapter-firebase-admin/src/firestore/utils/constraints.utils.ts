import { CollectionReference } from "firebase-admin/lib/firestore";
import { OrderByDirection } from "firebase/firestore";

import { FirestorePermittedMethods, FirestoreQueryConstraints, SharedQueryConstraints } from "../../constraints";

export const applyFireStoreAdminConstraint = (
  collectionRef: CollectionReference,
  { type, values }: FirestorePermittedMethods,
) => {
  switch (type) {
    case FirestoreQueryConstraints.WHERE: {
      const [fieldPath, strOp, value] = values;
      return collectionRef.where(fieldPath, strOp, value);
    }
    case FirestoreQueryConstraints.ORDER_BY: {
      const [field, ord] = values;
      return collectionRef.orderBy(field, ord as OrderByDirection);
    }
    case FirestoreQueryConstraints.LIMIT: {
      const [limitValue] = values;
      return collectionRef.limit(limitValue);
    }
    case SharedQueryConstraints.START_AT: {
      const [docOrFields] = values;
      return collectionRef.startAt(docOrFields);
    }
    case SharedQueryConstraints.START_AFTER: {
      const [docOrFields] = values;
      return collectionRef.startAfter(docOrFields);
    }
    case SharedQueryConstraints.END_AT: {
      const [docOrFields] = values;
      return collectionRef.endAt(docOrFields);
    }
    case SharedQueryConstraints.END_BEFORE: {
      const [docOrFields] = values;
      return collectionRef.endBefore(docOrFields);
    }
    default:
      throw new Error(`Unknown method ${type}`);
  }
};

export const applyFireStoreAdminConstraints = (
  collectionRef: CollectionReference,
  constraints: FirestorePermittedMethods[],
) => {
  return constraints.reduce((collection, constraint) => {
    return applyFireStoreAdminConstraint(collection, constraint);
  }, collectionRef);
};
