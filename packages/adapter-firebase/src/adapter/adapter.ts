import { getAdapterBindings, ResponseType } from "@hyper-fetch/core";
import { Database } from "firebase/database";

import {
  FirebaseDBTypes,
  RealtimeDbAdapterType,
  FirestoreAdapterType,
  FirestoreMethods,
  RealtimeDBMethods,
  FirebaseRequestType,
  FirebaseRealtimeDBType,
  FirestoreRequestType,
} from "adapter";
import { getRealtimeDbBrowserMethods } from "realtime";
import { getFirestoreBrowserMethods } from "firestore";

// TODO - check ResponseType
export const FirebaseAdapter = <T extends FirebaseDBTypes>(database: T) => {
  return () => {
    const adapter = async (request: FirebaseRequestType<T>, requestId: string) => {
      const { fullUrl, onSuccess, onError, onResponseStart, onResponseEnd, onRequestStart, onRequestEnd } =
        await getAdapterBindings<RealtimeDbAdapterType | FirestoreAdapterType>({
          request,
          requestId,
          systemErrorStatus: "error",
          systemErrorExtra: {},
        });
      return new Promise<ResponseType<any, any, any>>((resolve) => {
        if (database instanceof Database) {
          const { method = RealtimeDBMethods.get, queryParams, data, options } = request as FirebaseRealtimeDBType;
          const availableMethods = getRealtimeDbBrowserMethods(database, fullUrl, onSuccess, onError, resolve, {
            onResponseStart,
            onResponseEnd,
            onRequestStart,
            onRequestEnd,
          });
          if (!Object.values(RealtimeDBMethods).includes(method)) {
            throw new Error(`Cannot find method ${method} in Realtime database available methods.`);
          }
          availableMethods(method, {
            constraints: queryParams?.constraints || [],
            options,
            data,
          });
        } else {
          const { method = FirestoreMethods.getDocs, queryParams, data, options } = request as FirestoreRequestType;
          const availableMethods = getFirestoreBrowserMethods(database, fullUrl, onSuccess, onError, resolve, {
            onResponseStart,
            onResponseEnd,
            onRequestStart,
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
        }
      });
    };
    return adapter;
  };
};
