import { Database } from "firebase/database";
import { Firestore } from "firebase/firestore";

import { RealtimeDbAdapterType } from "./adapter.realtimedb.types";
import { FirestoreAdapterType } from "./adapter.firestore.types";

export type FirebaseWebDBTypes = Database | Firestore;
export type FirebaseWebAdapterTypes<T> = T extends Database ? RealtimeDbAdapterType : FirestoreAdapterType;
