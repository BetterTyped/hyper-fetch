import type { DefaultMapperType } from "@hyper-fetch/core";
import type { SocketAdapter } from "@hyper-fetch/sockets";
import type { FirestoreListenerOptions, FirestoreListenerQueryParams, FirestoreStatuses } from "adapter";
import type { DocumentReference, DocumentSnapshot, DocumentData, Query, QuerySnapshot } from "firebase-admin/firestore";

export type FirestoreAdminSocketAdapterType = SocketAdapter<
  FirestoreAdminOnSnapshotExtra,
  undefined,
  FirestoreListenerOptions,
  undefined,
  undefined,
  DefaultMapperType,
  FirestoreListenerQueryParams
>;

export type FirestoreAdminOnSnapshotExtra = {
  ref?: DocumentReference | Query;
  snapshot?: DocumentSnapshot | QuerySnapshot;
  unsubscribe?: () => void;
  /** Grouped document changes when the listener has `groupByChangeType`, otherwise `null`. Collection listeners only. */
  groupedResult: { added: DocumentData[]; modified: DocumentData[]; removed: DocumentData[] } | null;
  /** `"emptyResource"` when the document is missing or the result list is empty. */
  status: FirestoreStatuses;
};
