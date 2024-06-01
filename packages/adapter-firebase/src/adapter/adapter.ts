import { getAdapterBindings, ResponseType } from "@hyper-fetch/core";
import { Database } from "firebase/database";

import {
  FirebaseBrowserAdapterTypes,
  FirebaseBrowserDBTypes,
  RealtimeDbAdapterType,
  RealtimeDBMethodsUnion,
  RealtimeDBQueryParams,
  FirestoreAdapterType,
  FirestoreMethodsUnion,
  FirestoreQueryParams,
  FirestoreMethods,
  RealtimeDBMethods,
} from "adapter";
import { getRealtimeDbBrowserMethods } from "realtime";
import { getFirestoreBrowserMethods } from "firestore";

export const firebaseAdapter =
  <T extends FirebaseBrowserDBTypes>(database: T) =>
  () => {
    const adapter: FirebaseBrowserAdapterTypes<T> = async (request, requestId) => {
      const { fullUrl, onSuccess, onError, onResponseStart, onResponseEnd, onRequestStart, onRequestEnd } =
        await getAdapterBindings<RealtimeDbAdapterType | FirestoreAdapterType>(request, requestId, "error", {});
      return new Promise<ResponseType<any, any, FirebaseBrowserAdapterTypes<T>>>((resolve) => {
        if (database instanceof Database) {
          const {
            method = RealtimeDBMethods.get,
            queryParams,
            data,
            options,
          }: { method: RealtimeDBMethodsUnion; queryParams: RealtimeDBQueryParams; data; options } = request;
          const availableMethods = getRealtimeDbBrowserMethods(
            request,
            database,
            fullUrl,
            onSuccess,
            onError,
            resolve,
            {
              onResponseStart,
              onResponseEnd,
              onRequestStart,
              onRequestEnd,
            },
          );
          if (!Object.values(RealtimeDBMethods).includes(method)) {
            throw new Error(`Cannot find method ${method} in Realtime database available methods.`);
          }
          availableMethods(method, {
            constraints: queryParams?.constraints || [],
            options,
            data,
          });
        } else {
          const {
            method = FirestoreMethods.getDocs,
            queryParams,
            data,
            options,
          }: { method: FirestoreMethodsUnion; queryParams: FirestoreQueryParams; data; options } = request;
          const availableMethods = getFirestoreBrowserMethods(request, database, fullUrl, onSuccess, onError, resolve, {
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
