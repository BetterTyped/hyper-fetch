/* eslint-disable @typescript-eslint/naming-convention */
import type { Adapter, DefaultMapperType } from "@hyper-fetch/core";
import type { SocketAdapter } from "@hyper-fetch/sockets";
import type {
  FirestoreConstraints,
  FirestoreConstraintsUnion,
  FirestorePermittedMethods,
  PermittedConstraints,
  SharedQueryConstraints,
} from "constraints";
import type { DocumentData } from "firebase/firestore";
import type {
  Unsubscribe as FirestoreUnsubscribe,
  CollectionReference,
  DocumentReference,
  DocumentSnapshot,
  QuerySnapshot,
} from "firebase/firestore";

export type FirestoreSocketAdapterType = SocketAdapter<
  FirestoreOnSnapshotExtra,
  undefined,
  FirestoreListenerOptions,
  undefined,
  undefined,
  DefaultMapperType,
  FirestoreListenerQueryParams
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

/** One Firestore query constraint, built with `$where`, `$orderBy`, `$limit` or a cursor helper such as `$startAfter`. */
export type FirestoreConstraint = PermittedConstraints<
  FirestorePermittedMethods,
  FirestoreConstraintsUnion | SharedQueryConstraints
>;

/**
 * Query params of a Firestore request: a callback that builds typed constraints, or the constraints array it
 * resolves to. Pass the document type to check field names and values: `queryParams?: FirestoreQueryParams<Tea>`.
 *
 * @example
 * getTeas.send({ queryParams: (c) => c.where("type", "==", "Green").orderBy("year", "desc").limit(20) });
 */
export type FirestoreQueryParams<Doc = any> =
  | FirestoreConstraint[]
  | ((constraints: FirestoreConstraints<Doc>) => FirestoreConstraints<Doc, any>)
  | FirestoreDeprecatedQueryParams;

/** @deprecated Pass the constraints directly: `queryParams: (c) => c.where(...)` or `queryParams: [$where(...)]`. */
export type FirestoreDeprecatedQueryParams = {
  /** @deprecated Pass the constraints directly: `queryParams: (c) => c.where(...)` or `queryParams: [$where(...)]`. */
  constraints?: FirestoreConstraint[];
};

/** Query params of a Firestore listener: a callback that builds typed constraints, or the constraints array. */
export type FirestoreListenerQueryParams<Doc = any> =
  | FirestoreConstraint[]
  | ((constraints: FirestoreConstraints<Doc>) => FirestoreConstraints<Doc, any>);

/** Options of a Firestore `onSnapshot` listener. Constraints go in the listener's `queryParams`. */
export type FirestoreListenerOptions = {
  /** @deprecated Use the listener's query params: `setQueryParams((c) => c.where(...))`. */
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
  /** Each document carries its id as `__key`, as in `data` */
  groupedResult: {
    added: (DocumentData & { __key: string })[];
    modified: (DocumentData & { __key: string })[];
    removed: (DocumentData & { __key: string })[];
  } | null;
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
