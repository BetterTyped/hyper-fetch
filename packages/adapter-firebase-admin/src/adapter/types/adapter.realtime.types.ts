/* eslint-disable @typescript-eslint/naming-convention */
import { Adapter } from "@hyper-fetch/core";
import { DatabaseReference, DataSnapshot } from "firebase/database";
import { SocketAdapter } from "@hyper-fetch/sockets";

import {
  PermittedConstraints,
  RealtimeConstraintsUnion,
  RealtimePermittedMethods,
  SharedQueryConstraints,
} from "constraints";

export type RealtimeSocketAdapterType = SocketAdapter<
  never,
  RealtimeDbOnValueMethodExtra,
  { onlyOnce?: boolean } & RealtimeDBQueryParams
>;

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

export type RealtimeDBQueryParams = {
  constraints?: PermittedConstraints<RealtimePermittedMethods, RealtimeConstraintsUnion | SharedQueryConstraints>[];
};
