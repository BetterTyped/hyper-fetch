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
): Record<RealtimeDBMethods, (data: { constraints: any[]; data: any }) => void> => {
  const [fullUrl] = url.split("?");
  const path = ref(database, fullUrl);
  const methods: Record<RealtimeDBMethods, (data) => void> = {
    onValue: async ({ constraints }: { constraints: any[] }) => {
      const params = constraints.map((constraint) => mapConstraint(constraint));
      const q = query(path, ...params);
      const unsub = onValue(q, (snapshot) => {
        try {
          const res = isDocOrQuery(fullUrl) === "doc" ? snapshot.val() : getOrderedResultRealtime(snapshot);
          const additionalData = { ref: path, snapshot, unsubscribe: unsub };
          const status = getStatus(res);
          setCacheManually(request, { value: res, status }, additionalData);
          onSuccess(res, status, additionalData, resolve);
        } catch (e) {
          const additionalData = { ref: path, snapshot, unsubscribe: unsub };
          setCacheManually(request, { value: e, status: "error" }, additionalData);
          onError(e, "error", additionalData, resolve);
        }
      });
    },
    get: async ({ constraints }) => {
      const params = constraints.map((constraint) => mapConstraint(constraint));
      const q = query(path, ...params);
      try {
        const snapshot = await get(q);
        const res = isDocOrQuery(fullUrl) === "doc" ? snapshot.val() : getOrderedResultRealtime(snapshot);
        const status = getStatus(res);
        onSuccess(res, status, { ref: path, snapshot }, resolve);
      } catch (e) {
        onError(e, "error", { ref: path, snapshot: null }, resolve);
      }
    },
    set: async ({ data }) => {
      try {
        // TODO - should the response be the data that has been set?
        await set(path, data);
        onSuccess(data, "success", { ref: path }, resolve);
      } catch (e) {
        onError(e, "error", { ref: path }, resolve);
      }
    },
    push: async ({ data }) => {
      try {
        const resRef = await push(path, data);
        onSuccess(null, "success", { ref: resRef, key: resRef.key }, resolve);
      } catch (e) {
        onError(e, "error", { ref: path }, resolve);
      }
    },
    update: async ({ data }) => {
      try {
        await update(path, data);
        onSuccess(null, "success", { ref: path }, resolve);
      } catch (e) {
        onError(e, "error", { ref: path }, resolve);
      }
    },
    remove: async () => {
      try {
        await remove(path);
        onSuccess(null, "success", { ref: path }, resolve);
      } catch (e) {
        onError(e, "error", { ref: path }, resolve);
      }
    },
  };
  return methods;
};
