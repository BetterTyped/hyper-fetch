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
  QueryFieldFilterConstraint,
  QueryLimitConstraint,
  QueryOrderByConstraint,
  QuerySnapshot,
} from "firebase/firestore";
import { RequestInstance } from "@hyper-fetch/core";
import { QueryEndAtConstraint, QueryStartAtConstraint } from "@firebase/firestore";

import { FirestoreDBMethods } from "../types/adapter.firestore.types";
import { setCacheManually } from "../utils/set.cache.manually";

const isDocOrQuery = (fullUrl: string): string => {
  const withoutSurroundingSlashes = fullUrl.replace(/^\/|\/$/g, "");
  const pathElements = withoutSurroundingSlashes.split("/").length;
  return pathElements % 2 === 0 ? "doc" : "query";
};

const getQueryData = (snapshot: QuerySnapshot) => {
  const result = [];
  snapshot.docs.forEach((d) => {
    result.push(d.data());
  });
  return result;
};

export const getFirestoreMethods = <R extends RequestInstance>(
  request: R,
  database: Firestore,
  url: string,
  onSuccess,
  onError,
  resolve,
): Record<
  FirestoreDBMethods,
  (data: {
    constraints?: (
      | QueryLimitConstraint
      | QueryOrderByConstraint
      | QueryFieldFilterConstraint
      | QueryStartAtConstraint
      | QueryEndAtConstraint
    )[];
    data?: any;
  }) => void
> => {
  const [cleanUrl] = url.split("?");
  // TODO - handle trying to pass collection to onSnapshot and raise appropriate error. or do as a query?
  // TODO - do we want to return changed/modified/removed - listen to diff
  // TODO - what do we want to do on error
  const methods: Record<FirestoreDBMethods, (data) => void> = {
    onSnapshot: async ({
      constraints = [],
    }: {
      constraints: (QueryLimitConstraint | QueryOrderByConstraint | QueryFieldFilterConstraint)[];
    }) => {
      // includeMetadataChanges: true option
      let path;
      const queryType = isDocOrQuery(cleanUrl);
      if (queryType === "doc") {
        path = doc(database, cleanUrl);
      } else {
        path = query(collection(database, cleanUrl), ...constraints);
      }
      const unsub = onSnapshot(
        path,
        (snapshot) => {
          const additionalData = { ref: path, snapshot, unsubscribe: unsub };
          const result = queryType === "doc" ? snapshot.data() : getQueryData(snapshot);
          setCacheManually(request, { value: result, status: "success" }, additionalData);
          onSuccess(result, "success", { ref: path, snapshot, unsubscribe: unsub }, resolve);
        },
        (error) => {
          // "error" or firebase error exposed
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
        onSuccess(snapshot.data(), "success", { ref: path, snapshot }, resolve);
      } catch (e) {
        onError(e, "error", { ref: path }, resolve);
      }
    },
    getDocs: async ({
      constraints = [],
    }: {
      constraints: (QueryLimitConstraint | QueryOrderByConstraint | QueryFieldFilterConstraint)[];
    }) => {
      const path = collection(database, cleanUrl);
      const q = query(path, ...constraints);
      try {
        const querySnapshot = await getDocs(q);
        const result = [];
        querySnapshot.forEach((d) => {
          result.push(d.data());
        });
        onSuccess(result, "success", { ref: path, snapshot: querySnapshot }, resolve);
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
