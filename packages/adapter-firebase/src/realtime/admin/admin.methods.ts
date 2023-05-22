import { Database, Reference } from "firebase-admin/database";
import { RequestInstance } from "@hyper-fetch/core";

import { RealtimeDBMethods, getOrderedResultRealtime } from "realtime";
import { FirebaseQueryConstraints } from "constraints";
import { getStatus, isDocOrQuery, setCacheManually } from "utils";

const applyConstraint = (ref: Reference, { type, values }: { type: FirebaseQueryConstraints; values: any[] }) => {
  switch (type) {
    case FirebaseQueryConstraints.ORDER_BY_CHILD: {
      const [value] = values;
      return ref.orderByChild(value);
    }
    case FirebaseQueryConstraints.ORDER_BY_KEY: {
      return ref.orderByKey();
    }
    case FirebaseQueryConstraints.ORDER_BY_VALUE: {
      return ref.orderByValue();
    }
    case FirebaseQueryConstraints.START_AT: {
      const [[value]] = values;
      return ref.startAt(value);
    }
    case FirebaseQueryConstraints.START_AFTER: {
      const [[value]] = values;
      return ref.startAfter(value);
    }
    case FirebaseQueryConstraints.END_AT: {
      const [[value]] = values;
      return ref.endAt(value);
    }
    case FirebaseQueryConstraints.END_BEFORE: {
      const [[value]] = values;
      return ref.endBefore(value);
    }
    case FirebaseQueryConstraints.LIMIT_TO_FIRST: {
      const [value] = values;
      return ref.limitToFirst(value);
    }
    case FirebaseQueryConstraints.LIMIT_TO_LAST: {
      const [value] = values;
      return ref.limitToLast(value);
    }
    case FirebaseQueryConstraints.EQUAL_TO: {
      const [value] = values;
      return ref.equalTo(value);
    }
    default:
      throw new Error(`Unknown method ${type}`);
  }
};

const applyConstraints = (ref: Reference, constraints: { type: FirebaseQueryConstraints; values: any[] }[]) => {
  return constraints.reduce((collection, constraint) => {
    return applyConstraint(collection, constraint);
  }, ref);
};

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
  const methods: Record<RealtimeDBMethods, (data) => void> = {
    onValue: async ({ constraints, options }: { constraints: any[]; options: Record<string, any> }) => {
      const q = applyConstraints(path, constraints);
      const method = options?.onlyOnce === true ? "once" : "on";
      events.onRequestStart();
      try {
        q[method]("value", (snapshot) => {
          events.onRequestEnd();
          events.onResponseStart();
          const res = isDocOrQuery(fullUrl) === "doc" ? snapshot.val() : getOrderedResultRealtime(snapshot);
          const status = getStatus(res);
          const extra = { ref: path, snapshot, unsubscribe: () => q.off("value") };
          setCacheManually(request, { value: res, status }, extra);
          onSuccess(res, status, extra, resolve);
          events.onResponseEnd();
        });
      } catch (e) {
        const extra = { ref: path, unsubscribe: () => q.off("value") };
        setCacheManually(request, { value: e, status: "error" }, extra);
        onError(e, "error", extra, resolve);
        events.onResponseEnd();
      }
    },
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
  return methods;
};
