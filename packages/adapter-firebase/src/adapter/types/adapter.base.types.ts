import { Database } from "firebase/database";
import { Firestore } from "firebase/firestore";

import {
  RealtimeDbAdapterType,
  FirestoreAdapterType,
  RealtimeSocketAdapterType,
  FirestoreSocketAdapterType,
} from "adapter/index";

export type FirebaseDBTypes = Database | Firestore;
export type FirebaseAdapterTypes<T> = T extends Database ? RealtimeDbAdapterType : FirestoreAdapterType;
export type FirebaseSocketAdapterTypes<T> = T extends Firestore
  ? FirestoreSocketAdapterType
  : RealtimeSocketAdapterType;
