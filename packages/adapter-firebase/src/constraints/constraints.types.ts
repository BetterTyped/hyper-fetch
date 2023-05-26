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
  | typeof $startAt
  | typeof $startAfter
  | typeof $endAt
  | typeof $endBefore
  | typeof $orderByChild
  | typeof orderByValue
  | typeof $orderByKey
  | typeof $limitToFirst
  | typeof $limitToLast
  | typeof $equalTo;

export type FirestorePermittedMethods = typeof $where | typeof $orderBy | typeof $limit;

type ExtractConstraintType<T> = T extends (...any) => { toString: () => string; type: infer ThisType; values: any }
  ? ThisType
  : never;

export type PermittedMethods<T, U> = ExtractConstraintType<T> extends U ? T : never;
