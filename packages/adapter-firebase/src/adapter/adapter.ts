import { Adapter } from "@hyper-fetch/core";
import type { FirebaseDBTypes, FirebaseAdapterTypes, FirebaseRealtimeDBType, FirestoreRequestType } from "adapter";
import { FirestoreMethods, RealtimeDBMethods } from "adapter";
import { Database } from "firebase/database";
import { getFirestoreBrowserMethods } from "firestore";
import { getRealtimeDbBrowserMethods } from "realtime";

export const FirebaseAdapter = <T extends FirebaseDBTypes>(database: T): FirebaseAdapterTypes<T> => {
  const adapter = new Adapter({
    name: "firebase",
    defaultMethod: "getDoc",
    defaultExtra: {},
    systemErrorStatus: "error",
    systemErrorExtra: {},
  }).setFetcher(
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

  return adapter as unknown as FirebaseAdapterTypes<T>;
};
