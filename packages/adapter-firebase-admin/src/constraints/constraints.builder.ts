import type { OrderByDirection, WhereFilterOp } from "firebase-admin/firestore";

import type { FirestorePermittedMethods, RealtimePermittedMethods } from "./constraints.types";
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
} from "./firebase.constraints";

type Primitive = string | number | boolean | bigint | symbol | null | undefined | Date;
type IsAny<T> = 0 extends 1 & T ? true : false;
type PreviousDepth = [never, 0, 1, 2, 3, 4];

/**
 * Paths to the fields of a document, nested objects included (up to 4 levels), joined with `Separator`: `.` for
 * Firestore field paths, `/` for Realtime Database child paths. The `__key` id added by the adapter is not a field.
 */
export type FieldPath<Doc, Separator extends string = ".", Depth extends number = 4> =
  IsAny<Doc> extends true
    ? string
    : [Depth] extends [never]
      ? never
      : Doc extends Primitive | readonly any[]
        ? never
        : {
            [Key in Exclude<keyof Doc, "__key"> & string]: NonNullable<Doc[Key]> extends Primitive | readonly any[]
              ? Key
              : Key | `${Key}${Separator}${FieldPath<NonNullable<Doc[Key]>, Separator, PreviousDepth[Depth]>}`;
          }[Exclude<keyof Doc, "__key"> & string];

/** Value type of the field at `Path`. */
export type FieldValue<Doc, Path extends string, Separator extends string = "."> =
  IsAny<Doc> extends true
    ? any
    : Path extends `${infer Key}${Separator}${infer Rest}`
      ? Key extends keyof Doc
        ? FieldValue<NonNullable<Doc[Key]>, Rest, Separator>
        : never
      : Path extends keyof Doc
        ? Doc[Path]
        : never;

/** Value a Firestore `where` takes for an operator: arrays for `in` / `not-in`, an element for `array-contains`. */
export type WhereValue<Value, Operator extends WhereFilterOp> = Operator extends "in" | "not-in"
  ? Value[]
  : Operator extends "array-contains"
    ? NonNullable<Value> extends readonly (infer Element)[]
      ? Element
      : never
    : Operator extends "array-contains-any"
      ? NonNullable<Value> extends readonly (infer Element)[]
        ? Element[]
        : never
      : Value;

type CursorPrefixes<Values extends unknown[]> = Values extends [...infer Init, any]
  ? Values | (Init extends [] ? never : CursorPrefixes<Init>)
  : never;

/** Cursor values: one per `orderBy`, in order (a prefix is allowed), or a document id without `orderBy`. */
export type FirestoreCursorValues<Ordered extends unknown[]> = Ordered extends []
  ? [documentId: string]
  : CursorPrefixes<Ordered>;

/**
 * Typed Firestore constraints for a document type, built as a chain. Received by the `queryParams` callback of
 * Firestore requests and listeners; the adapter stores the constraints it collected.
 *
 * @example
 * getTeas.send({ queryParams: (c) => c.where("type", "==", "Green").orderBy("year", "desc").limit(20) });
 */
export interface FirestoreConstraints<Doc = any, Ordered extends unknown[] = []> {
  /** Filter by a field, like Firestore's `where()`. The value type follows the field and the operator. */
  where<Path extends FieldPath<Doc>, Operator extends WhereFilterOp>(
    field: Path,
    operator: Operator,
    value: WhereValue<FieldValue<Doc, Path>, Operator>,
  ): FirestoreConstraints<Doc, Ordered>;
  /** Order by a field, like Firestore's `orderBy()`. Each `orderBy` adds one value the cursors take. */
  orderBy<Path extends FieldPath<Doc>>(
    field: Path,
    direction?: OrderByDirection,
  ): FirestoreConstraints<Doc, [...Ordered, FieldValue<Doc, Path>]>;
  /** Limit the number of documents, like Firestore's `limit()`. */
  limit(limit: number): FirestoreConstraints<Doc, Ordered>;
  /** Start at these values, inclusive: one per `orderBy`, in order. */
  startAt(...values: FirestoreCursorValues<Ordered>): FirestoreConstraints<Doc, Ordered>;
  /** Start after these values, exclusive. Pass the values of the last document to load the next page. */
  startAfter(...values: FirestoreCursorValues<Ordered>): FirestoreConstraints<Doc, Ordered>;
  /** End at these values, inclusive: one per `orderBy`, in order. */
  endAt(...values: FirestoreCursorValues<Ordered>): FirestoreConstraints<Doc, Ordered>;
  /** End before these values, exclusive: one per `orderBy`, in order. */
  endBefore(...values: FirestoreCursorValues<Ordered>): FirestoreConstraints<Doc, Ordered>;
  /** The collected constraints, the data a request or listener stores. */
  toJSON(): FirestorePermittedMethods[];
}

/**
 * Typed Realtime Database constraints for the type of a list's children, built as a chain. A query can have one
 * `orderBy*`; cursors and `equalTo` become available after it and take the ordered value.
 *
 * @example
 * getMessages.send({ queryParams: (c) => c.orderByChild("sentAt").limitToLast(50) });
 */
