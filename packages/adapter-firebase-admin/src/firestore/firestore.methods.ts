import type { getAdapterBindings } from "@hyper-fetch/core";
import type { FirestoreMethodsUnion } from "adapter";
import type {
  FirestoreConstraintsUnion,
  FirestorePermittedMethods,
  PermittedConstraints,
  SharedQueryConstraints,
} from "constraints";
/* eslint-disable max-params */
import type { CollectionReference, DocumentReference, DocumentSnapshot, Firestore } from "firebase-admin/firestore";
import { getStatus } from "utils";

import { applyFireStoreAdminConstraints, getOrderedResultFirestore, getRef } from "./utils";

type DataType = {
  constraints?: PermittedConstraints<FirestorePermittedMethods, FirestoreConstraintsUnion | SharedQueryConstraints>[];
  payload?: any;
  options?: Record<string, any>;
};

export const getFirestoreAdminMethods = ({
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
      const path = getRef(database, cleanUrl);
      const snapshot = (await path.get()) as DocumentSnapshot;
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
      const path = getRef(database, cleanUrl) as CollectionReference;
      const query = applyFireStoreAdminConstraints(path, constraints);
      const querySnapshot = await query.get();
      const result = getOrderedResultFirestore(querySnapshot);
      const status = getStatus(result);

      return { result, status, extra: { ref: path, snapshot: querySnapshot } };
    },
    setDoc: async ({ payload, options }: DataType) => {
      const path = getRef(database, cleanUrl) as DocumentReference;
      const merge = options?.merge === true;
      const res = await path.set(payload, { merge });
      return { result: res, status: "success", extra: { ref: path } };
    },
    addDoc: async ({ payload }: DataType) => {
      const ref = getRef(database, cleanUrl) as CollectionReference;
      const docRef = await ref.add(payload);
      return { result: { ...payload, __key: docRef.id }, status: "success", extra: { ref: docRef } };
    },
    updateDoc: async ({ payload }: DataType) => {
      const path = getRef(database, cleanUrl) as DocumentReference;
      await path.update(payload);
      return { result: payload, status: "success", extra: { ref: path } };
    },
    deleteDoc: async () => {
      const path = getRef(database, cleanUrl) as DocumentReference;
      await path.delete();
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
