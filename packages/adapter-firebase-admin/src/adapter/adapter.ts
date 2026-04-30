import { Adapter } from "@hyper-fetch/core";
import type {
  FirebaseAdminDBTypes,
  FirebaseAdminAdapterTypes,
  FirestoreRequestType,
  RealtimeDBRequestType,
} from "adapter";
import { FirestoreMethods, RealtimeDBMethods } from "adapter";
import { Firestore } from "firebase-admin/firestore";

import { getFirestoreAdminMethods } from "../firestore";
import { getRealtimeDbAdminMethods } from "../realtime";

export const FirebaseAdminAdapter = <T extends FirebaseAdminDBTypes>(database: T): FirebaseAdminAdapterTypes<T> => {
  const adapter = new Adapter({
    name: "firebase-admin",
    defaultMethod: "getDoc",
    defaultExtra: {},
    systemErrorStatus: "error",
    systemErrorExtra: {},
  }).setFetcher(
    async ({ request, onSuccess, onError, onResponseStart, onResponseEnd, onRequestStart, onRequestEnd }) => {
      const fullUrl = `${request.client.url}${request.endpoint}`;
      if (database instanceof Firestore) {
        const { method = FirestoreMethods.getDocs, queryParams, payload, options } = request as FirestoreRequestType;
        const availableMethods = getFirestoreAdminMethods({
          database,
          url: fullUrl,
          onSuccess,
          onError,
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
          payload,
          options,
        });
      } else {
        const { method = RealtimeDBMethods.get, queryParams, payload, options } = request as RealtimeDBRequestType;
        const availableMethods = getRealtimeDbAdminMethods({
          database,
          url: fullUrl,
          onSuccess,
          onError,
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
          payload,
        });
      }
    },
  );

  return adapter as unknown as FirebaseAdminAdapterTypes<T>;
};
