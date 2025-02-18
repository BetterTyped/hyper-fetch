/* eslint-disable @typescript-eslint/naming-convention */
import { Adapter } from "@hyper-fetch/core";
import {
  Unsubscribe as FirestoreUnsubscribe,
  CollectionReference,
  DocumentReference,
  DocumentSnapshot,
  QuerySnapshot,
} from "firebase/firestore";
import { SocketAdapter } from "@hyper-fetch/sockets";

import {
  FirestoreConstraintsUnion,
  FirestorePermittedMethods,
  PermittedConstraints,
  SharedQueryConstraints,
} from "constraints";

export type FirestoreSocketAdapterType = SocketAdapter<
  never,
  FirestoreOnSnapshotExtra,
  { groupByChangeType?: boolean } & FirestoreQueryParams
>;

export type FirestoreAdapterType =
  | Adapter<
      Record<string, never>,
      "getDoc",
      FirestoreStatuses,
      FirestoreExtra,
      FirestoreQueryParams,
      FirestoreQueryParams
    >
  | Adapter<
      Record<string, never>,
      "getDocs",
      FirestoreStatuses,
      FirestoreGetDocsExtra,
      FirestoreQueryParams,
      FirestoreQueryParams
    >
  | Adapter<{ merge: boolean }, "setDoc", FirestoreStatuses, FirestoreRefOnlyExtra, Record<string, never>, undefined>
  | Adapter<
      Record<string, never>,
      "updateDoc" | "addDoc" | "deleteDoc" | "setDoc",
      FirestoreStatuses,
      FirestoreRefOnlyExtra,
      Record<string, never>,
      undefined
    >;

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
