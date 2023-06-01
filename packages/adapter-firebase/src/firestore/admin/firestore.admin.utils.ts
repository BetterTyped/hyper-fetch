import { CollectionReference, DocumentReference, Firestore } from "firebase-admin/lib/firestore";
import { OrderByDirection } from "firebase/firestore";

import { FirestorePermittedMethods, FirestoreQueryConstraints, SharedQueryConstraints } from "../../constraints";

export const getRef = (db: Firestore, fullUrl: string) => {
  const withoutSurroundingSlashes = fullUrl.replace(/^\/|\/$/g, "");
  const urlParts = withoutSurroundingSlashes.split("/").map((element, index) => {
    return index % 2 === 0 ? ["collection", element] : ["doc", element];
  });

  return urlParts.reduce((_db, value) => {
    const [method, pathPart] = value;
    if (method === "doc" && "doc" in _db) {
      return _db.doc(pathPart);
    }
    if (method === "collection" && "collection" in _db) {
      return _db.collection(pathPart);
    }
    return _db;
  }, db as unknown as Firestore | CollectionReference | DocumentReference) as CollectionReference | DocumentReference;
};

export const applyConstraint = (collectionRef: CollectionReference, { type, values }: FirestorePermittedMethods) => {
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

export const applyConstraints = (collectionRef: CollectionReference, constraints: FirestorePermittedMethods[]) => {
  return constraints.reduce((collection, constraint) => {
    return applyConstraint(collection, constraint);
  }, collectionRef);
};
