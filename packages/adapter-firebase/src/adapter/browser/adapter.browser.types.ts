import { Database } from "firebase/database";
import { Firestore } from "firebase/firestore";

import {
  RealtimeDbAdapterType,
  FirestoreAdapterType,
  RealtimeSocketAdapterType,
  FirestoreSocketAdapterType,
} from "adapter";

export type FirebaseBrowserDBTypes = Database | Firestore;
export type FirebaseBrowserAdapterTypes<T> = T extends Database ? RealtimeDbAdapterType : FirestoreAdapterType;
export type FirebaseBrowserSocketAdapterTypes<T> = T extends Firestore
  ? FirestoreSocketAdapterType
  : RealtimeSocketAdapterType;
