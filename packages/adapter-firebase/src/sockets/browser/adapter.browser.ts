import { SocketAdapterType } from "@hyper-fetch/sockets";
import { Database } from "firebase-admin/database";

import { RealtimeDBMethods, RealtimeDBQueryParams, getRealtimeDBMethodsAdmin } from "realtime";

type Constraints = { constraints: any[]; options: Record<string, any> };

export const socketsAdminAdapter = (database: Database): SocketAdapterType => {
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
    listen: (listener, callback) => {
      const onlyOnce = options?.onlyOnce || false;
      const params = constraints.map((constraint) => mapConstraint(constraint));
      const q = query(path, ...params);
      let unsub;
      try {
        events.onRequestStart();
        unsub = onValue(
          q,
          (snapshot) => {
            events.onRequestEnd();
            events.onResponseStart();
            const res = isDocOrQuery(fullUrl) === "doc" ? snapshot.val() : getOrderedResultRealtime(snapshot);
            const extra = { ref: path, snapshot, unsubscribe: unsub };
            const status = getStatus(res);
            setCacheManually(request, { value: res, status }, extra);
            onSuccess(res, status, extra, resolve);
            events.onResponseEnd();
          },
          { onlyOnce },
        );
      } catch (e) {
        events.onRequestEnd();
        events.onResponseStart();
        const extra = { ref: path, snapshot: null, unsubscribe: unsub };
        setCacheManually(request, { value: e, status: "error" }, extra);
        onError(e, "error", extra, resolve);
        events.onResponseEnd();
      }
    },
    removeListener: (name, callback) => {},
    connect: () => undefined,
    reconnect: () => undefined,
    disconnect: () => undefined,
  };
};
