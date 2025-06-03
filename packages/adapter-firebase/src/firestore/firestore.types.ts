import { DocumentSnapshot } from "@firebase/firestore";
import { QuerySnapshot } from "firebase/firestore";

export enum FirestoreDocOrQuery {
  DOC = "doc",
  QUERY = "query",
}

export type FirestoreSnapshotType<T extends FirestoreDocOrQuery> = T extends FirestoreDocOrQuery.DOC
  ? DocumentSnapshot
  : QuerySnapshot;
