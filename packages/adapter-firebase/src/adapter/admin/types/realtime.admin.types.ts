import { AdapterType } from "@hyper-fetch/core";
import { SocketAdapterType } from "@hyper-fetch/sockets";
import { Reference, DataSnapshot } from "firebase-admin/database";

import {
  PermittedConstraints,
  RealtimeConstraintsUnion,
  RealtimePermittedMethods,
  SharedQueryConstraints,
} from "constraints";

export type RealtimeDBStatuses = "success" | "error" | "emptyResource";

export type RealtimeDBQueryParams = {
  constraints?: PermittedConstraints<RealtimePermittedMethods, RealtimeConstraintsUnion | SharedQueryConstraints>[];
};

export type RealtimeAdminSocketAdapterType = SocketAdapterType<
  never,
  RealtimeAdminOnValueMethodExtra,
  { onlyOnce?: boolean } & RealtimeDBQueryParams,
  never
>;

export type RealtimeAdminOnValueMethodExtra = {
  ref: Reference;
  snapshot: DataSnapshot;
  status: RealtimeDBStatuses;
};

export type DefaultRealtimeDBAdapterOptions = {
  priority?: number;
};

export type RealtimeDbGetMethodExtra = {
  ref: Reference;
  snapshot: DataSnapshot;
};

export type RealtimeDbPushMethodExtra = {
  ref: Reference;
  key: string;
};

export type RealtimeDbDefaultExtra = {
  ref: Reference;
};

export type RealtimeDbAdapterType =
  | AdapterType<
      DefaultRealtimeDBAdapterOptions,
      "get",
      RealtimeDBStatuses,
      RealtimeDbGetMethodExtra,
      RealtimeDBQueryParams
    >
  | AdapterType<
      DefaultRealtimeDBAdapterOptions,
      "push",
      RealtimeDBStatuses,
      RealtimeDbPushMethodExtra,
      Record<string, never>
    >
  | AdapterType<
      DefaultRealtimeDBAdapterOptions,
      "set" | "update" | "remove",
      RealtimeDBStatuses,
      RealtimeDbDefaultExtra,
      Record<string, never>
    >;

export type RealtimeDbOnValueMethodExtra = {
  ref: Reference;
  snapshot: DataSnapshot;
};

export type RealtimeSocketAdapterType = SocketAdapterType<
  never,
  RealtimeDbOnValueMethodExtra,
  { onlyOnce?: boolean } & RealtimeDBQueryParams
>;

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