export interface RealtimeConstraints<Doc = any> {
  /** Order by a child value, like `orderByChild()`. Nested children use `/`: `"author/name"`. */
  orderByChild<Path extends FieldPath<Doc, "/">>(
    path: Path,
  ): OrderedRealtimeConstraints<Doc, FieldValue<Doc, Path, "/">>;
  /** Order by key, like `orderByKey()`. */
  orderByKey(): OrderedRealtimeConstraints<Doc, string>;
  /** Order by the children's own values, like `orderByValue()`. */
  orderByValue(): OrderedRealtimeConstraints<Doc, Doc>;
  /** Limit to the first children, like `limitToFirst()`. */
  limitToFirst(limit: number): RealtimeConstraints<Doc>;
  /** Limit to the last children, like `limitToLast()`. */
  limitToLast(limit: number): RealtimeConstraints<Doc>;
  /** The collected constraints, the data a request or listener stores. */
  toJSON(): RealtimePermittedMethods[];
}

/** Realtime Database constraints after an `orderBy*`. Cursors and `equalTo` take the ordered value and a tie key. */
export interface OrderedRealtimeConstraints<Doc = any, Value = any> {
  /** Limit to the first children, like `limitToFirst()`. */
  limitToFirst(limit: number): OrderedRealtimeConstraints<Doc, Value>;
  /** Limit to the last children, like `limitToLast()`. */
  limitToLast(limit: number): OrderedRealtimeConstraints<Doc, Value>;
  /** Keep children whose ordered value equals `value`, like `equalTo()`. */
  equalTo(value: Value, key?: string): OrderedRealtimeConstraints<Doc, Value>;
  /** Start at `value`, inclusive. `key` breaks ties between equal values. */
  startAt(value: Value, key?: string): OrderedRealtimeConstraints<Doc, Value>;
  /** Start after `value`, exclusive. `key` breaks ties between equal values. */
  startAfter(value: Value, key?: string): OrderedRealtimeConstraints<Doc, Value>;
  /** End at `value`, inclusive. `key` breaks ties between equal values. */
  endAt(value: Value, key?: string): OrderedRealtimeConstraints<Doc, Value>;
  /** End before `value`, exclusive. `key` breaks ties between equal values. */
  endBefore(value: Value, key?: string): OrderedRealtimeConstraints<Doc, Value>;
  /** The collected constraints, the data a request or listener stores. */
  toJSON(): RealtimePermittedMethods[];
}

/** Untyped shape of the chains below; the factories cast it to the typed interfaces. */
type AnyChain = Record<string, (...args: any[]) => unknown>;

const firestoreChain = (constraints: FirestorePermittedMethods[]): AnyChain => {
  const add = (constraint: FirestorePermittedMethods) => firestoreChain([...constraints, constraint]);
  return {
    where: (field: string, operator: WhereFilterOp, value: unknown) => add($where(field, operator, value)),
    orderBy: (field: string, direction?: OrderByDirection) => add($orderBy(field, direction)),
    limit: (limit: number) => add($limit(limit)),
    startAt: (...values: unknown[]) => add($startAt(...values)),
    startAfter: (...values: unknown[]) => add($startAfter(...values)),
    endAt: (...values: unknown[]) => add($endAt(...values)),
    endBefore: (...values: unknown[]) => add($endBefore(...values)),
    toJSON: () => constraints,
  };
};

const realtimeChain = (constraints: RealtimePermittedMethods[]): AnyChain => {
  const add = (constraint: RealtimePermittedMethods) => realtimeChain([...constraints, constraint]);
  return {
    orderByChild: (path: string) => add($orderByChild(path)),
    orderByKey: () => add($orderByKey()),
    orderByValue: () => add($orderByValue()),
    limitToFirst: (limit: number) => add($limitToFirst(limit)),
    limitToLast: (limit: number) => add($limitToLast(limit)),
    equalTo: (value: unknown, key?: string) => add($equalTo(value, key)),
    startAt: (value: unknown, key?: string) => add(key === undefined ? $startAt(value) : $startAt(value, key)),
    startAfter: (value: unknown, key?: string) => add(key === undefined ? $startAfter(value) : $startAfter(value, key)),
    endAt: (value: unknown, key?: string) => add(key === undefined ? $endAt(value) : $endAt(value, key)),
    endBefore: (value: unknown, key?: string) => add(key === undefined ? $endBefore(value) : $endBefore(value, key)),
    toJSON: () => constraints,
  };
};

/** Start an empty Firestore constraints chain. The adapter passes one to every `queryParams` callback. */
export const createFirestoreConstraints = <Doc = any>(): FirestoreConstraints<Doc> =>
  firestoreChain([]) as unknown as FirestoreConstraints<Doc>;

/** Start an empty Realtime Database constraints chain. The adapter passes one to every `queryParams` callback. */
export const createRealtimeConstraints = <Doc = any>(): RealtimeConstraints<Doc> =>
  realtimeChain([]) as unknown as RealtimeConstraints<Doc>;

/** Resolve a `queryParams` callback with a fresh chain into the constraints it collected. */
export const resolveConstraints =
  (createChain: () => { toJSON(): unknown[] }) => (callback: (...args: any[]) => unknown) =>
    (callback(createChain()) as { toJSON(): unknown[] }).toJSON();

/**
 * The constraints of `queryParams` or listener options: an array, or the deprecated `{ constraints }` object.
 */
export const getConstraints = <Constraint>(queryParams: unknown): Constraint[] => {
  if (Array.isArray(queryParams)) {
    return queryParams as Constraint[];
  }
  if (
    queryParams &&
    typeof queryParams === "object" &&
    Array.isArray((queryParams as { constraints?: unknown }).constraints)
  ) {
    return (queryParams as { constraints: Constraint[] }).constraints;
  }
  return [];
};
