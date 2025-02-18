import { Database } from "firebase/database";
import { Firestore } from "firebase/firestore";
import { Adapter, Request, Client } from "@hyper-fetch/core";

import {
  RealtimeDbAdapterType,
  FirestoreAdapterType,
  RealtimeSocketAdapterType,
  FirestoreSocketAdapterType,
  RealtimeDBQueryParams,
  RealtimeDBMethodsUnion,
  FirestoreMethodsUnion,
  FirestoreQueryParams,
} from "adapter/index";

export type FirebaseDBTypes = Database | Firestore;
export type FirebaseAdapterTypes<T> = T extends Database ? RealtimeDbAdapterType : FirestoreAdapterType;
export type FirebaseSocketAdapterTypes<T> = T extends Firestore
  ? FirestoreSocketAdapterType
  : RealtimeSocketAdapterType;

export type FirebaseRealtimeDBType = Request<
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

export type FirebaseRequestType<T> = T extends Database ? FirebaseRealtimeDBType : FirestoreRequestType;
