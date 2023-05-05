import { Database } from "firebase-admin/database";
import { Firestore } from "firebase-admin/firestore";

import { RealtimeDbAdapterType } from "./adapter.realtimedb.types";
import { FirestoreAdapterType } from "./adapter.firestore.types";

export type FirebaseAdminDBTypes = Database | Firestore;
export type FirebaseAdminAdapterTypes<T> = T extends Database ? RealtimeDbAdapterType : FirestoreAdapterType;
