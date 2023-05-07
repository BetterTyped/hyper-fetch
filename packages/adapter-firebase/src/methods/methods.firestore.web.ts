import {
  Firestore,
  doc,
  collection,
  setDoc,
  addDoc,
  updateDoc,
  deleteDoc,
  getDoc,
  getDocs,
  onSnapshot,
  query,
  limit,
  orderBy,
  where,
  startAt,
  startAfter,
  endAt,
  endBefore,
} from "firebase/firestore";
import { RequestInstance } from "@hyper-fetch/core";

import { FirestoreDBMethods } from "adapter/types";
import { FirebaseQueryConstraints } from "constraints";
import { getStatus, isDocOrQuery, setCacheManually } from "./utils/utils.base";
import { getGroupedResultFirestore, getOrderedResultFirestore } from "./utils/utils.firestore";

const mapConstraint = ({ type, values }: { type: FirebaseQueryConstraints; values: any[] }) => {
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

export const getFirestoreMethodsWeb = <R extends RequestInstance>(
  request: R,
  database: Firestore,
  url: string,
  onSuccess,
  onError,
  resolve,
): Record<
  FirestoreDBMethods,
  (data: {
    constraints?: { type: FirebaseQueryConstraints; values: any[] }[];
    data?: any;
    options: Record<string, any>;
  }) => void
> => {
  const [cleanUrl] = url.split("?");
  const methods: Record<FirestoreDBMethods, (data) => void> = {
    onSnapshot: async ({ constraints = [], options }: { constraints: any[]; options: Record<string, any> }) => {
      let path;
      const queryType = isDocOrQuery(cleanUrl);
      if (queryType === "doc") {
        path = doc(database, cleanUrl);
      } else {
        const queryConstraints = constraints.map((constr) => mapConstraint(constr));
        path = query(collection(database, cleanUrl), ...queryConstraints);
      }
      const unsub = onSnapshot(
        path,
        (snapshot) => {
          const result = queryType === "doc" ? snapshot.data() || null : getOrderedResultFirestore(snapshot);
          const status = getStatus(result);
          const groupedResult = options?.groupByChangeType === true ? getGroupedResultFirestore(snapshot) : null;
          const additionalData = { ref: path, snapshot, unsubscribe: unsub, groupedResult };
          setCacheManually(request, { value: result, status }, additionalData);
          onSuccess(result, status, additionalData, resolve);
        },
        (error) => {
          const additionalData = { ref: path, unsubscribe: unsub };
          setCacheManually(request, { value: error, status: "error" }, additionalData);
          onError(error, "error", {}, resolve);
        },
      );
    },
    getDoc: async () => {
      const path = doc(database, cleanUrl);
      try {
        const snapshot = await getDoc(path);
        const result = snapshot.data() || null;
        const status = result ? "success" : "emptyResource";
        onSuccess(result, status, { ref: path, snapshot }, resolve);
      } catch (e) {
        onError(e, "error", { ref: path }, resolve);
      }
    },
    getDocs: async ({ constraints = [] }: { constraints: any[] }) => {
      const queryConstraints = constraints.map((constr) => mapConstraint(constr));
      const path = collection(database, cleanUrl);
      const q = query(path, ...queryConstraints);
      try {
        const querySnapshot = await getDocs(q);
        const result = getOrderedResultFirestore(querySnapshot);
        const status = getStatus(result);

        onSuccess(result, status, { ref: path, snapshot: querySnapshot }, resolve);
      } catch (e) {
        onError(e, "error", { ref: path }, resolve);
      }
    },
    setDoc: async ({ data }) => {
      const path = doc(database, cleanUrl);
      try {
        await setDoc(path, data);
        onSuccess(data, "success", { ref: path }, resolve);
      } catch (e) {
        onError(e, "error", { ref: path }, resolve);
      }
    },
    addDoc: async ({ data }) => {
      const path = collection(database, cleanUrl);
      try {
        const docRef = await addDoc(path, data);
        onSuccess(data, "success", { ref: docRef }, resolve);
      } catch (e) {
        onError(e, "error", { ref: path }, resolve);
      }
    },
    updateDoc: async ({ data }) => {
      const path = doc(database, cleanUrl);
      try {
        await updateDoc(path, data);
        onSuccess(data, "success", { ref: path }, resolve);
      } catch (e) {
        onError(e, "error", { ref: path }, resolve);
      }
    },
    deleteDoc: async () => {
      const path = doc(database, cleanUrl);
      try {
        await deleteDoc(path);
        onSuccess(null, "success", { ref: path }, resolve);
      } catch (e) {
        onError(e, "error", { ref: path }, resolve);
      }
    },
  };

  return methods;
};
