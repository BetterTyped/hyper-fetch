/* eslint-disable @typescript-eslint/naming-convention */
import type { Adapter } from "@hyper-fetch/core";
import type { SocketAdapter } from "@hyper-fetch/sockets";
import type {
  PermittedConstraints,
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
 * Query params of a Realtime Database request: the constraints, applied in order.
 *
 * @example
 * getMessages.send({ queryParams: [$orderByChild("sentAt"), $limitToLast(50)] });
 */
export type RealtimeDBQueryParams = RealtimeDBConstraint[];

/** Options of a Realtime Database `onValue` listener. */
export type RealtimeDBListenerOptions = {
  /** Query constraints, applied in order, as in {@link RealtimeDBQueryParams}. */
  constraints?: RealtimeDBConstraint[];
  /** Receive only the first value, then stop listening. */
  onlyOnce?: boolean;
};
