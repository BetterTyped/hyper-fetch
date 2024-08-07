/* eslint-disable max-params */
import { CollectionReference, DocumentReference, DocumentSnapshot, Firestore } from "firebase-admin/firestore";
import { getAdapterBindings, ResponseType } from "@hyper-fetch/core";

import { FirebaseAdminAdapterTypes, FirebaseAdminDBTypes, FirestoreMethodsUnion } from "adapter";
import { getStatus } from "utils";
import {
  FirestoreConstraintsUnion,
  FirestorePermittedMethods,
  PermittedConstraints,
  SharedQueryConstraints,
} from "constraints";
import { applyFireStoreAdminConstraints, getOrderedResultFirestore, getRef } from "./utils";

export const getFirestoreAdminMethods = <T extends FirebaseAdminDBTypes>(
  database: Firestore,
  url: string,
  onSuccess: Awaited<ReturnType<typeof getAdapterBindings>>["onSuccess"],
  onError: Awaited<ReturnType<typeof getAdapterBindings>>["onError"],
  resolve: (
    value:
      | ResponseType<any, any, FirebaseAdminAdapterTypes<T>>
      | PromiseLike<ResponseType<any, any, FirebaseAdminAdapterTypes<T>>>,
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
    data?: any;
    options?: Record<string, any>;
  },
) => Promise<void>) => {
  const [cleanUrl] = url.split("?");
  const methods = {
    getDoc: async () => {
      const path = getRef(database, cleanUrl);
      const snapshot = (await path.get()) as DocumentSnapshot;
      const result = snapshot.data() ? { ...snapshot.data(), __key: snapshot.id } : null;
      const status = result ? "success" : "emptyResource";
      return { result, status, extra: { ref: path, snapshot } };
    },
    getDocs: async ({ constraints = [] }) => {
      const path = getRef(database, cleanUrl) as CollectionReference;
      const query = applyFireStoreAdminConstraints(path, constraints);
      const querySnapshot = await query.get();
      const result = getOrderedResultFirestore(querySnapshot);
      const status = getStatus(result);

      return { result, status, extra: { ref: path, snapshot: querySnapshot } };
    },
    setDoc: async ({ data, options }: { data?: any; options?: Record<string, any> }) => {
      const path = getRef(database, cleanUrl) as DocumentReference;
      const merge = options?.merge === true;
      const res = await path.set(data, { merge });
      return { result: res, status: "success", extra: { ref: path } };
    },
    addDoc: async ({ data }: { data?: any }) => {
      const ref = getRef(database, cleanUrl) as CollectionReference;
      const docRef = await ref.add(data);
      return { result: { ...data, __key: docRef.id }, status: "success", extra: { ref: docRef } };
    },
    updateDoc: async ({ data }: { data?: any }) => {
      const path = getRef(database, cleanUrl) as DocumentReference;
      await path.update(data);
      return { result: data, status: "success", extra: { ref: path } };
    },
    deleteDoc: async () => {
      const path = getRef(database, cleanUrl) as DocumentReference;
      await path.delete();
      return { result: null, status: "success", extra: { ref: path } };
    },
  };

  return async (methodName: FirestoreMethodsUnion, data?) => {
    try {
      events.onRequestStart();
      const { result, status, extra } = await methods[methodName](data as any);
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
