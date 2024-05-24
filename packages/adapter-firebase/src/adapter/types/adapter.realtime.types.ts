import { AdapterType } from "@hyper-fetch/core";
import { DatabaseReference, DataSnapshot } from "firebase/database";
import { SocketAdapterType } from "@hyper-fetch/sockets";

import {
  PermittedConstraints,
  RealtimeConstraintsUnion,
  RealtimePermittedMethods,
  SharedQueryConstraints,
} from "constraints";

export type RealtimeSocketAdapterType = SocketAdapterType<{
  options: never;
  extra: RealtimeDbOnValueMethodExtra;
  listenerOptions: { onlyOnce?: boolean } & RealtimeDBQueryParams;
}>;

export type RealtimeDbAdapterType =
  | AdapterType<{
      options: DefaultRealtimeDBAdapterOptions;
      method: "get";
      status: RealtimeDBStatuses;
      extra: RealtimeDbGetMethodExtra;
      queryParams: RealtimeDBQueryParams;
    }>
  | AdapterType<{
      options: DefaultRealtimeDBAdapterOptions;
      method: "push";
      status: RealtimeDBStatuses;
      extra: RealtimeDbPushMethodExtra;
      queryParams: Record<string, never>;
    }>
  | AdapterType<{
      options: DefaultRealtimeDBAdapterOptions;
      method: "set" | "update" | "remove";
      status: RealtimeDBStatuses;
      extra: RealtimeDbDefaultExtra;
      queryParams: Record<string, never>;
    }>;

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
