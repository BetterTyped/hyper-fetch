import { SocketAdapterType } from "@hyper-fetch/sockets";
import { Database } from "firebase-admin/database";

import { RealtimeDBMethods, RealtimeDBQueryParams, getRealtimeDBMethodsAdmin } from "realtime";

export const realtimeAdapter = (database: Database): SocketAdapterType => {
  const {
    method = "onValue",
    queryParams,
    data,
    options,
  }: { method: RealtimeDBMethods; queryParams: RealtimeDBQueryParams; data; options } = request;
  const availableMethods = getRealtimeDBMethodsAdmin(request, database, fullUrl, onSuccess, onError, resolve, {
    onRequestStart,
    onResponseEnd,
    onResponseStart,
    onRequestEnd,
  });
  const selectedMethod = availableMethods[method];
  if (!selectedMethod) {
    throw new Error(`Cannot find method ${method} in Realtime database available methods.`);
  }
  selectedMethod({
    constraints: queryParams?.constraints ? queryParams.constraints : [],
    options,
    data,
  });

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
