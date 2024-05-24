import { SocketAdapterType } from "@hyper-fetch/sockets";
import { Reference, DataSnapshot } from "firebase-admin/database";

import { RealtimeDBQueryParams, RealtimeDBStatuses } from "adapter/index";

export type RealtimeAdminSocketAdapterType = SocketAdapterType<{
  options: never;
  extra: RealtimeAdminOnValueMethodExtra;
  listenerOptions: { onlyOnce?: boolean } & RealtimeDBQueryParams;
  emitterOptions: never;
}>;

export type RealtimeAdminOnValueMethodExtra = {
  ref: Reference;
  snapshot: DataSnapshot;
  status: RealtimeDBStatuses;
};
