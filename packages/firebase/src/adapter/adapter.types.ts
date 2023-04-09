import { Firestore, DocumentSnapshot } from "firebase/firestore";
import { Database, DatabaseReference, DataSnapshot, QueryConstraint, Unsubscribe } from "firebase/database";
import { BaseAdapterType } from "@hyper-fetch/core";
import { CollectionReference, DocumentReference } from "@firebase/firestore";

export type FirebaseDBs = Database | Firestore;

// eslint-disable-next-line
export type FirebaseAdapterType<_DBType extends FirebaseDBs> =
  | BaseAdapterType<
      DefaultFirebaseAdapterOptions,
      "set",
      RealtimeDBStatuses,
      { something: number },
      RealtimeDBQueryParams
    >
  | BaseAdapterType<DefaultFirebaseAdapterOptions, "push", RealtimeDBStatuses, { ref: string }, RealtimeDBQueryParams>;

export type DefaultFirebaseAdapterOptions = {
  data?: string;
  filterBy?: QueryConstraint | QueryConstraint[];
  orderBy?: QueryConstraint | QueryConstraint[];
  refetch?: boolean; // For update / push / etc. ? Update returns void. Should we allow for an option that is 'update and refetch my data'?
  // TODO - only for onValue
  onlyOnce?: boolean;
  // TODO
  priority?: number;

  // Option for getting non sequential arrays as arrays https://firebase.blog/posts/2014/04/best-practices-arrays-in-firebase/
  // toArray?: boolean
};

export enum RealtimeMethods {
  GET = "GET",
  PUSH = "PUSH",
}

export type RealtimeDBMethods = "set" | "push" | "update" | "get" | "remove" | "onValue";
// export type RealtimeListeners =
//   | "onValue"  <--- most important
//   | "onDataChange" <---  most important
//   | "onComplete"; <---   most important

export type RealtimeDBStatuses = "success" | "error";
export type RealtimeDBAdditionalData = {
  ref?: DatabaseReference;
  snapshot?: DataSnapshot;
  unsubscribe?: Unsubscribe;
  key?: string;
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
