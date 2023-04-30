import {
  Database,
  DataSnapshot,
  get,
  onValue,
  push,
  query,
  QueryConstraint,
  ref,
  remove,
  set,
  update,
} from "firebase/database";
import { RequestInstance } from "@hyper-fetch/core";

import { RealtimeDBMethods } from "../types/adapter.realtimedb.types";
import { setCacheManually } from "../utils/set.cache.manually";

const getOrderedResult = (snapshot: DataSnapshot) => {
  const res = [];
  snapshot.forEach((child) => {
    res.push(child.val());
  });
  return res;
};

export const getRealtimeDBMethods = <R extends RequestInstance>(
  request: R,
  database: Database,
  url: string,
  onSuccess,
  onError,
  resolve,
): Record<
  RealtimeDBMethods,
  (data: { constraints: { filterBy?: QueryConstraint[]; orderBy?: QueryConstraint }; data: any }) => void
> => {
  const [fullUrl] = url.split("?");
  const path = ref(database, fullUrl);
  const methods: Record<RealtimeDBMethods, (data) => void> = {
    onValue: async ({
      constraints,
    }: {
      constraints: { filterBy: QueryConstraint[]; orderBy: QueryConstraint | null };
    }) => {
      const params = [...constraints.filterBy];
      if (constraints.orderBy) {
        params.push(constraints.orderBy);
      }
      const q = query(path, ...params);
      const unsub = onValue(q, (snapshot) => {
        try {
          const res = constraints.orderBy ? getOrderedResult(snapshot) : snapshot.val();
          const additionalData = { ref: path, snapshot, unsubscribe: unsub };
          setCacheManually(request, { value: res, status: "success" }, additionalData);
          onSuccess(res, "success", additionalData, resolve);
        } catch (e) {
          const additionalData = { ref: path, snapshot, unsubscribe: unsub };
          setCacheManually(request, { value: e, status: "error" }, additionalData);
          onError(e, "error", additionalData, resolve);
        }
      });
    },
    get: async ({ constraints }: { constraints: { filterBy: QueryConstraint[]; orderBy: QueryConstraint | null } }) => {
      const params = [...constraints.filterBy];
      if (constraints.orderBy) {
        params.push(constraints.orderBy);
      }
      const q = query(path, ...params);
      try {
        const snapshot = await get(q);
        const res = constraints.orderBy ? getOrderedResult(snapshot) : snapshot.val();
        onSuccess(res, "success", { ref: path, snapshot }, resolve);
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
