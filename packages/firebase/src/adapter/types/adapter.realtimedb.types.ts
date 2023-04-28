import { BaseAdapterType } from "@hyper-fetch/core";
import { DatabaseReference, DataSnapshot, QueryConstraint, Unsubscribe } from "firebase/database";

export type RealtimeDbAdapterType =
  | BaseAdapterType<
      DefaultRealtimeDBAdapterOptions & { onlyOnce: boolean },
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
      RealtimeDBQueryParams
    >
  | BaseAdapterType<
      DefaultRealtimeDBAdapterOptions,
      "set" | "update" | "remove",
      RealtimeDBStatuses,
      RealtimeDbDefaultAdditionalData,
      RealtimeDBQueryParams
    >;

export type DefaultRealtimeDBAdapterOptions = {
  data?: string;
  filterBy?: QueryConstraint | QueryConstraint[];
  orderBy?: QueryConstraint | QueryConstraint[];
  refetch?: boolean; // For update / push / etc. ? Update returns void. Should we allow for an option that is 'update and refetch my data'?
  // TODO - only for onValue
  priority?: number;

  // Option for getting non sequential arrays as arrays https://firebase.blog/posts/2014/04/best-practices-arrays-in-firebase/
  // toArray?: boolean
};

export type RealtimeDBMethods = "set" | "push" | "update" | "get" | "remove" | "onValue";

export type RealtimeDBStatuses = "success" | "error";
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
  // "orderByChild" | "orderByKey" | "orderByValue";
  orderBy?: QueryConstraint;
  //   | "limitToFirst" | "limitToLast" | "startAt" | "startAfter" | "endAt" | "endBefore" | "equalTo";
  filterBy?: QueryConstraint[];
};
