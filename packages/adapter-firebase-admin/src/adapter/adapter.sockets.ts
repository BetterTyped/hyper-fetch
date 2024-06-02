import { Firestore } from "firebase-admin/firestore";

import { FirebaseAdminDBTypes, FirebaseAdminSocketAdapterTypes } from "./types";
import { firestoreAdminSockets } from "../firestore/firestore.sockets";
import { realtimeSocketsAdmin } from "../realtime/realtime.sockets";

export const FirebaseSocketsAdminAdapter = <T extends FirebaseAdminDBTypes>(
  database: T,
): FirebaseAdminSocketAdapterTypes<T> => {
  if (database instanceof Firestore) {
    return firestoreAdminSockets(database) as unknown as FirebaseAdminSocketAdapterTypes<T>;
  }
  return realtimeSocketsAdmin(database) as unknown as FirebaseAdminSocketAdapterTypes<T>;
};
