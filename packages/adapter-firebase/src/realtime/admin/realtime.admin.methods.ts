import { Database } from "firebase-admin/database";
import { RequestInstance } from "@hyper-fetch/core";

import { RealtimeDBMethods } from "adapter/types";
import { getStatus, isDocOrQuery } from "utils";
import { getOrderedResultRealtime } from "../realtime.utils";
import { applyConstraints } from "./realtime.admin.utils";

export const getRealtimeDBMethodsAdmin = <R extends RequestInstance>(
  request: R,
  database: Database,
  url: string,
  onSuccess,
  onError,
  resolve,
  events: { onRequestStart; onResponseEnd; onResponseStart; onRequestEnd },
): ((
  methodName: RealtimeDBMethods,
  data: { constraints: any[]; data: any; options: Record<string, any> },
) => Promise<void>) => {
  const [fullUrl] = url.split("?");
  const path = database.ref(fullUrl);
  const methods = {
    get: async ({ constraints }) => {
      const docOrQuery = isDocOrQuery(fullUrl);
      const q = applyConstraints(path, constraints);
      const snapshot = await q.get();
      const res = docOrQuery === "doc" ? snapshot.val() : getOrderedResultRealtime(snapshot);
      const status = getStatus(res);
      return { result: res, status, extra: { ref: path, snapshot } };
    },
    set: async ({ data }) => {
      await path.set(data);
      return { result: data, status: "success", extra: { ref: path } };
    },
    push: async ({ data }) => {
      const resRef = await path.push(data);
      return { result: null, status: "success", extra: { ref: resRef, key: resRef.key } };
    },
    update: async ({ data }) => {
      await path.update(data);
      return { result: null, status: "success", extra: { ref: path } };
    },
    remove: async () => {
      await path.remove();
      return { result: null, status: "success", extra: { ref: path } };
    },
  };

  return async (methodName: RealtimeDBMethods, data) => {
    try {
      events.onRequestStart();
      const { result, status, extra } = await methods[methodName](data);
      events.onRequestEnd();
      events.onResponseStart();
      onSuccess(result, status, extra, resolve);
      events.onResponseEnd();
    } catch (e) {
      events.onRequestEnd();
      events.onResponseStart();
      onError(e, "error", {}, resolve);
      events.onResponseEnd();
    }
  };
};
