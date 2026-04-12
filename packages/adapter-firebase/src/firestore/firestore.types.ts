import type { DocumentSnapshot } from "@firebase/firestore";
import type { QuerySnapshot } from "firebase/firestore";

export enum FirestoreDocOrQuery {
  DOC = "doc",
  QUERY = "query",
}

export type FirestoreSnapshotType<T extends FirestoreDocOrQuery> = T extends FirestoreDocOrQuery.DOC
  ? DocumentSnapshot
  : QuerySnapshot;
