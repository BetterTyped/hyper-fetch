import type { SocketAdapter } from "@hyper-fetch/sockets";
import type { RealtimeDBListenerOptions, RealtimeDBStatuses } from "adapter/index";
import type { Reference, DataSnapshot } from "firebase-admin/database";

export type RealtimeAdminSocketAdapterType = SocketAdapter<
  any,
  RealtimeAdminOnValueMethodExtra,
  RealtimeDBListenerOptions,
  any
>;

export type RealtimeAdminOnValueMethodExtra = {
  ref: Reference;
  snapshot: DataSnapshot;
  status: RealtimeDBStatuses;
};
