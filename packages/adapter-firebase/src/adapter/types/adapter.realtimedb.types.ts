import { BaseAdapterType } from "@hyper-fetch/core";
import { DatabaseReference, DataSnapshot, Unsubscribe } from "firebase/database";

import { FirebaseQueryConstraints } from "constraints";

export type RealtimeDbAdapterType =
  | BaseAdapterType<
      { onlyOnce: boolean },
      "onValue",
      RealtimeDBStatuses,
      RealtimeDbOnValueMethodAdditionalData,
      RealtimeDBQueryParams
    >
  | BaseAdapterType<
      DefaultRealtimeDBAdapterOptions,
      "get",
      RealtimeDBStatuses,
      RealtimeDbGetMethodAdditionalData,
      RealtimeDBQueryParams
    >
  | BaseAdapterType<
      DefaultRealtimeDBAdapterOptions,
      "push",
      RealtimeDBStatuses,
      RealtimeDbPushMethodAdditionalData,
      Record<string, never>
    >
  | BaseAdapterType<
      DefaultRealtimeDBAdapterOptions,
      "set" | "update" | "remove",
      RealtimeDBStatuses,
      RealtimeDbDefaultAdditionalData,
      Record<string, never>
    >;

export type DefaultRealtimeDBAdapterOptions = {
  priority?: number;
};

export type RealtimeDBMethods = "set" | "push" | "update" | "get" | "remove" | "onValue";

export type RealtimeDBStatuses = "success" | "error" | "emptyResource";
export type RealtimeDbOnValueMethodAdditionalData = {
  ref: DatabaseReference;
  snapshot: DataSnapshot;
  unsubscribe: Unsubscribe;
};

export type RealtimeDbGetMethodAdditionalData = {
  ref: DatabaseReference;
  snapshot: DataSnapshot;
};

export type RealtimeDbDefaultAdditionalData = {
  ref: DatabaseReference;
};

export type RealtimeDbPushMethodAdditionalData = {
  ref: DatabaseReference;
  key: string;
};

export type RealtimeDBQueryParams = {
  constraints?: { toString: () => string; type: FirebaseQueryConstraints; values: any[] }[];
};
