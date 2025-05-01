/* eslint-disable max-params */
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
import { getAdapterBindings } from "@hyper-fetch/core";

import { FirestoreMethodsUnion } from "adapter/types";
import {
  FirestoreConstraintsUnion,
  FirestorePermittedMethods,
  PermittedConstraints,
  SharedQueryConstraints,
} from "constraints";
import { getStatus, getOrderedResultFirestore, mapConstraint } from "utils";

type DataType = {
  constraints?: PermittedConstraints<FirestorePermittedMethods, FirestoreConstraintsUnion | SharedQueryConstraints>[];
  payload?: any;
  options?: Record<string, any>;
};

export const getFirestoreBrowserMethods = ({
  database,
  url,
  onSuccess,
  onError,
  onResponseStart,
  onRequestStart,
  onRequestEnd,
  onResponseEnd,
}: {
  database: Firestore;
  url: string;
  onSuccess: Awaited<ReturnType<typeof getAdapterBindings>>["onSuccess"];
  onError: Awaited<ReturnType<typeof getAdapterBindings>>["onError"];
  onResponseStart: Awaited<ReturnType<typeof getAdapterBindings>>["onResponseStart"];
  onRequestStart: Awaited<ReturnType<typeof getAdapterBindings>>["onRequestStart"];
  onRequestEnd: Awaited<ReturnType<typeof getAdapterBindings>>["onRequestEnd"];
  onResponseEnd: Awaited<ReturnType<typeof getAdapterBindings>>["onResponseEnd"];
}): ((methodName: FirestoreMethodsUnion, data: DataType) => Promise<void>) => {
  const [cleanUrl] = url.split("?");
  const methods = {
    getDoc: async () => {
      const path = doc(database, cleanUrl);
      const snapshot = await getDoc(path);
      const result = snapshot.data() ? { ...snapshot.data(), __key: snapshot.id } : null;
      const status = result ? "success" : "emptyResource";
      return { result, status, extra: { ref: path, snapshot } };
    },
    getDocs: async ({
      constraints = [],
    }: {
      constraints?: PermittedConstraints<
        FirestorePermittedMethods,
        FirestoreConstraintsUnion | SharedQueryConstraints
      >[];
    }) => {
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
      return { result: { ...data, __key: docRef.id }, status: "success", extra: { ref: docRef } };
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

  return async (methodName: FirestoreMethodsUnion, data: DataType) => {
    try {
      onRequestStart();
      const { result, status, extra } = await methods[methodName](data);
      onRequestEnd();
      onResponseStart();
      onSuccess({ data: result, status, extra });
      onResponseEnd();
    } catch (error) {
      onRequestEnd();
      onResponseStart();
      onError({ error, status: "error", extra: {} });
      onResponseEnd();
    }
  };
};
