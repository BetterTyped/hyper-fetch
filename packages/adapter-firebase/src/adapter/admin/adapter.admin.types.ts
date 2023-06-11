import { Database } from "firebase-admin/database";
import { Firestore } from "firebase-admin/firestore";

import {
  FirestoreAdapterType,
  FirestoreAdminSocketAdapterType,
  RealtimeAdminSocketAdapterType,
  RealtimeDbAdapterType,
} from "./types";

export type FirebaseAdminDBTypes = Database | Firestore;
export type FirebaseAdminAdapterTypes<T> = T extends Database ? RealtimeDbAdapterType : FirestoreAdapterType;
export type FirebaseAdminSocketAdapterTypes<T> = T extends Firestore
  ? FirestoreAdminSocketAdapterType
  : RealtimeAdminSocketAdapterType;
