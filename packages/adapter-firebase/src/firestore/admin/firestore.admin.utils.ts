import { CollectionReference, DocumentReference, Firestore } from "firebase-admin/lib/firestore";

import { FirebaseQueryConstraints } from "../../constraints";

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

export const applyConstraint = (
  collectionRef: CollectionReference,
  { type, values }: { type: FirebaseQueryConstraints; values: any[] },
) => {
  switch (type) {
    case FirebaseQueryConstraints.WHERE: {
      const [fieldPath, strOp, value] = values;
      return collectionRef.where(fieldPath, strOp, value);
    }
    case FirebaseQueryConstraints.ORDER_BY: {
      const [field, ord] = values;
      return collectionRef.orderBy(field, ord);
    }
    case FirebaseQueryConstraints.LIMIT: {
      const [limitValue] = values;
      return collectionRef.limit(limitValue);
    }
    case FirebaseQueryConstraints.START_AT: {
      const [docOrFields] = values;
      return collectionRef.startAt(docOrFields);
    }
    case FirebaseQueryConstraints.START_AFTER: {
      const [docOrFields] = values;
      return collectionRef.startAfter(docOrFields);
    }
    case FirebaseQueryConstraints.END_AT: {
      const [docOrFields] = values;
      return collectionRef.endAt(docOrFields);
    }
    case FirebaseQueryConstraints.END_BEFORE: {
      const [docOrFields] = values;
      return collectionRef.endBefore(docOrFields);
    }
    default:
      throw new Error(`Unknown method ${type}`);
  }
};

export const applyConstraints = (
  collectionRef: CollectionReference,
  constraints: { type: FirebaseQueryConstraints; values: any[] }[],
) => {
  return constraints.reduce((collection, constraint) => {
    return applyConstraint(collection, constraint);
  }, collectionRef);
};
