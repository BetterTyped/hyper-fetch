import type { Adapter, Request, Client } from "@hyper-fetch/core";
import type { Database } from "firebase-admin/database";
import type { Firestore } from "firebase-admin/firestore";

import type {
  RealtimeDbAdapterType,
  FirestoreAdapterType,
  FirestoreAdminSocketAdapterType,
  RealtimeAdminSocketAdapterType,
  FirestoreQueryParams,
  FirestoreMethodsUnion,
  RealtimeDBMethodsUnion,
  RealtimeDBQueryParams,
} from "./index";

export type FirebaseAdminDBTypes = Database | Firestore;
export type FirebaseAdminAdapterTypes<T> = T extends Database ? RealtimeDbAdapterType : FirestoreAdapterType;
export type FirebaseAdminSocketAdapterTypes<T> = T extends Firestore
  ? FirestoreAdminSocketAdapterType
  : RealtimeAdminSocketAdapterType;

export type RealtimeDBRequestType = Request<
  any,
  any,
  RealtimeDBQueryParams,
  any,
  any,
  Client<any, Adapter<any, RealtimeDBMethodsUnion, any, any, any, any>>,
  any,
  any,
  any
>;

export type FirestoreRequestType = Request<
  any,
  any,
  FirestoreQueryParams,
  any,
  any,
  Client<any, Adapter<any, FirestoreMethodsUnion, any, any, any, any>>,
  any,
  any,
  any
>;

export type RequestType<T> = T extends Firestore ? FirestoreRequestType : RealtimeDBRequestType;
