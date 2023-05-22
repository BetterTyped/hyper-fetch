import { getAdapterBindings, ResponseReturnType } from "@hyper-fetch/core";

import { getFirestoreMethodsWeb } from "methods";
import {
  FirebaseWebAdapterTypes,
  FirebaseWebDBTypes,
  FirestoreAdapterType,
  FirestoreDBMethods,
  FirestoreQueryParams,
} from "adapter/types";

export const firebaseWebAdapter = <T extends FirebaseWebDBTypes>(firestore: T) => {
  const adapter: FirebaseWebAdapterTypes = async (request, requestId) => {
    const { fullUrl, onSuccess, onError, onResponseStart, onResponseEnd, onRequestStart, onRequestEnd } =
      await getAdapterBindings<FirestoreAdapterType>(request, requestId, "error", {});
    return new Promise<ResponseReturnType<any, any, FirebaseWebAdapterTypes>>((resolve) => {
      const {
        method = "onSnapshot",
        queryParams,
        data,
        options,
      }: { method: FirestoreDBMethods; queryParams: FirestoreQueryParams; data; options } = request;
      const availableMethods = getFirestoreMethodsWeb(request, firestore, fullUrl, onSuccess, onError, resolve, {
        onResponseStart,
        onResponseEnd,
        onRequestStart,
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
