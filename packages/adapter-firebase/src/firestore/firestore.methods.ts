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
import { getAdapterBindings, ResponseType } from "@hyper-fetch/core";

import { FirebaseAdapterTypes, FirebaseDBTypes, FirestoreMethodsUnion } from "adapter/types";
import {
  FirestoreConstraintsUnion,
  FirestorePermittedMethods,
  PermittedConstraints,
  SharedQueryConstraints,
} from "constraints";
import { getStatus } from "utils";
import { getOrderedResultFirestore, mapConstraint } from "./utils";

export const getFirestoreBrowserMethods = <T extends FirebaseDBTypes>(
  database: Firestore,
  url: string,
  onSuccess: Awaited<ReturnType<typeof getAdapterBindings>>["onSuccess"],
  onError: Awaited<ReturnType<typeof getAdapterBindings>>["onError"],
  resolve: (
    value:
      | ResponseType<any, any, FirebaseAdapterTypes<T>>
      | PromiseLike<ResponseType<any, any, FirebaseAdapterTypes<T>>>,
  ) => void,
  events: {
    onResponseStart: Awaited<ReturnType<typeof getAdapterBindings>>["onResponseStart"];
    onRequestStart: Awaited<ReturnType<typeof getAdapterBindings>>["onRequestStart"];
    onRequestEnd: Awaited<ReturnType<typeof getAdapterBindings>>["onRequestEnd"];
    onResponseEnd: Awaited<ReturnType<typeof getAdapterBindings>>["onResponseEnd"];
  },
): ((
  methodName: FirestoreMethodsUnion,
  data: {
    constraints?: PermittedConstraints<FirestorePermittedMethods, FirestoreConstraintsUnion | SharedQueryConstraints>[];
    payload?: any;
    options?: Record<string, any>;
  },
) => Promise<void>) => {
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

  return async (methodName: FirestoreMethodsUnion, data) => {
    try {
      events.onRequestStart();
      const { result, status, extra } = await methods[methodName](data);
      events.onRequestEnd();
      events.onResponseStart();
      onSuccess({ data: result, status, extra, resolve });
      events.onResponseEnd();
    } catch (error) {
      events.onRequestEnd();
      events.onResponseStart();
      onError({ error, status: "error", extra: {}, resolve });
      events.onResponseEnd();
    }
  };
};
