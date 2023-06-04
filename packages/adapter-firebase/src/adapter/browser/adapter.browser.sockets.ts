import { Database } from "firebase/database";
import { Firestore } from "firebase/firestore";

import { FirebaseBrowserDBTypes, FirebaseBrowserSocketAdapterTypes } from "adapter";
import { realtimeSockets } from "realtime";
import { firestoreSockets } from "firestore";

export const firebaseSocketsAdapter = <T extends FirebaseBrowserDBTypes>(
  database: T,
): FirebaseBrowserSocketAdapterTypes<T> => {
  if (database instanceof Database) {
    return realtimeSockets(database) as unknown as FirebaseBrowserSocketAdapterTypes<T>;
  }
  if (database instanceof Firestore) {
    return firestoreSockets(database) as unknown as FirebaseBrowserSocketAdapterTypes<T>;
  }
  throw new Error("Unknown database type");
};
