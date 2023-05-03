import {
  ExtractAdapterType,
  ExtractErrorType,
  ExtractResponseType,
  getAdapterBindings,
  RequestInstance,
  ResponseReturnType,
} from "@hyper-fetch/core";
import { Database } from "firebase/database";
import { Firestore } from "firebase/firestore";

import { getRealtimeDBMethodsWeb } from "./methods/adapter.methods.realtime.web";
import { FirebaseAdapterTypes, FirebaseWebDBTypes } from "./types/adapter.base.types.web";
import { RealtimeDBMethods, RealtimeDBQueryParams } from "./types/adapter.realtimedb.types";
import { FirestoreDBMethods, FirestoreQueryParams } from "./types/adapter.firestore.types";
import { getFirestoreMethodsWeb } from "./methods/adapter.methods.firestore.web";

// TODO - add pre and post validation for firebase

export const firebaseWebAdapter = <T extends FirebaseWebDBTypes>(database: T) => {
  const adapter: FirebaseAdapterTypes<T> = async <R extends RequestInstance>(request: R, requestId: string) => {
    const { fullUrl, onSuccess, onError } = await getAdapterBindings(request, requestId, 0, {});
    return new Promise<ResponseReturnType<ExtractResponseType<R>, ExtractErrorType<R>, ExtractAdapterType<R>>>(
      (resolve) => {
        // eslint-disable-next-line no-console
        if (database instanceof Database) {
          const {
            method = "onValue" as RealtimeDBMethods,
            queryParams,
            data,
          }: { method: RealtimeDBMethods; queryParams: RealtimeDBQueryParams; data } = request;
          const availableMethods = getRealtimeDBMethodsWeb(request, database, fullUrl, onSuccess, onError, resolve);
          const selectedMethod = availableMethods[method];
          if (!selectedMethod) {
            throw new Error(`Cannot find method ${method} in Realtime DB available methods.`);
          }
          selectedMethod({
            constraints: queryParams?.constraints || [],
            data,
          });
        }
        if (database instanceof Firestore) {
          const {
            method = "onSnapshot",
            queryParams,
            data,
          }: { method: FirestoreDBMethods; queryParams: FirestoreQueryParams; data } = request;
          const availableMethods = getFirestoreMethodsWeb(request, database, fullUrl, onSuccess, onError, resolve);
          const selectedMethod = availableMethods[method];
          if (!selectedMethod) {
            throw new Error(`Cannot find method ${method} in Firestore available methods.`);
          }
          selectedMethod({
            constraints: queryParams?.constraints ? queryParams.constraints : [],
            data,
          });
        }
      },
    );
  };
  return adapter;
};
