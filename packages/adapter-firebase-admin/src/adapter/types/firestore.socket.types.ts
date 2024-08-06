import { DocumentReference, DocumentSnapshot, DocumentData, Query, QuerySnapshot } from "firebase-admin/firestore";
import { SocketAdapterType } from "@hyper-fetch/sockets";

import { FirestoreQueryParams } from "adapter";

export type FirestoreAdminSocketAdapterType = SocketAdapterType<
  any,
  FirestoreAdminOnSnapshotExtra,
  { groupByChangeType?: boolean } & FirestoreQueryParams,
  any
>;

export type FirestoreAdminOnSnapshotExtra = {
  ref?: DocumentReference | Query;
  snapshot?: DocumentSnapshot | QuerySnapshot;
  unsubscribe?: () => void;
  groupedResult: { added: DocumentData[]; modified: DocumentData[]; removed: DocumentData[] } | null;
};
