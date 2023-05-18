import { getAdapterBindings, ResponseReturnType } from "@hyper-fetch/core";
import { Firestore } from "firebase-admin/firestore";

import {
  FirestoreAdapterType,
  FirestoreDBMethods,
  FirestoreQueryParams,
  FirebaseAdminAdapterTypes,
  FirebaseAdminDBTypes,
  RealtimeDbAdapterType,
  RealtimeDBMethods,
  RealtimeDBQueryParams,
} from "adapter/types";
import { getFirestoreMethodsAdmin, getRealtimeDBMethodsAdmin } from "methods";

export const firebaseAdminAdapter = <T extends FirebaseAdminDBTypes>(database: T) => {
  const adapter: FirebaseAdminAdapterTypes<T> = async (request, requestId) => {
    const { fullUrl, onSuccess, onError, onRequestStart, onResponseEnd, onResponseStart, onRequestEnd } =
      await getAdapterBindings<RealtimeDbAdapterType | FirestoreAdapterType>(request, requestId, "error", {});
    return new Promise<ResponseReturnType<any, any, FirebaseAdminAdapterTypes<T>>>((resolve) => {
      if (database instanceof Firestore) {
        const {
          method = "onSnapshot",
          queryParams,
          data,
          options,
        }: { method: FirestoreDBMethods; queryParams: FirestoreQueryParams; data; options } = request;
        const availableMethods = getFirestoreMethodsAdmin(request, database, fullUrl, onSuccess, onError, resolve, {
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
      } else {
        const {
          method = "onValue" as RealtimeDBMethods,
          queryParams,
          data,
          options,
        }: { method: RealtimeDBMethods; queryParams: RealtimeDBQueryParams; data; options } = request;
        const availableMethods = getRealtimeDBMethodsAdmin(request, database, fullUrl, onSuccess, onError, resolve, {
          onRequestStart,
          onResponseEnd,
          onResponseStart,
          onRequestEnd,
        });
        const selectedMethod = availableMethods[method];
        if (!selectedMethod) {
          throw new Error(`Cannot find method ${method} in Realtime database available methods.`);
        }
        selectedMethod({
          constraints: queryParams?.constraints ? queryParams.constraints : [],
          options,
          data,
        });
      }
    });
  };
  return adapter;
};
