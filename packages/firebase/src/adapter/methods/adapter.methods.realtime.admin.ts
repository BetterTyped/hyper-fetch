import { Database, DataSnapshot, Reference } from "firebase-admin/database";
import { RequestInstance } from "@hyper-fetch/core";

import { RealtimeDBMethods } from "../types/adapter.realtimedb.types";
import { setCacheManually } from "../utils/set.cache.manually";
import { FirebaseQueryConstraints } from "../constraints/constraints.firebase";

const isDocOrQuery = (fullUrl: string): string => {
  const withoutSurroundingSlashes = fullUrl.replace(/^\/|\/$/g, "");
  const pathElements = withoutSurroundingSlashes.split("/").length;
  return pathElements % 2 === 0 ? "doc" : "query";
};
const getOrderedResult = (snapshot: DataSnapshot) => {
  const res = [];
  snapshot.forEach((child) => {
    res.push(child.val());
  });
  return res;
};

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
): Record<RealtimeDBMethods, (data: { constraints: any[]; data: any }) => void> => {
  const [fullUrl] = url.split("?");
  const path = database.ref(fullUrl);
  const methods: Record<RealtimeDBMethods, (data) => void> = {
    onValue: async ({ constraints }: { constraints: any[] }) => {
      const q = applyConstraints(path, constraints);
      q.on("value", (snapshot) => {
        try {
          const res = getOrderedResult(snapshot);
          const additionalData = { ref: path, snapshot, unsubscribe: () => q.off("value") };
          setCacheManually(request, { value: res, status: "success" }, additionalData);
          onSuccess(res, "success", additionalData, resolve);
        } catch (e) {
          const additionalData = { ref: path, snapshot, unsubscribe: () => q.off("value") };
          setCacheManually(request, { value: e, status: "error" }, additionalData);
          onError(e, "error", additionalData, resolve);
        }
      });
    },
    get: async () => {
      try {
        const docOrQuery = isDocOrQuery(fullUrl);
        const snapshot = await path.get();
        const res = docOrQuery === "doc" ? snapshot.val() : getOrderedResult(snapshot);
        onSuccess(res, "success", { ref: path, snapshot }, resolve);
      } catch (e) {
        onError(e, "error", { ref: path, snapshot: null }, resolve);
      }
    },
    set: async ({ data }) => {
      try {
        // TODO - should the response be the data that has been set?
        await path.set(data);
        onSuccess(data, "success", { ref: path }, resolve);
      } catch (e) {
        onError(e, "error", { ref: path }, resolve);
      }
    },
    push: async ({ data }) => {
      try {
        const resRef = await path.push(data);
        onSuccess(null, "success", { ref: resRef, key: resRef.key }, resolve);
      } catch (e) {
        onError(e, "error", { ref: path }, resolve);
      }
    },
    update: async ({ data }) => {
      try {
        await path.update(data);
        onSuccess(null, "success", { ref: path }, resolve);
      } catch (e) {
        onError(e, "error", { ref: path }, resolve);
      }
    },
    remove: async () => {
      try {
        await path.remove();
        onSuccess(null, "success", { ref: path }, resolve);
      } catch (e) {
        onError(e, "error", { ref: path }, resolve);
      }
    },
  };
  return methods;
};
