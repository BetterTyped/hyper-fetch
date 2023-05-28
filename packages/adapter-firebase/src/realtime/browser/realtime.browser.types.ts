import { SocketAdapterType } from "@hyper-fetch/sockets";

import { RealtimeDBQueryParams, RealtimeDbOnValueMethodExtra } from "adapter";

export type RealtimeSocketAdapterType = SocketAdapterType<
  never,
  RealtimeDbOnValueMethodExtra,
  { onlyOnce: boolean } & RealtimeDBQueryParams,
  never
>;
