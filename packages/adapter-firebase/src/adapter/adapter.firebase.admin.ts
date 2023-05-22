import { getAdapterBindings, ResponseReturnType } from "@hyper-fetch/core";

import {
  FirestoreAdapterType,
  FirestoreDBMethods,
  FirestoreQueryParams,
  FirebaseAdminAdapterTypes,
  FirebaseAdminDBTypes,
} from "adapter/types";
import { getFirestoreMethodsAdmin } from "methods";

export const firebaseAdminAdapter = <T extends FirebaseAdminDBTypes>(firestore: T) => {
  const adapter: FirebaseAdminAdapterTypes = async (request, requestId) => {
    const { fullUrl, onSuccess, onError, onRequestStart, onResponseEnd, onResponseStart, onRequestEnd } =
      await getAdapterBindings<FirestoreAdapterType>(request, requestId, "error", {});
    return new Promise<ResponseReturnType<any, any, FirebaseAdminAdapterTypes>>((resolve) => {
      const {
        method = "onSnapshot",
        queryParams,
        data,
        options,
      }: { method: FirestoreDBMethods; queryParams: FirestoreQueryParams; data; options } = request;
      const availableMethods = getFirestoreMethodsAdmin(request, firestore, fullUrl, onSuccess, onError, resolve, {
        onRequestStart,
        onResponseEnd,
        onResponseStart,
        onRequestEnd,
      });
      const selectedMethod = availableMethods[method];
      if (!selectedMethod) {
        throw new Error(`Cannot find method ${method} in Firestore available methods.`);
      }
      selectedMethod({
        constraints: queryParams?.constraints ? queryParams.constraints : [],
        data,
        options,
      });
    });
  };
  return adapter;
};
