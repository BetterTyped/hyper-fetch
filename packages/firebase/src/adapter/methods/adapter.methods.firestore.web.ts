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
  QuerySnapshot,
} from "firebase/firestore";
import { RequestInstance } from "@hyper-fetch/core";
import { limit, orderBy, where, startAt, startAfter, endAt, endBefore } from "@firebase/firestore";

import { FirestoreDBMethods } from "../types/adapter.firestore.types";
import { setCacheManually } from "../utils/set.cache.manually";
import { FirebaseQueryConstraints } from "../constraints/constraints.firebase";

const isDocOrQuery = (fullUrl: string): string => {
  const withoutSurroundingSlashes = fullUrl.replace(/^\/|\/$/g, "");
  const pathElements = withoutSurroundingSlashes.split("/").length;
  return pathElements % 2 === 0 ? "doc" : "query";
};

const getStatus = (res: any) => {
  return (Array.isArray(res) && res.length === 0) || res == null ? "emptyResource" : "success";
};

const getQueryData = (snapshot: QuerySnapshot) => {
  const result = [];
  snapshot.docs.forEach((d) => {
    result.push(d.data());
  });
  return result.length > 0 ? result : null;
};

const parseConstraint = ({ type, values }: { type: FirebaseQueryConstraints; values: any[] }) => {
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
  (data: { constraints?: { type: FirebaseQueryConstraints; values: any[] }[]; data?: any }) => void
> => {
  const [cleanUrl] = url.split("?");
  // TODO - do we want to return changed/modified/removed - listen to diff
  const methods: Record<FirestoreDBMethods, (data) => void> = {
    onSnapshot: async ({ constraints = [] }: { constraints: any[] }) => {
      // includeMetadataChanges: true option
      let path;
      const queryType = isDocOrQuery(cleanUrl);
      if (queryType === "doc") {
        path = doc(database, cleanUrl);
      } else {
        const queryConstraints = constraints.map((constr) => parseConstraint(constr));
        path = query(collection(database, cleanUrl), ...queryConstraints);
      }
      const unsub = onSnapshot(
        path,
        (snapshot) => {
          const additionalData = { ref: path, snapshot, unsubscribe: unsub };
          const result = queryType === "doc" ? snapshot.data() || null : getQueryData(snapshot);
          const status = getStatus(result);
          setCacheManually(request, { value: result, status }, additionalData);
          onSuccess(result, status, { ref: path, snapshot, unsubscribe: unsub }, resolve);
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
      const queryConstraints = constraints.map((constr) => parseConstraint(constr));
      const path = collection(database, cleanUrl);
      const q = query(path, ...queryConstraints);
      try {
        const querySnapshot = await getDocs(q);
        const result = getQueryData(querySnapshot);
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