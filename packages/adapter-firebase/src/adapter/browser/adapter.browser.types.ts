import { Database } from "firebase/database";
import { Firestore } from "firebase/firestore";

import { RealtimeDbAdapterType } from "../types/adapter.realtime.types";
import { FirestoreAdapterType } from "../types/adapter.firestore.types";

export type FirebaseBrowserDBTypes = Database | Firestore;
export type FirebaseBrowserAdapterTypes<T> = T extends Database ? RealtimeDbAdapterType : FirestoreAdapterType;
