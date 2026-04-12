import type { SocketAdapter } from "@hyper-fetch/sockets";
import type { Reference, DataSnapshot } from "firebase-admin/database";

import type { RealtimeDBQueryParams, RealtimeDBStatuses } from "adapter/index";

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
