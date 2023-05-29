import { getAdapterBindings, ResponseReturnType } from "@hyper-fetch/core";
import { Firestore } from "firebase-admin/firestore";

import {
  FirestoreAdapterType,
  FirestoreMethodsUnion,
  FirestoreQueryParams,
  FirebaseAdminAdapterTypes,
  FirebaseAdminDBTypes,
  RealtimeDbAdapterType,
  RealtimeDBMethodsUnion,
  RealtimeDBQueryParams,
  FirestoreMethods,
  RealtimeDBMethods,
} from "adapter";
import { getFirestoreAdminMethods } from "firestore";
import { getRealtimeDbAdminMethods } from "realtime";

export const firebaseAdminAdapter = <T extends FirebaseAdminDBTypes>(database: T) => {
  const adapter: FirebaseAdminAdapterTypes<T> = async (request, requestId) => {
    const { fullUrl, onSuccess, onError, onRequestStart, onResponseEnd, onResponseStart, onRequestEnd } =
      await getAdapterBindings<RealtimeDbAdapterType | FirestoreAdapterType>(request, requestId, "error", {});
    return new Promise<ResponseReturnType<any, any, FirebaseAdminAdapterTypes<T>>>((resolve) => {
      if (database instanceof Firestore) {
        const {
          method = FirestoreMethods.getDocs,
          queryParams,
          data,
          options,
        }: { method: FirestoreMethodsUnion; queryParams: FirestoreQueryParams; data; options } = request;
        const availableMethods = getFirestoreAdminMethods(request, database, fullUrl, onSuccess, onError, resolve, {
          onRequestStart,
          onResponseEnd,
          onResponseStart,
          onRequestEnd,
        });
        if (!Object.values(FirestoreMethods).includes(method)) {
          throw new Error(`Cannot find method ${method} in Firestore available methods.`);
        }
        availableMethods(method, {
          constraints: queryParams?.constraints ? queryParams.constraints : [],
          data,
          options,
        });
      } else {
        const {
          method = RealtimeDBMethods.get,
          queryParams,
          data,
          options,
        }: { method: RealtimeDBMethodsUnion; queryParams: RealtimeDBQueryParams; data; options } = request;
        const availableMethods = getRealtimeDbAdminMethods(request, database, fullUrl, onSuccess, onError, resolve, {
          onRequestStart,
          onResponseEnd,
          onResponseStart,
          onRequestEnd,
        });
        if (!Object.values(RealtimeDBMethods).includes(method)) {
          throw new Error(`Cannot find method ${method} in Realtime database available methods.`);
        }
        availableMethods(method, {
          constraints: queryParams?.constraints ? queryParams.constraints : [],
          options,
          data,
        });
      }
    });
  };
  return adapter;
};
