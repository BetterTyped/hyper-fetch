import { SocketAdapterType } from "@hyper-fetch/sockets";
import { Database } from "firebase/database";

import { RealtimeDBMethods, RealtimeDBQueryParams } from "realtime/types";
import { getRealtimeDBMethodsWeb } from "./browser.methods";

export const realtimeAdapter = (database: Database): SocketAdapterType => {
  const {
    method = "onValue",
    queryParams,
    data,
    options,
  }: { method: RealtimeDBMethods; queryParams: RealtimeDBQueryParams; data; options } = request;
  const availableMethods = getRealtimeDBMethodsWeb(request, database, fullUrl, onSuccess, onError, resolve, {
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
    listeners: new Map(), // map with active subscriptions
    emit: (eventMessageId, emitter, ack) => {},
    listen: (listener, callback) => {},
    removeListener: (name, callback) => {}, // remove stored subscription
    connect: () => undefined, // Firebase.goOnline() ??
    reconnect: () => undefined, // Firebase.goOnline() ??
    disconnect: () => undefined, // firebaseRef.off();
  };
};
