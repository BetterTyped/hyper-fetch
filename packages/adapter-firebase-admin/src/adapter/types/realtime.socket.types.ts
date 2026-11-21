import type { SocketAdapter } from "@hyper-fetch/sockets";
import type { RealtimeDBListenerOptions, RealtimeDBListenerQueryParams, RealtimeDBStatuses } from "adapter/index";
import type { Reference, DataSnapshot } from "firebase-admin/database";

export type RealtimeAdminSocketAdapterType = SocketAdapter<
  any,
  RealtimeAdminOnValueMethodExtra,
  RealtimeDBListenerOptions,
  any,
  any,
  any,
  RealtimeDBListenerQueryParams
>;

export type RealtimeAdminOnValueMethodExtra = {
  ref: Reference;
  snapshot: DataSnapshot;
  status: RealtimeDBStatuses;
};
