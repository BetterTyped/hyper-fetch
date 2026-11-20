import type { SocketAdapter } from "@hyper-fetch/sockets";
import type { FirestoreListenerOptions } from "adapter";
import type { DocumentReference, DocumentSnapshot, DocumentData, Query, QuerySnapshot } from "firebase-admin/firestore";

export type FirestoreAdminSocketAdapterType = SocketAdapter<
  FirestoreAdminOnSnapshotExtra,
  undefined,
  FirestoreListenerOptions
>;

export type FirestoreAdminOnSnapshotExtra = {
  ref?: DocumentReference | Query;
  snapshot?: DocumentSnapshot | QuerySnapshot;
  unsubscribe?: () => void;
  groupedResult: { added: DocumentData[]; modified: DocumentData[]; removed: DocumentData[] } | null;
};
