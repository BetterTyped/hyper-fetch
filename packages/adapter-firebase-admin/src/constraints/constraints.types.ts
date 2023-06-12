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
  $orderByValue,
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
  | ReturnType<typeof $orderByValue>
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
