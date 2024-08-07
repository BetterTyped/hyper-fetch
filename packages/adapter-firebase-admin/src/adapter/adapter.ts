import { getAdapterBindings, ResponseType } from "@hyper-fetch/core";
import { Firestore } from "firebase-admin/firestore";

import {
  FirestoreAdapterType,
  FirebaseAdminDBTypes,
  RealtimeDbAdapterType,
  FirestoreMethods,
  RealtimeDBMethods,
  RequestType,
  FirestoreRequestType,
  RealtimeDBRequestType,
} from "adapter";
import { getFirestoreAdminMethods } from "../firestore";
import { getRealtimeDbAdminMethods } from "../realtime";

export const FirebaseAdminAdapter =
  <T extends FirebaseAdminDBTypes>(database: T) =>
  () => {
    const adapter = async (request: RequestType<T>, requestId: string) => {
      const { fullUrl, onSuccess, onError, onRequestStart, onResponseEnd, onResponseStart, onRequestEnd } =
        await getAdapterBindings<RealtimeDbAdapterType | FirestoreAdapterType>({
          request,
          requestId,
          systemErrorStatus: "error",
          systemErrorExtra: {},
        });
      return new Promise<ResponseType<any, any, any>>((resolve) => {
        if (database instanceof Firestore) {
          const { method = FirestoreMethods.getDocs, queryParams, data, options } = request as FirestoreRequestType;
          const availableMethods = getFirestoreAdminMethods(database, fullUrl, onSuccess, onError, resolve, {
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
          const { method = RealtimeDBMethods.get, queryParams, data, options } = request as RealtimeDBRequestType;
          const availableMethods = getRealtimeDbAdminMethods(database, fullUrl, onSuccess, onError, resolve, {
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
