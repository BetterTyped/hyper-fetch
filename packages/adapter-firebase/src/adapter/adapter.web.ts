import { getAdapterBindings, ResponseReturnType } from "@hyper-fetch/core";
import { Database } from "firebase/database";
import { Firestore } from "firebase/firestore";

import {
  FirebaseWebAdapterTypes,
  FirebaseWebDBTypes,
  RealtimeDbAdapterType,
  RealtimeDBMethods,
  RealtimeDBQueryParams,
  FirestoreAdapterType,
  FirestoreDBMethods,
  FirestoreQueryParams,
} from "adapter/types";
import { getRealtimeDBMethodsWeb } from "realtime";
import { getFirestoreMethodsWeb } from "firestore";

export const adapterWeb = <T extends FirebaseWebDBTypes>(database: T) => {
  const adapter: FirebaseWebAdapterTypes<T> = async (request, requestId) => {
    const { fullUrl, onSuccess, onError, onResponseStart, onResponseEnd, onRequestStart, onRequestEnd } =
      await getAdapterBindings<RealtimeDbAdapterType | FirestoreAdapterType>(request, requestId, "error", {});
    return new Promise<ResponseReturnType<any, any, FirebaseWebAdapterTypes<T>>>((resolve) => {
      if (database instanceof Database) {
        const {
          method = "get" as RealtimeDBMethods,
          queryParams,
          data,
          options,
        }: { method: RealtimeDBMethods; queryParams: RealtimeDBQueryParams; data; options } = request;
        const availableMethods = getRealtimeDBMethodsWeb(request, database, fullUrl, onSuccess, onError, resolve, {
          onResponseStart,
          onResponseEnd,
          onRequestStart,
          onRequestEnd,
        });
        // TODO add check with enum
        // if (!selectedMethod) {
        //   throw new Error(`Cannot find method ${method} in Realtime DB available methods.`);
        // }
        availableMethods(method, {
          constraints: queryParams?.constraints || [],
          options,
          data,
        });
      }
      if (database instanceof Firestore) {
        const {
          method = "getDocs",
          queryParams,
          data,
          options,
        }: { method: FirestoreDBMethods; queryParams: FirestoreQueryParams; data; options } = request;
        const availableMethods = getFirestoreMethodsWeb(request, database, fullUrl, onSuccess, onError, resolve, {
          onResponseStart,
          onResponseEnd,
          onRequestStart,
          onRequestEnd,
        });
        // TODO add check with enum
        // if (!selectedMethod) {
        //   throw new Error(`Cannot find method ${method} in Firestore available methods.`);
        // }
        availableMethods(method, {
          constraints: queryParams?.constraints ? queryParams.constraints : [],
          data,
          options,
        });
      }
    });
  };
  return adapter;
};
