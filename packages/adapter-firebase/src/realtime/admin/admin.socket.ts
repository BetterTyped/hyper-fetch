import { SocketAdapterType } from "@hyper-fetch/sockets";
import { Database } from "firebase-admin/database";

import { RealtimeDBMethods, RealtimeDBQueryParams, applyConstraint, getRealtimeDBMethodsAdmin } from "realtime";

export const realtimeAdminAdapter = (database: Database): SocketAdapterType => {
  const listeners = new Map();

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

  const listen: SocketAdapterType["listen"] = (listener, callback) => {
    listeners.set(listener, callback);
    const { options } = listener;
    // onValue: async ({ constraints, options }: { constraints: any[]; options: Record<string, any> }) => {
    const query = applyConstraint(listener.name, query);
    const method = options?.onlyOnce === true ? "once" : "on";
    try {
      query[method]("value", (snapshot) => {
        const res = isDocOrQuery(fullUrl) === "doc" ? snapshot.val() : getOrderedResultRealtime(snapshot);
        const status = getStatus(res);
        const extra = { ref: path, snapshot, unsubscribe: () => q.off("value") };
      });
    } catch (e) {
      const extra = { ref: path, unsubscribe: () => q.off("value") };
    }
    // },
  };

  return {
    connecting: false,
    listeners: new Map(),
    emit: (_, emitter, ack) => {},
    listen,
    removeListener: (name, callback) => {},
    connect: () => undefined,
    reconnect: () => undefined,
    disconnect: () => undefined,
  };
};
