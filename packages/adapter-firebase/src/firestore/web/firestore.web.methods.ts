import {
  addDoc,
  collection,
  deleteDoc,
  doc,
  Firestore,
  getDoc,
  getDocs,
  query,
  setDoc,
  updateDoc,
} from "firebase/firestore";
import { RequestInstance } from "@hyper-fetch/core";

import { FirestoreDBMethods } from "adapter/types";
import { FirebaseQueryConstraints } from "constraints";
import { getStatus } from "utils";
import { getOrderedResultFirestore } from "../firestore.utils";
import { mapConstraint } from "./firestore.web.utils";

export const getFirestoreMethodsWeb = <R extends RequestInstance>(
  request: R,
  database: Firestore,
  url: string,
  onSuccess,
  onError,
  resolve,
  events: { onResponseStart; onRequestStart; onRequestEnd; onResponseEnd },
): ((
  methodName: FirestoreDBMethods,
  data: {
    constraints?: { type: FirebaseQueryConstraints; values: any[] }[];
    data?: any;
    options?: Record<string, any>;
  },
) => Promise<void>) => {
  const [cleanUrl] = url.split("?");
  const methods = {
    getDoc: async () => {
      const path = doc(database, cleanUrl);
      const snapshot = await getDoc(path);
      const result = snapshot.data() || null;
      const status = result ? "success" : "emptyResource";
      return { result, status, extra: { ref: path, snapshot } };
    },
    getDocs: async ({ constraints = [] }: { constraints?: { type: FirebaseQueryConstraints; values: any[] }[] }) => {
      const queryConstraints = constraints.map((constr) => mapConstraint(constr));
      const path = collection(database, cleanUrl);
      const q = query(path, ...queryConstraints);
      const querySnapshot = await getDocs(q);
      const result = getOrderedResultFirestore(querySnapshot);
      const status = getStatus(result);
      return { result, status, extra: { ref: path, snapshot: querySnapshot } };
    },
    setDoc: async ({ data, options }: { data?: any; options?: any }) => {
      const path = doc(database, cleanUrl);
      const merge = options?.merge === true;
      await setDoc(path, data, { merge });
      return { result: data, status: "success", extra: { ref: path } };
    },
    addDoc: async ({ data }: { data?: any }) => {
      const path = collection(database, cleanUrl);
      const docRef = await addDoc(path, data);
      return { result: data, status: "success", extra: { ref: docRef } };
    },
    updateDoc: async ({ data }: { data?: any }) => {
      const path = doc(database, cleanUrl);
      await updateDoc(path, data);
      return { result: data, status: "success", extra: { ref: path } };
    },
    deleteDoc: async () => {
      const path = doc(database, cleanUrl);
      await deleteDoc(path);
      return { result: null, status: "success", extra: { ref: path } };
    },
  };

  return async (methodName: FirestoreDBMethods, data) => {
    try {
      events.onRequestStart();
      const { result, status, extra } = await methods[methodName](data);
      events.onRequestEnd();
      events.onResponseStart();
      onSuccess(result, status, extra, resolve);
      events.onResponseEnd();
    } catch (e) {
      events.onRequestEnd();
      events.onResponseStart();
      onError(e, "error", {}, resolve);
      events.onResponseEnd();
    }
  };
};
