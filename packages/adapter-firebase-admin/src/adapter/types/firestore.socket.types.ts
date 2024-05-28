import { DocumentReference, DocumentSnapshot, Query } from "firebase-admin/firestore";
import { SocketAdapterType } from "@hyper-fetch/sockets";

import { FirestoreQueryParams } from "adapter";

export type FirestoreAdminSocketAdapterType = SocketAdapterType<
  never,
  FirestoreAdminOnSnapshotExtra,
  { groupByChangeType?: boolean } & FirestoreQueryParams
>;

export type FirestoreAdminOnSnapshotExtra = {
  ref?: DocumentReference | Query;
  snapshot?: DocumentSnapshot;
  unsubscribe?: () => void;
  groupedResult?: { added: DocumentSnapshot[]; modified: DocumentSnapshot[]; removed: DocumentSnapshot[] };
};
