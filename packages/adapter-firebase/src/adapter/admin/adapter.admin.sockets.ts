import { Firestore } from "firebase-admin/firestore";

import { FirebaseAdminDBTypes } from "./adapter.admin.types";
import { realtimeSocketsAdmin } from "../../realtime/admin/realtime.admin.sockets";

export const firebaseSocketsAdminAdapter = <T extends FirebaseAdminDBTypes>(database: T) => {
  if (database instanceof Firestore) {
    return null;
  }
  return realtimeSocketsAdmin(database);
};
