import { Firestore } from "firebase-admin/firestore";

import { firestoreAdminSockets } from "../firestore";
import { realtimeSocketsAdmin } from "../realtime";
import type { FirebaseAdminDBTypes, FirebaseAdminSocketAdapterTypes } from "./types";

/**
 * Socket adapter for live data from the Firebase Admin SDK: Firestore `onSnapshot` or Realtime Database `on("value")`.
 *
 * Create one adapter per socket. The listener topic is appended to `socket.url`, listener `options` take `constraints`
 * plus `groupByChangeType` (Firestore) or `onlyOnce` (Realtime Database), and every snapshot is delivered as the full
 * current result. The Firestore socket cannot `connect()` or `disconnect()`; stop listeners with the function `listen()`
 * returns.
 *
 * @param database - Instance from `getFirestore()` or `getDatabase()` of `firebase-admin`
 * @example
 * const socket = new Socket({ url: "jobs/", adapter: FirebaseSocketsAdminAdapter(getFirestore()) });
 * const onQueued = socket.createListener<Job[]>()({
 *   topic: "",
 *   options: { constraints: [$where("state", "==", "queued")] },
 * });
 * const stop = onQueued.listen(({ data }) => process(data));
 */
export const FirebaseSocketsAdminAdapter = <T extends FirebaseAdminDBTypes>(
  database: T,
): FirebaseAdminSocketAdapterTypes<T> => {
  if (database instanceof Firestore) {
    return firestoreAdminSockets(database) as unknown as FirebaseAdminSocketAdapterTypes<T>;
  }
  return realtimeSocketsAdmin(database) as unknown as FirebaseAdminSocketAdapterTypes<T>;
};
