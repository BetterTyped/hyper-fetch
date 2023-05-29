import { Database } from "firebase-admin/database";
import { Firestore } from "firebase-admin/firestore";

import { RealtimeDbAdapterType, FirestoreAdapterType } from "adapter";

export type FirebaseAdminDBTypes = Database | Firestore;
export type FirebaseAdminAdapterTypes<T> = T extends Database ? RealtimeDbAdapterType : FirestoreAdapterType;
