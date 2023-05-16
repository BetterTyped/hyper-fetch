import {
  Database,
  get,
  onValue,
  push,
  query,
  ref,
  remove,
  set,
  update,
  orderByChild,
  orderByKey,
  orderByValue,
  startAt,
  startAfter,
  endAt,
  endBefore,
  equalTo,
  limitToFirst,
  limitToLast,
} from "firebase/database";
import { RequestInstance } from "@hyper-fetch/core";

import { RealtimeDBMethods } from "adapter/types";
import { FirebaseQueryConstraints } from "constraints";
import { getOrderedResultRealtime } from "./utils/utils.realtime";
import { getStatus, isDocOrQuery, setCacheManually } from "./utils/utils.base";

const mapConstraint = ({ type, values }: { type: FirebaseQueryConstraints; values: any[] }) => {
  switch (type) {
    case FirebaseQueryConstraints.ORDER_BY_CHILD: {
      const [value] = values;
      return orderByChild(value);
    }
    case FirebaseQueryConstraints.ORDER_BY_KEY: {
      return orderByKey();
    }
    case FirebaseQueryConstraints.ORDER_BY_VALUE: {
      return orderByValue();
    }
    case FirebaseQueryConstraints.START_AT: {
      const [[value]] = values;
      return startAt(value);
    }
    case FirebaseQueryConstraints.START_AFTER: {
      const [[value]] = values;
      return startAfter(value);
    }
    case FirebaseQueryConstraints.END_AT: {
      const [[value]] = values;
      return endAt(value);
    }
    case FirebaseQueryConstraints.END_BEFORE: {
      const [[value]] = values;
      return endBefore(value);
    }
    case FirebaseQueryConstraints.LIMIT_TO_FIRST: {
      const [value] = values;
      return limitToFirst(value);
    }
    case FirebaseQueryConstraints.LIMIT_TO_LAST: {
      const [value] = values;
      return limitToLast(value);
    }
    case FirebaseQueryConstraints.EQUAL_TO: {
      const [value] = values;
      return equalTo(value);
    }
    default:
      throw new Error(`Unknown method ${type}`);
  }
};

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
          },
          { onlyOnce },
        );
      } catch (e) {
        events.onRequestEnd();
        events.onResponseStart();
        const extra = { ref: path, snapshot: null, unsubscribe: unsub };
        setCacheManually(request, { value: e, status: "error" }, extra);
        onError(e, "error", extra, resolve);
      }
      events.onResponseEnd();
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
