import { Database } from "firebase/database";
import { Firestore } from "firebase/firestore";

import { RealtimeDbAdapterType } from "./adapter.realtimedb.types";
import { FirestoreAdapterType } from "./adapter.firestore.types";

export type FirebaseWebDBTypes = Database | Firestore;
export type FirebaseAdapterTypes<T> = T extends Database ? RealtimeDbAdapterType : FirestoreAdapterType;

// TODO add and handle status for 'emptyResource' resource
