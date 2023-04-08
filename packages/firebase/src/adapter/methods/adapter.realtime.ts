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

import { RealtimeDBMethods } from "../adapter.types";

const getOrdered = (snapshot: DataSnapshot) => {
  const res = [];
  snapshot.forEach((child) => {
    res.push(child.val());
  });
  return res;
};

export const getRealtimeDBMethods = <DType, R extends RequestInstance>(
  request: R,
  database: Database,
  url: string,
  onSuccess,
  onError,
  resolve,
): Record<RealtimeDBMethods, (data: { constraints: QueryConstraint[]; data: DType }) => void> => {
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
          const res = constraints.orderBy ? getOrdered(snapshot) : snapshot.val();
          // TODO make util - setCacheManually - maybe infer current cache values for details?4
          // TODO CHECK WHAT HAPPENS WHEN MODIFIES DATA AND NO LONGER ARRAY
          request.client.cache.set(
            request,
            {
              data: res,
              status: "success",
              error: null,
              isSuccess: true,
              additionalData: { ref: path, snapshot },
            },
            {
              isSuccess: true,
              isCanceled: false,
              isOffline: false,
              retries: 0,
              timestamp: +new Date(),
            },
          );
          onSuccess(res, "success", { ref: path, snapshot, unsubscribe: unsub }, resolve);
        } catch (e) {
          onError(e, "error", { ref: path, snapshot: null, unsubscribe: unsub }, resolve);
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
        const res = constraints.orderBy ? getOrdered(snapshot) : snapshot.val();
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
