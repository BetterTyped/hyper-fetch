import { Database } from "firebase-admin/database";
import { Firestore } from "firebase-admin/firestore";

import { RealtimeDbAdapterType } from "../types/adapter.realtime.types";
import { FirestoreAdapterType } from "../types/adapter.firestore.types";

export type FirebaseAdminDBTypes = Database | Firestore;
export type FirebaseAdminAdapterTypes<T> = T extends Database ? RealtimeDbAdapterType : FirestoreAdapterType;
