import { getAdapterBindings, ResponseReturnType } from "@hyper-fetch/core";
import { Database } from "firebase/database";
import { Firestore } from "firebase/firestore";

import { getRealtimeDBMethodsWeb, getFirestoreMethodsWeb } from "methods";
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

export const firebaseWebAdapter = <T extends FirebaseWebDBTypes>(database: T) => {
  const adapter: FirebaseWebAdapterTypes<T> = async (request, requestId) => {
    const { fullUrl, onSuccess, onError } = await getAdapterBindings<RealtimeDbAdapterType | FirestoreAdapterType>(
      request,
      requestId,
      "error",
      {},
    );
    return new Promise<ResponseReturnType<any, any, FirebaseWebAdapterTypes<T>>>((resolve) => {
      // eslint-disable-next-line no-console
      if (database instanceof Database) {
        const {
          method = "onValue" as RealtimeDBMethods,
          queryParams,
          data,
          options,
        }: { method: RealtimeDBMethods; queryParams: RealtimeDBQueryParams; data; options } = request;
        const availableMethods = getRealtimeDBMethodsWeb(request, database, fullUrl, onSuccess, onError, resolve);
        const selectedMethod = availableMethods[method];
        if (!selectedMethod) {
          throw new Error(`Cannot find method ${method} in Realtime DB available methods.`);
        }
        selectedMethod({
          constraints: queryParams?.constraints || [],
          options,
          data,
        });
      }
      if (database instanceof Firestore) {
        const {
          method = "onSnapshot",
          queryParams,
          data,
          options,
        }: { method: FirestoreDBMethods; queryParams: FirestoreQueryParams; data; options } = request;
        const availableMethods = getFirestoreMethodsWeb(request, database, fullUrl, onSuccess, onError, resolve);
        const selectedMethod = availableMethods[method];
        if (!selectedMethod) {
          throw new Error(`Cannot find method ${method} in Firestore available methods.`);
        }
        selectedMethod({
          constraints: queryParams?.constraints ? queryParams.constraints : [],
          data,
          options,
        });
      }
    });
  };
  return adapter;
};
