import { getAdapterBindings, ResponseReturnType } from "@hyper-fetch/core";
import { Firestore } from "firebase-admin/firestore";

import { FirestoreAdapterType, FirestoreDBMethods, FirestoreQueryParams } from "./types/adapter.firestore.types";
import { FirebaseAdminAdapterTypes, FirebaseAdminDBTypes } from "./types/adapter.base.types.admin";
import { getFirestoreMethodsAdmin } from "./methods/adapter.methods.firestore.admin";
import { RealtimeDbAdapterType, RealtimeDBMethods, RealtimeDBQueryParams } from "./types/adapter.realtimedb.types";
import { getRealtimeDBMethodsAdmin } from "./methods/adapter.methods.realtime.admin";

// TODO - add pre and post validation for firebase

export const firebaseAdminAdapter = <T extends FirebaseAdminDBTypes>(database: T) => {
  const adapter: FirebaseAdminAdapterTypes<T> = async (request, requestId) => {
    const { fullUrl, onSuccess, onError } = await getAdapterBindings<RealtimeDbAdapterType | FirestoreAdapterType>(
      request,
      requestId,
      "error",
      {},
    );
    return new Promise<ResponseReturnType<any, any, FirebaseAdminAdapterTypes<T>>>((resolve) => {
      // eslint-disable-next-line no-console
      if (database instanceof Firestore) {
        const {
          method = "onSnapshot",
          queryParams,
          data,
        }: { method: FirestoreDBMethods; queryParams: FirestoreQueryParams; data } = request;
        const availableMethods = getFirestoreMethodsAdmin(request, database, fullUrl, onSuccess, onError, resolve);
        const selectedMethod = availableMethods[method];
        if (!selectedMethod) {
          throw new Error(`Cannot find method ${method} in Firestore available methods.`);
        }
        selectedMethod({
          constraints: queryParams?.constraints ? queryParams.constraints : [],
          data,
        });
      } else {
        // TODO - fix selecting realtime
        const {
          method = "onValue" as RealtimeDBMethods,
          queryParams,
          data,
        }: { method: RealtimeDBMethods; queryParams: RealtimeDBQueryParams; data } = request;
        const availableMethods = getRealtimeDBMethodsAdmin(request, database, fullUrl, onSuccess, onError, resolve);
        const selectedMethod = availableMethods[method];
        if (!selectedMethod) {
          throw new Error(`Cannot find method ${method} in Realtime database available methods.`);
        }
        selectedMethod({
          constraints: queryParams?.constraints ? queryParams.constraints : [],
          data,
        });
      }
    });
  };
  return adapter;
};
