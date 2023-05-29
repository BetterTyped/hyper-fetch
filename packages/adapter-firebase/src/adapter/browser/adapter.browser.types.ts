import { Database } from "firebase/database";
import { Firestore } from "firebase/firestore";

import { RealtimeDbAdapterType, FirestoreAdapterType } from "adapter";

export type FirebaseBrowserDBTypes = Database | Firestore;
export type FirebaseBrowserAdapterTypes<T> = T extends Database ? RealtimeDbAdapterType : FirestoreAdapterType;
