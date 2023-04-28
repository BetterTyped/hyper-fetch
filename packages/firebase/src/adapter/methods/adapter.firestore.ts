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
} from "@firebase/firestore";
import { RequestInstance } from "@hyper-fetch/core";
import {
  CollectionReference,
  DocumentReference,
  QueryFieldFilterConstraint,
  QueryLimitConstraint,
  QueryOrderByConstraint,
} from "firebase/firestore";

import { FirestoreDBMethods } from "../types/adapter.firestore.types";

const getDocOrCollectionFunction = (
  fullUrl: string,
): ((...any) => DocumentReference) | ((...any) => CollectionReference) => {
  const withoutSurroundingSlashes = fullUrl.replace(/^\/|\/$/g, "");
  const pathElements = withoutSurroundingSlashes.split("/").length;
  return pathElements % 2 === 0 ? doc : collection;
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
    constraints?: {
      limit?: QueryLimitConstraint;
      orderBy?: QueryOrderByConstraint[];
      filterBy?: QueryFieldFilterConstraint[];
    };
    data?: any;
  }) => void
> => {
  // const [fullUrl] = url.split("?");
  // TODO - handle trying to pass collection to onSnapshot and raise appropriate error. or do as a query?
  // TODO - do we want to return changed/modified/removed - listen to diff
  // TODO - what do we want to do on error
  // const referenceFunc = getDocOrCollectionFunction(fullUrl);
  const methods: Record<FirestoreDBMethods, (data) => void> = {
    onSnapshot: async () => {
      // includeMetadataChanges: true option
      // TODO - handle Query -> collection
      const path = doc(database, url);
      const unsub = onSnapshot(
        path,
        (snapshot) => {
          onSuccess(snapshot.data(), "success", { ref: path, snapshot, unsubscribe: unsub }, resolve);
        },
        (error) => {
          // "error" or firebase error exposed
          onError(error, "error", {}, resolve);
        },
      );
    },
    getDoc: async () => {
      const path = doc(database, url);
      try {
        const snapshot = await getDoc(path);
        onSuccess(snapshot.data(), "success", { ref: path, snapshot }, resolve);
      } catch (e) {
        onError(e, "error", { ref: path }, resolve);
      }
    },
    getDocs: async () => {
      const path = collection(database, url);
      try {
        const querySnapshot = await getDocs(path);
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
      const path = doc(database, url);
      try {
        await setDoc(path, data);
        onSuccess(data, "success", { ref: path }, resolve);
      } catch (e) {
        onError(e, "error", { ref: path }, resolve);
      }
    },
    addDoc: async ({ data }) => {
      const path = collection(database, url);
      try {
        const docRef = await addDoc(path, data);
        onSuccess(data, "success", { ref: docRef }, resolve);
      } catch (e) {
        onError(e, "error", { ref: path }, resolve);
      }
    },
    updateDoc: async ({ data }) => {
      const path = doc(database, url);
      try {
        await updateDoc(path, data);
        onSuccess(data, "success", { ref: path }, resolve);
      } catch (e) {
        onError(e, "error", { ref: path }, resolve);
      }
    },
    deleteDoc: async () => {
      const path = doc(database, url);
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
