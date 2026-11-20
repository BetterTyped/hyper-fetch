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

/**
 * Request adapter for the Firebase Admin SDK. Pass a Firestore or Realtime Database instance from `firebase-admin` and
 * the adapter picks the matching methods and types. Admin access bypasses security rules.
 *
 * - Firestore methods: `getDoc` (default), `getDocs`, `addDoc`, `setDoc`, `updateDoc`, `deleteDoc`
 * - Realtime Database methods: `get` (default), `set`, `push`, `update`, `remove`
 *
 * The full path is `client.url + endpoint`. Constraints go in `queryParams` as an array. Firebase errors resolve the
 * request with `status: "error"`; `send()` never rejects.
 *
 * @param database - Instance from `getFirestore()` or `getDatabase()` of `firebase-admin`
 * @example
 * const client = new Client({ url: "orders/" }).setAdapter(FirebaseAdminAdapter(getFirestore()));
 * const getOpenOrders = client.createRequest<{ response: Order[]; queryParams?: FirestoreQueryParams }>()({
 *   endpoint: "",
 *   method: "getDocs",
 * });
 * const { data } = await getOpenOrders.send({ queryParams: [$where("status", "==", "open")] });
 */
export const FirebaseAdminAdapter = <T extends FirebaseAdminDBTypes>(database: T): FirebaseAdminAdapterTypes<T> => {
  const adapter = new Adapter({
    name: "firebase-admin",
    // Requests without a method read: `getDoc` in Firestore, `get` in Realtime Database
    defaultMethod: database instanceof Firestore ? FirestoreMethods.getDoc : RealtimeDBMethods.get,
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
          constraints: queryParams ?? [],
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
          constraints: queryParams ?? [],
          options,
          payload,
        });
      }
    },
  );

  return adapter as unknown as FirebaseAdminAdapterTypes<T>;
};
