import { Adapter } from "@hyper-fetch/core";
import type { FirebaseDBTypes, FirebaseAdapterTypes, FirebaseRealtimeDBType, FirestoreRequestType } from "adapter";
import { FirestoreMethods, RealtimeDBMethods } from "adapter";
import { createFirestoreConstraints, createRealtimeConstraints, getConstraints, resolveConstraints } from "constraints";
import { Database } from "firebase/database";
import { getFirestoreBrowserMethods } from "firestore";
import { getRealtimeDbBrowserMethods } from "realtime";

/**
 * Request adapter for the Firebase Web SDK. Pass a Firestore or Realtime Database instance and the adapter picks the
 * matching methods and types.
 *
 * - Firestore methods: `getDoc` (default), `getDocs`, `addDoc`, `setDoc`, `updateDoc`, `deleteDoc`
 * - Realtime Database methods: `get` (default), `set`, `push`, `update`, `remove`
 *
 * The full path is `client.url + endpoint`. Constraints go in `queryParams` as an array. Firebase errors resolve the
 * request with `status: "error"`; `send()` never rejects.
 *
 * @param database - Instance from `getFirestore()` or `getDatabase()`
 * @example
 * const client = new Client({ url: "teas/" }).setAdapter(FirebaseAdapter(getFirestore(app)));
 * const getTeas = client.createRequest<{ response: Tea[]; queryParams?: FirestoreQueryParams }>()({
 *   endpoint: "",
 *   method: "getDocs",
 * });
 * const { data } = await getTeas.send({ queryParams: [$where("type", "==", "Green"), $limit(20)] });
 */
export const FirebaseAdapter = <T extends FirebaseDBTypes>(database: T): FirebaseAdapterTypes<T> => {
  const adapter = new Adapter({
    name: "firebase",
    // Requests without a method read: `getDoc` in Firestore, `get` in Realtime Database
    defaultMethod: database instanceof Database ? RealtimeDBMethods.get : FirestoreMethods.getDoc,
    defaultExtra: {},
    systemErrorStatus: "error",
    systemErrorExtra: {},
  })
    // A `queryParams` callback gets a typed constraints chain; requests store the constraints it collected
    .setQueryParamsResolver(
      resolveConstraints(database instanceof Database ? createRealtimeConstraints : createFirestoreConstraints),
    )
    .setFetcher(
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
            constraints: getConstraints(queryParams),
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
            constraints: getConstraints(queryParams),
            payload,
            options,
          });
        }
      },
    );

  return adapter as unknown as FirebaseAdapterTypes<T>;
};
