import { Database, get, push, query, ref, remove, set, update } from "firebase/database";
import { RequestInstance } from "@hyper-fetch/core";

import { RealtimeDBMethods } from "adapter/types";
import { getOrderedResultRealtime } from "../realtime.utils";
import { getStatus, isDocOrQuery } from "utils";
import { mapConstraint } from "./realtime.web.utils";

export const getRealtimeDBMethodsWeb = <R extends RequestInstance>(
  request: R,
  database: Database,
  url: string,
  onSuccess,
  onError,
  resolve,
  events: { onResponseStart; onRequestStart; onRequestEnd; onResponseEnd },
): Record<RealtimeDBMethods, (data: { constraints: any[]; data: any; options: Record<string, any> }) => void> => {
  const [fullUrl] = url.split("?");
  const path = ref(database, fullUrl);
  return {
    get: async ({ constraints }) => {
      const params = constraints.map((constraint) => mapConstraint(constraint));
      const q = query(path, ...params);
      try {
        events.onRequestStart();
        const snapshot = await get(q);
        events.onRequestEnd();
        events.onResponseStart();
        const res = isDocOrQuery(fullUrl) === "doc" ? snapshot.val() : getOrderedResultRealtime(snapshot);
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
        await set(path, data);
        events.onRequestEnd();
        events.onResponseStart();
        onSuccess(data, "success", { ref: path }, resolve);
      } catch (e) {
        events.onRequestEnd();
        events.onResponseStart();
        onError(e, "error", { ref: path }, resolve);
      }
      events.onResponseEnd();
    },
    push: async ({ data }) => {
      try {
        events.onRequestStart();
        const resRef = await push(path, data);
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
        await update(path, data);
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
        await remove(path);
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
