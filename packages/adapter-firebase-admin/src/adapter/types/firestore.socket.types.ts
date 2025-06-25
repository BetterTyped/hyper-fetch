import { DocumentReference, DocumentSnapshot, DocumentData, Query, QuerySnapshot } from "firebase-admin/firestore";
import { SocketAdapter } from "@hyper-fetch/sockets";

import { FirestoreQueryParams } from "adapter";

export type FirestoreAdminSocketAdapterType = SocketAdapter<
  FirestoreAdminOnSnapshotExtra,
  undefined,
  { groupByChangeType?: boolean } & FirestoreQueryParams
>;

export type FirestoreAdminOnSnapshotExtra = {
  ref?: DocumentReference | Query;
  snapshot?: DocumentSnapshot | QuerySnapshot;
  unsubscribe?: () => void;
  groupedResult: { added: DocumentData[]; modified: DocumentData[]; removed: DocumentData[] } | null;
};
