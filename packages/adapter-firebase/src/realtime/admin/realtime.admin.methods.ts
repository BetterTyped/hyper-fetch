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
): Record<RealtimeDBMethods, (data: { constraints: any[]; data: any; options: Record<string, any> }) => void> => {
  const [fullUrl] = url.split("?");
  const path = database.ref(fullUrl);
  return {
    get: async ({ constraints }) => {
      try {
        events.onRequestStart();
        const docOrQuery = isDocOrQuery(fullUrl);
        const q = applyConstraints(path, constraints);
        const snapshot = await q.get();
        events.onRequestEnd();
        events.onResponseStart();
        const res = docOrQuery === "doc" ? snapshot.val() : getOrderedResultRealtime(snapshot);
        const status = getStatus(res);
        onSuccess(res, status, { ref: path, snapshot }, resolve);
      } catch (e) {
        events.onRequestEnd();
        events.onResponseStart();
        onError(e, "error", { ref: path, snapshot: null }, resolve);
      }
      events.onResponseEnd();
    },
    set: async ({ data }) => {
      try {
        events.onRequestStart();
        await path.set(data);
        events.onRequestEnd();
        events.onResponseStart();
        onSuccess(data, "success", { ref: path }, resolve);
      } catch (e) {
        onError(e, "error", { ref: path }, resolve);
      }
      events.onResponseEnd();
    },
    push: async ({ data }) => {
      try {
        events.onRequestStart();
        const resRef = await path.push(data);
        events.onRequestEnd();
        events.onResponseStart();
        onSuccess(null, "success", { ref: resRef, key: resRef.key }, resolve);
      } catch (e) {
        events.onRequestEnd();
        events.onResponseStart();
        onError(e, "error", { ref: path }, resolve);
      }
      events.onResponseEnd();
    },
    update: async ({ data }) => {
      try {
        events.onRequestStart();
        await path.update(data);
        events.onRequestEnd();
        events.onResponseStart();
        onSuccess(null, "success", { ref: path }, resolve);
      } catch (e) {
        events.onRequestEnd();
        events.onResponseStart();
        onError(e, "error", { ref: path }, resolve);
      }
      events.onResponseEnd();
    },
    remove: async () => {
      try {
        events.onRequestStart();
        await path.remove();
        events.onRequestEnd();
        events.onResponseStart();
        onSuccess(null, "success", { ref: path }, resolve);
      } catch (e) {
        events.onRequestEnd();
        events.onResponseStart();
        onError(e, "error", { ref: path }, resolve);
      }
      events.onResponseEnd();
    },
  };
};
