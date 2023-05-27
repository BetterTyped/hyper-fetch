import { orderByValue } from "firebase/database";

import {
  $endAt,
  $endBefore,
  $equalTo,
  $limit,
  $limitToFirst,
  $limitToLast,
  $orderBy,
  $orderByChild,
  $orderByKey,
  $startAfter,
  $startAt,
  $where,
  FirestoreQueryConstraints,
  RealtimeQueryConstraints,
} from "./firebase.constraints";

export type RealtimeConstraintsUnion = `${RealtimeQueryConstraints}`;
export type FirestoreConstraintsUnion = `${FirestoreQueryConstraints}`;

export type RealtimePermittedMethods =
  | ReturnType<typeof $startAt>
  | ReturnType<typeof $startAfter>
  | ReturnType<typeof $endAt>
  | ReturnType<typeof $endBefore>
  | ReturnType<typeof $orderByChild>
  | ReturnType<typeof orderByValue>
  | ReturnType<typeof $orderByKey>
  | ReturnType<typeof $limitToFirst>
  | ReturnType<typeof $limitToLast>
  | ReturnType<typeof $equalTo>;

export type FirestorePermittedMethods =
  | ReturnType<typeof $where>
  | ReturnType<typeof $orderBy>
  | ReturnType<typeof $limit>
  | ReturnType<typeof $startAt>
  | ReturnType<typeof $startAfter>
  | ReturnType<typeof $endAt>
  | ReturnType<typeof $endBefore>;

type ExtractConstraintType<T> = T extends { toString: () => string; type: infer ThisType; values: any }
  ? ThisType
  : never;

export type PermittedConstraints<T, U> = ExtractConstraintType<T> extends U ? T : never;

// TODO - why second and third elements compare to LIMIT and all others to FirestorePermittedMethods (that is correct)
// type firestoreConstraints = PermittedConstraints<
//   FirestorePermittedMethods,
//   FirestoreConstraintsUnion | SharedQueryConstraints
// >;
// type realtimeConstraints = PermittedConstraints<
//   RealtimePermittedMethods,
//   RealtimeConstraintsUnion | SharedQueryConstraints
// >;
// const firestoreCheck: firestoreConstraints[] = [
//   $where("type", "==", "Green"),
//   $orderByChild("sdfs"),
//   $equalTo("sdfs"),
//   $equalTo("ds"),
// ];
// TODO - same here - why compares incorrect one to 'EQUAL_TO'
// const realtimeCheck: realtimeConstraints[] = [
//   $orderByChild("sdfs"),
//   $startAt(100),
//   $where("type", "==", "Green"),
//   $where("type", "==", "Green"),
//   $where("type", "==", "Green"),
// ];
