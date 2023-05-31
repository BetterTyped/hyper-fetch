import { SocketAdapterType } from "@hyper-fetch/sockets";
import { Reference, DataSnapshot } from "firebase-admin/lib/database";

import { RealtimeDBQueryParams, RealtimeDBStatuses } from "adapter";

export type RealtimeAdminSocketAdapterType = SocketAdapterType<
  never,
  RealtimeAdminOnValueMethodExtra,
  { onlyOnce: boolean } & RealtimeDBQueryParams,
  never
>;

export type RealtimeAdminOnValueMethodExtra = {
  ref: Reference;
  snapshot: DataSnapshot;
  status: RealtimeDBStatuses;
};
