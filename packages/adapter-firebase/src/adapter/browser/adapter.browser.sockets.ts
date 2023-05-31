import { Database } from "firebase/database";
import { Firestore } from "firebase/firestore";

import { FirebaseBrowserDBTypes } from "adapter";
import { realtimeSockets } from "realtime";
import { firestoreSockets } from "../../firestore/browser/firestore.browser.sockets";

export const firebaseSocketsAdapter = <T extends FirebaseBrowserDBTypes>(database: T) => {
  if (database instanceof Database) {
    return realtimeSockets(database);
  }
  if (database instanceof Firestore) {
    return firestoreSockets(database);
  }
  throw new Error("Unknown database type");
};
