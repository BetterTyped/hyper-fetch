import { SocketAdapter } from "@hyper-fetch/sockets";
import { Reference, DataSnapshot } from "firebase-admin/database";

import { RealtimeDBQueryParams, RealtimeDBStatuses } from "adapter/index";

export type RealtimeAdminSocketAdapterType = SocketAdapter<
  any,
  RealtimeAdminOnValueMethodExtra,
  { onlyOnce?: boolean } & RealtimeDBQueryParams,
  any
>;

export type RealtimeAdminOnValueMethodExtra = {
  ref: Reference;
  snapshot: DataSnapshot;
  status: RealtimeDBStatuses;
};
