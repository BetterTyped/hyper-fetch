import type { DocumentData } from "@firebase/firestore";
/* eslint-disable @typescript-eslint/naming-convention */
import type { Adapter } from "@hyper-fetch/core";
import type { SocketAdapter } from "@hyper-fetch/sockets";
import type {
  FirestoreConstraintsUnion,
  FirestorePermittedMethods,
  PermittedConstraints,
  SharedQueryConstraints,
} from "constraints";
import type {
  Unsubscribe as FirestoreUnsubscribe,
  CollectionReference,
  DocumentReference,
  DocumentSnapshot,
  QuerySnapshot,
} from "firebase/firestore";

export type FirestoreSocketAdapterType = SocketAdapter<FirestoreOnSnapshotExtra, undefined, FirestoreListenerOptions>;

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

/** One Firestore query constraint, built with `$where`, `$orderBy`, `$limit` or a cursor helper such as `$startAfter`. */
export type FirestoreConstraint = PermittedConstraints<
  FirestorePermittedMethods,
  FirestoreConstraintsUnion | SharedQueryConstraints
>;

/**
 * Query params of a Firestore request: the constraints, applied in order.
 *
 * @example
 * getTeas.send({ queryParams: [$where("type", "==", "Green"), $orderBy("year"), $limit(20)] });
 */
export type FirestoreQueryParams = FirestoreConstraint[];

/** Options of a Firestore `onSnapshot` listener. */
export type FirestoreListenerOptions = {
  /** Query constraints, applied in order, as in {@link FirestoreQueryParams}. */
  constraints?: FirestoreConstraint[];
  /**
   * On collection listeners, adds `extra.groupedResult` with the `added`, `modified` and `removed` documents of each
   * snapshot. Document listeners get `null`.
   */
  groupByChangeType?: boolean;
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
  snapshot?: DocumentSnapshot | QuerySnapshot;
  unsubscribe?: FirestoreUnsubscribe;
  /** Grouped document changes when the listener has `groupByChangeType`, otherwise `null`. Collection listeners only. */
  groupedResult: { added: DocumentData[]; modified: DocumentData[]; removed: DocumentData[] } | null;
  /** `"emptyResource"` when the document is missing or the result list is empty. */
  status: FirestoreStatuses;
};

export type FirestoreGetDocsExtra = {
  ref?: CollectionReference;
  snapshot?: QuerySnapshot;
};

export type FirestoreRefOnlyExtra = {
  ref?: DocumentReference;
};

export type FirestoreStatuses = "success" | "error" | "emptyResource";
