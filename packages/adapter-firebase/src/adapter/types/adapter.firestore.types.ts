import { AdapterType } from "@hyper-fetch/core";
import {
  Unsubscribe as FirestoreUnsubscribe,
  CollectionReference,
  DocumentReference,
  DocumentSnapshot,
  QuerySnapshot,
} from "firebase/firestore";

import {
  FirestoreConstraintsUnion,
  FirestorePermittedMethods,
  PermittedConstraints,
} from "../../constraints/constraints.types";

// TODO - separate onSnapshot adapter type when SocketAdapter is ready
export type FirestoreAdapterType =
  // | AdapterType<
  //     { groupByChangeType: boolean },
  //     "onSnapshot",
  //     FirestoreStatuses,
  //     FirestoreOnSnapshotExtra,
  //     FirestoreQueryParams
  //   >
  | AdapterType<Record<string, never>, "getDoc", FirestoreStatuses, FirestoreExtra, FirestoreQueryParams>
  | AdapterType<Record<string, never>, "getDocs", FirestoreStatuses, FirestoreGetDocsExtra, FirestoreQueryParams>
  | AdapterType<{ merge: boolean }, "setDoc", FirestoreStatuses, FirestoreRefOnlyExtra, Record<string, never>>
  | AdapterType<
      Record<string, never>,
      "updateDoc" | "addDoc" | "deleteDoc" | "setDoc",
      FirestoreStatuses,
      FirestoreRefOnlyExtra,
      Record<string, never>
    >;

export type FirestoreQueryParams = {
  constraints?: PermittedConstraints<FirestorePermittedMethods, FirestoreConstraintsUnion>[];
};

export type FirestoreDBMethods = "addDoc" | "getDoc" | "getDocs" | "setDoc" | "updateDoc" | "deleteDoc";

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
