import { Firestore, CollectionReference, DocumentReference, DocumentSnapshot, Query } from "firebase-admin/firestore";
import { RequestInstance } from "@hyper-fetch/core";

import { FirestoreDBMethods } from "adapter";
import { FirebaseQueryConstraints } from "constraints";
import { getStatus, setCacheManually } from "./utils/utils.base";
import { getGroupedResultFirestore, getOrderedResultFirestore } from "./utils/utils.firestore";

const getRef = (db: Firestore, fullUrl: string) => {
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

const applyConstraint = (
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

const applyConstraints = (
  collectionRef: CollectionReference,
  constraints: { type: FirebaseQueryConstraints; values: any[] }[],
) => {
  return constraints.reduce((collection, constraint) => {
    return applyConstraint(collection, constraint);
  }, collectionRef);
};

export const getFirestoreMethodsAdmin = <R extends RequestInstance>(
  request: R,
  database: Firestore,
  url: string,
  onSuccess,
  onError,
  resolve,
): Record<
  FirestoreDBMethods,
  (data: {
    // TODO fix any
    constraints?: any[];
    data?: any;
    options?: Record<string, any>;
  }) => void
> => {
  const [cleanUrl] = url.split("?");
  // TODO - do we want to return changed/modified/removed - listen to diff
  const methods: Record<FirestoreDBMethods, (data) => void> = {
    onSnapshot: async ({
      constraints = [],
      options,
    }: {
      constraints: { type: FirebaseQueryConstraints; values: any[] }[];
      options?: Record<string, any>;
    }) => {
      // includeMetadataChanges: true option
      let pathRef: DocumentReference | Query = getRef(database, cleanUrl);
      if (pathRef instanceof CollectionReference) {
        pathRef = applyConstraints(pathRef, constraints);
      }
      const unsub = pathRef.onSnapshot(
        (snapshot) => {
          const result =
            snapshot instanceof DocumentSnapshot ? snapshot.data() || null : getOrderedResultFirestore(snapshot);
          const status = getStatus(result);
          const groupedResult = options?.groupByChangeType === true ? getGroupedResultFirestore(snapshot) : null;
          const additionalData = { ref: pathRef, snapshot, unsubscribe: unsub, groupedResult };
          setCacheManually(request, { value: result, status }, additionalData);
          onSuccess(result, status, additionalData, resolve);
        },
        (error) => {
          // "error" or firebase error exposed
          const additionalData = { ref: pathRef, unsubscribe: unsub };
          setCacheManually(request, { value: error, status: "error" }, additionalData);
          onError(error, "error", {}, resolve);
        },
      );
    },
    getDoc: async () => {
      // TODO - test for nested collection and nested doc
      const path = getRef(database, cleanUrl);
      try {
        const snapshot = (await path.get()) as DocumentSnapshot;
        const result = snapshot.data() || null;
        const status = result ? "success" : "emptyResource";
        onSuccess(result, status, { ref: path, snapshot }, resolve);
      } catch (e) {
        onError(e, "error", { ref: path }, resolve);
      }
    },
    getDocs: async ({ constraints = [] }: { constraints: any[] }) => {
      const path = getRef(database, cleanUrl) as CollectionReference;
      const query = applyConstraints(path, constraints);

      try {
        const querySnapshot = await query.get();
        const result = getOrderedResultFirestore(querySnapshot);
        const status = getStatus(result);

        onSuccess(result, status, { ref: path, snapshot: querySnapshot }, resolve);
      } catch (e) {
        onError(e, "error", { ref: path }, resolve);
      }
    },
    setDoc: async ({ data }) => {
      const path = getRef(database, cleanUrl) as DocumentReference;
      try {
        const res = await path.set(data);
        onSuccess(res, "success", { ref: path }, resolve);
      } catch (e) {
        onError(e, "error", { ref: path }, resolve);
      }
    },
    addDoc: async ({ data }) => {
      const ref = getRef(database, cleanUrl) as CollectionReference;
      try {
        const docRef = await ref.add(data);
        onSuccess(data, "success", { ref: docRef }, resolve);
      } catch (e) {
        onError(e, "error", { ref }, resolve);
      }
    },
    updateDoc: async ({ data }) => {
      const path = getRef(database, cleanUrl) as DocumentReference;
      try {
        await path.update(data);
        onSuccess(data, "success", { ref: path }, resolve);
      } catch (e) {
        onError(e, "error", { ref: path }, resolve);
      }
    },
    // TODO - check if handling DeleteField for cache works.
    deleteDoc: async () => {
      const path = getRef(database, cleanUrl) as DocumentReference;
      try {
        // Precondition?
        await path.delete();
        onSuccess(null, "success", { ref: path }, resolve);
      } catch (e) {
        onError(e, "error", { ref: path }, resolve);
      }
    },
  };

  return methods;
};
