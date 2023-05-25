import { Database, get, onValue, push, query, ref, remove, set, update } from "firebase/database";
import { RequestInstance } from "@hyper-fetch/core";

import { RealtimeDBMethods } from "adapter/types";
import { getOrderedResultRealtime } from "../realtime.utils";
import { getStatus, isDocOrQuery, setCacheManually } from "utils";
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
  const methods: Record<RealtimeDBMethods, (data) => void> = {
    onValue: async ({ constraints, options }: { constraints: any[]; options: Record<string, any> }) => {
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
  return methods;
};
