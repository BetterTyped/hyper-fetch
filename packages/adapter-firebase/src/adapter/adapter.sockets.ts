import type { FirebaseDBTypes, FirebaseSocketAdapterTypes } from "adapter/index";
import { Database } from "firebase/database";
import { Firestore } from "firebase/firestore";
import { firestoreSockets } from "firestore";
import { realtimeSockets } from "realtime";

export const FirebaseSocketsAdapter = <T extends FirebaseDBTypes>(database: T): FirebaseSocketAdapterTypes<T> => {
  if (database instanceof Database) {
    return realtimeSockets(database) as unknown as FirebaseSocketAdapterTypes<T>;
  }
  if (database instanceof Firestore) {
    return firestoreSockets(database) as unknown as FirebaseSocketAdapterTypes<T>;
  }
  throw new Error("Unknown database type");
};
