import { BaseAdapterType } from "@hyper-fetch/core";
import {
  Unsubscribe as FirestoreUnsubscribe,
  CollectionReference,
  DocumentReference,
  DocumentSnapshot,
  QuerySnapshot,
} from "firebase/firestore";

import { FirebaseQueryConstraints } from "constraints";

export type FirestoreAdapterType =
  | BaseAdapterType<
      { groupByChangeType: boolean },
      "onSnapshot",
      FirestoreStatuses,
      FirestoreOnSnapshotAdditionalData,
      FirestoreQueryParams
    >
  | BaseAdapterType<Record<string, never>, "getDoc", FirestoreStatuses, FirestoreAdditionalData, FirestoreQueryParams>
  | BaseAdapterType<
      Record<string, never>,
      "getDocs",
      FirestoreStatuses,
      FirestoreGetDocsAdditionalData,
      FirestoreQueryParams
    >
  | BaseAdapterType<
      { merge: boolean },
      "setDoc",
      FirestoreStatuses,
      FirestoreGetDocsAdditionalData,
      Record<string, never>
    >
  | BaseAdapterType<
      Record<string, never>,
      "updateDoc" | "addDoc" | "deleteDoc",
      FirestoreStatuses,
      FirestoreRefOnlyAdditionalData,
      Record<string, never>
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
  groupedResult?: { added: DocumentSnapshot[]; modified: DocumentSnapshot[]; removed: DocumentSnapshot[] };
};

export type FirestoreGetDocsAdditionalData = {
  ref?: CollectionReference;
  snapshot?: QuerySnapshot;
};

export type FirestoreRefOnlyAdditionalData = {
  ref?: DocumentReference;
};

export type FirestoreStatuses = "success" | "error";
