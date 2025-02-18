import { Adapter } from "@hyper-fetch/core";
import { Database } from "firebase/database";

import {
  FirebaseDBTypes,
  FirestoreMethods,
  RealtimeDBMethods,
  FirebaseRealtimeDBType,
  FirestoreRequestType,
  FirestoreAdapterType,
} from "adapter";
import { getRealtimeDbBrowserMethods } from "realtime";
import { getFirestoreBrowserMethods } from "firestore";

export const FirebaseAdapter = <T extends FirebaseDBTypes>(database: T): FirestoreAdapterType => {
  return (
    new Adapter({
      name: "firebase",
      defaultMethod: "getDoc",
      defaultExtra: {},
      systemErrorStatus: "error",
      systemErrorExtra: {},
    }) as unknown as FirestoreAdapterType
  ).setFetcher(
    async ({ request, onSuccess, onError, onResponseStart, onResponseEnd, onRequestStart, onRequestEnd }) => {
      const fullUrl = `${request.client.url}${request.endpoint}`;

      if (database instanceof Database) {
        const { method = RealtimeDBMethods.get, queryParams, payload, options } = request as FirebaseRealtimeDBType;

        const availableMethods = getRealtimeDbBrowserMethods({
          database,
          url: fullUrl,
          onSuccess,
          onError,
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
          payload,
        });
      } else {
        const { method = FirestoreMethods.getDocs, queryParams, payload, options } = request as FirestoreRequestType;
        const availableMethods = getFirestoreBrowserMethods({
          database,
          url: fullUrl,
          onSuccess,
          onError,
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
          payload,
          options,
        });
      }
    },
  );
};
