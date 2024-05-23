import { AdapterType } from "@hyper-fetch/core";
import {
  Unsubscribe as FirestoreUnsubscribe,
  CollectionReference,
  DocumentReference,
  DocumentSnapshot,
  QuerySnapshot,
} from "firebase/firestore";
import { SocketAdapterType } from "@hyper-fetch/sockets";

import {
  FirestoreConstraintsUnion,
  FirestorePermittedMethods,
  PermittedConstraints,
  SharedQueryConstraints,
} from "constraints";

export type FirestoreSocketAdapterType = SocketAdapterType<
  never,
  FirestoreOnSnapshotExtra,
  { groupByChangeType?: boolean } & FirestoreQueryParams
>;

export type FirestoreAdapterType =
  | AdapterType<{
      options: Record<string, never>;
      method: "getDoc";
      status: FirestoreStatuses;
      extra: FirestoreExtra;
      queryParams: FirestoreQueryParams;
    }>
  | AdapterType<{
      options: Record<string, never>;
      method: "getDocs";
      status: FirestoreStatuses;
      extra: FirestoreGetDocsExtra;
      queryParams: FirestoreQueryParams;
    }>
  | AdapterType<{
      options: { merge: boolean };
      method: "setDoc";
      status: FirestoreStatuses;
      extra: FirestoreRefOnlyExtra;
      queryParams: Record<string, never>;
    }>
  | AdapterType<{
      options: Record<string, never>;
      method: "updateDoc" | "addDoc" | "deleteDoc" | "setDoc";
      status: FirestoreStatuses;
      extra: FirestoreRefOnlyExtra;
      queryParams: Record<string, never>;
    }>;

export type FirestoreQueryParams = {
  constraints?: PermittedConstraints<FirestorePermittedMethods, FirestoreConstraintsUnion | SharedQueryConstraints>[];
};

export enum FirestoreMethods {
  addDoc = "addDoc",
  getDoc = "getDoc",
  getDocs = "getDocs",
  setDoc = "setDoc",
  updateDoc = "updateDoc",
  deleteDoc = "deleteDoc",
}

export type FirestoreMethodsUnion =
  | FirestoreMethods.addDoc
  | FirestoreMethods.getDoc
  | FirestoreMethods.getDocs
  | FirestoreMethods.setDoc
  | FirestoreMethods.updateDoc
  | FirestoreMethods.deleteDoc;

export type FirestoreExtra = {
  ref?: DocumentReference;
  snapshot?: DocumentSnapshot;
};

export type FirestoreOnSnapshotExtra = {
  ref?: DocumentReference | CollectionReference;
  snapshot?: DocumentSnapshot;
  unsubscribe?: FirestoreUnsubscribe;
  groupedResult?: { added: DocumentSnapshot[]; modified: DocumentSnapshot[]; removed: DocumentSnapshot[] };
};

export type FirestoreGetDocsExtra = {
  ref?: CollectionReference;
  snapshot?: QuerySnapshot;
};

export type FirestoreRefOnlyExtra = {
  ref?: DocumentReference;
};

export type FirestoreStatuses = "success" | "error" | "emptyResource";
