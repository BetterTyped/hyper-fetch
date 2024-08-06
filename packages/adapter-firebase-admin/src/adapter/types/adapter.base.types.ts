import { Database } from "firebase-admin/database";
import { Firestore } from "firebase-admin/firestore";
import { AdapterType, Request, Client } from "@hyper-fetch/core";

import {
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
  Client<any, AdapterType<any, RealtimeDBMethodsUnion, any>, any>,
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
  Client<any, AdapterType<any, FirestoreMethodsUnion, any>, any>,
  any,
  any,
  any
>;

export type RequestType<T> = T extends Firestore ? FirestoreRequestType : RealtimeDBRequestType;
