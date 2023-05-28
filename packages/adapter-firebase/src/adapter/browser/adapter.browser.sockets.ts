import { Database } from "firebase/database";
import { Firestore } from "firebase/firestore";

import { FirebaseBrowserDBTypes } from "adapter";
import { realtimeSockets } from "realtime";

export const firebaseSocketsAdapter = <T extends FirebaseBrowserDBTypes>(database: T) => {
  if (database instanceof Database) {
    return realtimeSockets(database);
  }
  if (database instanceof Firestore) {
    // eslint-disable-next-line no-promise-executor-return
    return null as any;
  }
  throw new Error("Unknown database type");
};
