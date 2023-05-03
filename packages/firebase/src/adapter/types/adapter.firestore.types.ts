import { BaseAdapterType } from "@hyper-fetch/core";
import {
  QueryFieldFilterConstraint,
  QueryLimitConstraint,
  QueryOrderByConstraint,
  Unsubscribe as FirestoreUnsubscribe,
  CollectionReference,
  DocumentReference,
  DocumentSnapshot,
  QuerySnapshot,
} from "firebase/firestore";

import { FirebaseQueryConstraints } from "../constraints/constraints.firebase";

export type FirestoreAdapterType =
  | BaseAdapterType<
      DefaultFirestoreAdapterOptions,
      "onSnapshot",
      FirestoreStatuses,
      FirestoreOnSnapshotAdditionalData,
      FirestoreQueryParams
    >
  | BaseAdapterType<
      DefaultFirestoreAdapterOptions,
      "getDoc",
      FirestoreStatuses,
      FirestoreAdditionalData,
      FirestoreQueryParams
    >
  | BaseAdapterType<
      DefaultFirestoreAdapterOptions,
      "getDocs",
      FirestoreStatuses,
      FirestoreGetDocsAdditionalData,
      FirestoreQueryParams
    >
  | BaseAdapterType<
      DefaultFirestoreAdapterOptions,
      "setDoc" | "addDoc" | "updateDoc" | "deleteDoc",
      FirestoreStatuses,
      FirestoreRefOnlyAdditionalData,
      FirestoreQueryParams // Is it possible to block query params?
    >;

export type FirestoreQueryParams = {
  constraints?: { toString: () => string; type: FirebaseQueryConstraints; values: any[] }[];
};

export type FirestoreDBMethods = "addDoc" | "getDoc" | "getDocs" | "setDoc" | "updateDoc" | "deleteDoc" | "onSnapshot";

export type FirestoreAdditionalData = {
  ref?: DocumentReference;
  snapshot?: DocumentSnapshot;
};

export type FirestoreOnSnapshotAdditionalData = {
  ref?: DocumentReference | CollectionReference;
  snapshot?: DocumentSnapshot;
  unsubscribe?: FirestoreUnsubscribe;
};

export type FirestoreGetDocsAdditionalData = {
  ref?: CollectionReference;
  snapshot?: QuerySnapshot;
};

export type FirestoreRefOnlyAdditionalData = {
  ref?: DocumentReference;
};

export type FirestoreStatuses = "success" | "error";

// TODO - ask check AdapterOptions/QueryParams for filterBy, orderBy, limitBY
export type DefaultFirestoreAdapterOptions = {
  data?: string;
  filterBy?: QueryFieldFilterConstraint[];
  orderBy?: QueryOrderByConstraint[];
  limit?: QueryLimitConstraint;
  refetch?: boolean; // For update / push / etc. ? Update returns void. Should we allow for an option that is 'update and refetch my data'?

  // Option for getting non sequential arrays as arrays https://firebase.blog/posts/2014/04/best-practices-arrays-in-firebase/
  // toArray?: boolean
};
