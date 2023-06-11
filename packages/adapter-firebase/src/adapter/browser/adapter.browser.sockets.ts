import { Database } from "firebase/database";
import { Firestore } from "firebase/firestore";

import { FirebaseBrowserDBTypes, FirebaseBrowserSocketAdapterTypes } from "adapter/index.browser";
import { realtimeSockets } from "realtime/index.browser";
import { firestoreSockets } from "firestore/index.browser";

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
