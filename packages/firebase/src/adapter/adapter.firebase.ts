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

import { getRealtimeDBMethods } from "./methods/adapter.realtime";
import { getFirestoreMethods } from "./methods/adapter.firestore";
import { FirebaseAdapterTypes, FirebaseDBTypes } from "./types/adapter.base.types";
import { RealtimeDBMethods, RealtimeDBQueryParams } from "./types/adapter.realtimedb.types";
import { FirestoreDBMethods, FirestoreQueryParams } from "./types/adapter.firestore.types";

// TODO - add pre and post validation for firebase

export const firebaseAdapter = <T extends FirebaseDBTypes>(database: T) => {
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
          const availableMethods = getRealtimeDBMethods(request, database, fullUrl, onSuccess, onError, resolve);
          const selectedMethod = availableMethods[method];
          if (!selectedMethod) {
            throw new Error(`Cannot find method ${method} in Realtime DB available methods.`);
          }
          selectedMethod({
            constraints: { filterBy: queryParams?.filterBy || [], orderBy: queryParams?.orderBy || null },
            data,
          });
        }
        if (database instanceof Firestore) {
          const {
            method = "onSnapshot",
            queryParams,
            data,
          }: { method: FirestoreDBMethods; queryParams: FirestoreQueryParams; data } = request;
          const availableMethods = getFirestoreMethods(request, database, fullUrl, onSuccess, onError, resolve);
          const selectedMethod = availableMethods[method];
          if (!selectedMethod) {
            throw new Error(`Cannot find method ${method} in Firestore available methods.`);
          }
          selectedMethod({
            constraints: {
              filterBy: queryParams?.filterBy || [],
              orderBy: queryParams?.orderBy || [],
              limit: queryParams?.limit || null,
            },
            data,
          });
        }
      },
    );
  };
  return adapter;
};
