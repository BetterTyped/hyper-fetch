import { Database, get, onValue, push, query, QueryConstraint, ref, remove, set, update } from "firebase/database";

import { RealtimeDBMethods } from "../adapter.types";

export const getRealtimeDBMethods = (
  database: Database,
  url: string,
  onSuccess,
  onError,
  resolve,
): Record<RealtimeDBMethods, (data: { constraints: QueryConstraint[]; data: any }) => void> => {
  const path = ref(database, url);
  const methods: Record<RealtimeDBMethods, (data) => void> = {
    onValue: async (data: { constraints: QueryConstraint[]; data: any }) => {
      const q = query(path, ...data.constraints);
      const unsub = onValue(q, (snapshot) => {
        try {
          const res = snapshot.val();
          onSuccess(res, "success", { ref: path, snapshot, unsubscribe: unsub }, resolve);
        } catch (e) {
          onError(e, "error", { ref: path, snapshot: null, unsubscribe: unsub }, resolve);
        }
      });
    },
    get: async (data: { constraints: QueryConstraint[]; data: any }) => {
      const q = query(path, ...data.constraints);
      try {
        const snapshot = await get(q);
        onSuccess(snapshot.val(), "success", { ref: path, snapshot }, resolve);
      } catch (e) {
        onError(e, "error", { ref: path, snapshot: null }, resolve);
      }
    },
    set: async (data: any) => {
      try {
        // TODO - should the response be the data that has been set?
        await set(path, data);
        onSuccess(data, "success", { ref: path }, resolve);
      } catch (e) {
        onError(e, "error", { ref: path }, resolve);
      }
    },
    push: async (data: any) => {
      try {
        const resRef = await push(path, data);
        onSuccess(null, "success", { ref: resRef }, resolve);
      } catch (e) {
        onError(e, "error", { ref: path }, resolve);
      }
    },
    update: async (data: any) => {
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
