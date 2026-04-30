import { Firestore } from "firebase-admin/firestore";

import { firestoreAdminSockets } from "../firestore";
import { realtimeSocketsAdmin } from "../realtime";
import type { FirebaseAdminDBTypes, FirebaseAdminSocketAdapterTypes } from "./types";

export const FirebaseSocketsAdminAdapter = <T extends FirebaseAdminDBTypes>(
  database: T,
): FirebaseAdminSocketAdapterTypes<T> => {
  if (database instanceof Firestore) {
    return firestoreAdminSockets(database) as unknown as FirebaseAdminSocketAdapterTypes<T>;
  }
  return realtimeSocketsAdmin(database) as unknown as FirebaseAdminSocketAdapterTypes<T>;
};
