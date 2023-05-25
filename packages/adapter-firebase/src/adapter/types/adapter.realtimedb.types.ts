import { AdapterType } from "@hyper-fetch/core";
import { DatabaseReference, DataSnapshot, Unsubscribe } from "firebase/database";

import { FirebaseQueryConstraints } from "constraints";

export type RealtimeDbAdapterType =
  | AdapterType<
      { onlyOnce: boolean },
      "onValue",
      RealtimeDBStatuses,
      RealtimeDbOnValueMethodExtra,
      RealtimeDBQueryParams
    >
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

export type DefaultRealtimeDBAdapterOptions = {
  priority?: number;
};

export type RealtimeDBMethods = "set" | "push" | "update" | "get" | "remove" | "onValue";

export type RealtimeDBStatuses = "success" | "error" | "emptyResource";
export type RealtimeDbOnValueMethodExtra = {
  ref: DatabaseReference;
  snapshot: DataSnapshot;
  unsubscribe: Unsubscribe;
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
  constraints?: { toString: () => string; type: FirebaseQueryConstraints; values: any[] }[];
};
