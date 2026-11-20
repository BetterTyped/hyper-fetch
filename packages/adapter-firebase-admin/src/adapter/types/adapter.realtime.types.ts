/* eslint-disable @typescript-eslint/naming-convention */
import type { Adapter } from "@hyper-fetch/core";
import type { SocketAdapter } from "@hyper-fetch/sockets";
import type {
  OrderedRealtimeConstraints,
  PermittedConstraints,
  RealtimeConstraints,
  RealtimeConstraintsUnion,
  RealtimePermittedMethods,
  SharedQueryConstraints,
} from "constraints";
import type { DatabaseReference, DataSnapshot } from "firebase/database";

export type RealtimeSocketAdapterType = SocketAdapter<never, RealtimeDbOnValueMethodExtra, RealtimeDBListenerOptions>;

export type RealtimeDbAdapterType =
  | Adapter<
      DefaultRealtimeDBAdapterOptions,
      "get",
      RealtimeDBStatuses,
      RealtimeDbGetMethodExtra,
      RealtimeDBQueryParams,
      RealtimeDBQueryParams
    >
  | Adapter<
      DefaultRealtimeDBAdapterOptions,
      "push",
      RealtimeDBStatuses,
      RealtimeDbPushMethodExtra,
      Record<string, never>,
      undefined
    >
  | Adapter<
      DefaultRealtimeDBAdapterOptions,
      "set" | "update" | "remove",
      RealtimeDBStatuses,
      RealtimeDbDefaultExtra,
      Record<string, never>,
      undefined
    >;

export type DefaultRealtimeDBAdapterOptions = {
  priority?: number;
};

export enum RealtimeDBMethods {
  set = "set",
  push = "push",
  update = "update",
  get = "get",
  remove = "remove",
}

export type RealtimeDBMethodsUnion =
  | RealtimeDBMethods.set
  | RealtimeDBMethods.push
  | RealtimeDBMethods.update
  | RealtimeDBMethods.get
  | RealtimeDBMethods.remove;

export type RealtimeDBStatuses = "success" | "error" | "emptyResource";
export type RealtimeDbOnValueMethodExtra = {
  ref: DatabaseReference;
  snapshot: DataSnapshot;
};

export type RealtimeDbGetMethodExtra = {
  ref: DatabaseReference;
  snapshot: DataSnapshot;
};

export type RealtimeDbDefaultExtra = {
  ref: DatabaseReference;
};

export type RealtimeDbPushMethodExtra = {
  ref: DatabaseReference;
  key: string;
};

/** One Realtime Database query constraint, built with `$orderByChild`, `$limitToFirst`, `$equalTo` or a cursor helper. */
export type RealtimeDBConstraint = PermittedConstraints<
  RealtimePermittedMethods,
  RealtimeConstraintsUnion | SharedQueryConstraints
>;

/**
 * Query params of a Realtime Database request: a callback that builds typed constraints, or the constraints array it
 * resolves to. Pass the type of the list's children to check paths and values:
 * `queryParams?: RealtimeDBQueryParams<Message>`.
 *
 * @example
 * getMessages.send({ queryParams: (c) => c.orderByChild("sentAt").limitToLast(50) });
 */
export type RealtimeDBQueryParams<Doc = any> =
  | RealtimeDBConstraint[]
  | ((constraints: RealtimeConstraints<Doc>) => RealtimeConstraints<Doc> | OrderedRealtimeConstraints<Doc, any>)
  | RealtimeDBDeprecatedQueryParams;

/** @deprecated Pass the constraints directly: `queryParams: (c) => c.orderByChild(...)` or an array. */
export type RealtimeDBDeprecatedQueryParams = {
  /** @deprecated Pass the constraints directly: `queryParams: (c) => c.orderByChild(...)` or an array. */
  constraints?: RealtimeDBConstraint[];
};

/** Query params of a Realtime Database listener: a callback that builds typed constraints, or the array. */
export type RealtimeDBListenerQueryParams<Doc = any> =
  | RealtimeDBConstraint[]
  | ((constraints: RealtimeConstraints<Doc>) => RealtimeConstraints<Doc> | OrderedRealtimeConstraints<Doc, any>);

/** Options of a Realtime Database `onValue` listener. Constraints go in the listener's `queryParams`. */
export type RealtimeDBListenerOptions = {
  /** @deprecated Use the listener's query params: `setQueryParams((c) => c.orderByChild(...))`. */
  constraints?: RealtimeDBConstraint[];
  /** Receive only the first value, then stop listening. */
  onlyOnce?: boolean;
};
