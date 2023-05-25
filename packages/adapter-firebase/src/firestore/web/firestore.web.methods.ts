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
): Record<
  FirestoreDBMethods,
  (data: {
    constraints?: { type: FirebaseQueryConstraints; values: any[] }[];
    data?: any;
    options: Record<string, any>;
  }) => void
> => {
  const [cleanUrl] = url.split("?");
  return {
    getDoc: async () => {
      const path = doc(database, cleanUrl);
      try {
        events.onRequestStart();
        const snapshot = await getDoc(path);
        events.onRequestEnd();
        events.onResponseStart();
        const result = snapshot.data() || null;
        const status = result ? "success" : "emptyResource";
        onSuccess(result, status, { ref: path, snapshot }, resolve);
      } catch (e) {
        events.onRequestEnd();
        events.onResponseStart();
        onError(e, "error", { ref: path }, resolve);
      }
      events.onResponseEnd();
    },
    getDocs: async ({ constraints = [] }) => {
      const queryConstraints = constraints.map((constr) => mapConstraint(constr));
      const path = collection(database, cleanUrl);
      const q = query(path, ...queryConstraints);
      try {
        events.onRequestStart();
        const querySnapshot = await getDocs(q);
        events.onRequestEnd();
        events.onResponseStart();
        const result = getOrderedResultFirestore(querySnapshot);
        const status = getStatus(result);

        onSuccess(result, status, { ref: path, snapshot: querySnapshot }, resolve);
      } catch (e) {
        events.onRequestEnd();
        events.onResponseStart();
        onError(e, "error", { ref: path }, resolve);
      }
      events.onResponseEnd();
    },
    setDoc: async ({ data, options }) => {
      const path = doc(database, cleanUrl);
      const merge = options?.merge === true;
      try {
        events.onRequestStart();
        await setDoc(path, data, { merge });
        events.onRequestEnd();
        events.onResponseStart();
        onSuccess(data, "success", { ref: path }, resolve);
      } catch (e) {
        events.onRequestEnd();
        events.onResponseStart();
        onError(e, "error", { ref: path }, resolve);
      }
      events.onResponseEnd();
    },
    addDoc: async ({ data }) => {
      const path = collection(database, cleanUrl);
      try {
        events.onRequestStart();
        const docRef = await addDoc(path, data);
        events.onRequestEnd();
        events.onResponseStart();
        onSuccess(data, "success", { ref: docRef }, resolve);
      } catch (e) {
        events.onRequestEnd();
        events.onResponseStart();
        onError(e, "error", { ref: path }, resolve);
      }
      events.onResponseEnd();
    },
    updateDoc: async ({ data }) => {
      const path = doc(database, cleanUrl);
      try {
        events.onRequestStart();
        await updateDoc(path, data);
        events.onRequestEnd();
        events.onResponseStart();
        onSuccess(data, "success", { ref: path }, resolve);
      } catch (e) {
        events.onRequestEnd();
        events.onResponseStart();
        onError(e, "error", { ref: path }, resolve);
      }
      events.onResponseEnd();
    },
    deleteDoc: async () => {
      const path = doc(database, cleanUrl);
      try {
        events.onRequestStart();
        await deleteDoc(path);
        events.onRequestEnd();
        events.onResponseStart();
        onSuccess(null, "success", { ref: path }, resolve);
      } catch (e) {
        events.onRequestEnd();
        events.onResponseStart();
        onError(e, "error", { ref: path }, resolve);
      }
      events.onResponseEnd();
    },
  };
};
