import { Firestore, DocumentSnapshot } from "firebase/firestore";
import { Database, DatabaseReference, DataSnapshot, QueryConstraint, Unsubscribe } from "firebase/database";
import { BaseAdapterType } from "@hyper-fetch/core";
import { CollectionReference, DocumentReference } from "@firebase/firestore";

export type FirebaseDBs = Database | Firestore;

// eslint-disable-next-line
export type FirebaseAdapterType<DBType> = DBType extends Firestore
  ? BaseAdapterType<DefaultFirebaseAdapterOptions, FirestoreDBMethods, FirestoreStatuses, FirestoreDBAdditionalData>
  : DBType extends Database
  ? BaseAdapterType<
      DefaultFirebaseAdapterOptions,
      RealtimeDBMethods,
      RealtimeDBStatuses,
      RealtimeDBAdditionalData,
      RealtimeDBQueryParams
    >
  : never;

export type DefaultFirebaseAdapterOptions = {
  data?: string;
  filterBy?: QueryConstraint | QueryConstraint[];
  orderBy?: QueryConstraint | QueryConstraint[];
  refetch?: boolean; // For update / push / etc. ? Update returns void. Should we allow for an option that is 'update and refetch my data'?
  // listenOn?: RealtimeListeners | RealtimeListeners[];
  priority?: number;
};

export type RealtimeDBMethods = "set" | "push" | "update" | "get" | "remove" | "onValue";
// export type RealtimeListeners =
//   | "onValue"  <--- most important
//   | "onChildAdded"
//   | "onChildRemoved"
//   | "onChildMoved"
//   | "onChildChanged"
//   | "onDataChange" <---  most important
//   | "onComplete"; <---   most important

export type RealtimeDBStatuses = "success" | "error";
export type RealtimeDBAdditionalData = {
  ref?: DatabaseReference;
  snapshot?: DataSnapshot;
  unsubscribe?: Unsubscribe;
};

export type RealtimeDBQueryParams = {
  // "orderByChild" | "orderByKey" | "orderByValue";
  orderBy?: QueryConstraint;
  //   | "limitToFirst" | "limitToLast" | "startAt" | "startAfter" | "endAt" | "endBefore" | "equalTo";
  filterBy?: QueryConstraint[];
};

export type FirestoreDBMethods = "addDoc" | "getDoc" | "getDocs" | "setDoc" | "updateDoc" | "deleteDoc" | "onSnapshot";

export type FirestoreDBAdditionalData = {
  ref?: DocumentReference | CollectionReference;
  snapshot?: DocumentSnapshot;
};

// TODO check firestore statuses
export type FirestoreStatuses = "success" | "error";
