import { SocketAdapterType } from "@hyper-fetch/sockets";
import { Database } from "firebase-admin/database";

import { RealtimeDBMethods, RealtimeDBQueryParams, getRealtimeDBMethodsAdmin } from "realtime";

export const socketsAdminAdapter = (database: Database): SocketAdapterType => {
  const {
    method = "onValue",
    queryParams,
    data,
    options,
  }: { method: RealtimeDBMethods; queryParams: RealtimeDBQueryParams; data; options } = request;

  return {
    connecting: false,
    listeners: new Map(),
    emit: (eventMessageId, emitter, ack) => {},
    listen: (listener, callback) => {},
    removeListener: (name, callback) => {},
    connect: () => undefined,
    reconnect: () => undefined,
    disconnect: () => undefined,
  };
};
