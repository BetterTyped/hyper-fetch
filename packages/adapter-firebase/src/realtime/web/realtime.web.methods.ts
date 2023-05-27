import { Database, get, push, query, ref, remove, set, update } from "firebase/database";
import { RequestInstance } from "@hyper-fetch/core";

import { RealtimeDBMethodsUnion } from "adapter/types";
import { getOrderedResultRealtime } from "realtime";
import { getStatus, isDocOrQuery } from "utils";
import { mapConstraint } from "./realtime.web.utils";
import {
  PermittedConstraints,
  RealtimeConstraintsUnion,
  RealtimePermittedMethods,
  SharedQueryConstraints,
} from "../../constraints";

export const getRealtimeDBMethodsWeb = <R extends RequestInstance>(
  request: R,
  database: Database,
  url: string,
  onSuccess,
  onError,
  resolve,
  events: { onResponseStart; onRequestStart; onRequestEnd; onResponseEnd },
): ((
  methodName: RealtimeDBMethodsUnion,
  data: {
    constraints: PermittedConstraints<RealtimePermittedMethods, RealtimeConstraintsUnion | SharedQueryConstraints>[];
    data: any;
    options: Record<string, any>;
  },
) => Promise<void>) => {
  const [fullUrl] = url.split("?");
  const path = ref(database, fullUrl);
  const methods = {
    get: async ({ constraints = [] }: { constraints?: any[] }) => {
      const params = constraints.map((constraint) => mapConstraint(constraint));
      const q = query(path, ...params);
      const snapshot = await get(q);
      const res = isDocOrQuery(fullUrl) === "doc" ? snapshot.val() : getOrderedResultRealtime(snapshot);
      const status = getStatus(res);
      return { result: res, status, extra: { ref: path, snapshot } };
    },
    set: async ({ data }: { data?: any }) => {
      await set(path, data);
      return { result: data, status: "success", extra: { ref: path } };
    },
    push: async ({ data }: { data?: any }) => {
      const resRef = await push(path, data);
      return { result: data, status: "success", extra: { ref: resRef, key: resRef.key } };
    },
    update: async ({ data }: { data?: any }) => {
      await update(path, data);
      return { result: data, status: "success", extra: { ref: path } };
    },
    remove: async () => {
      await remove(path);
      return { result: null, status: "success", extra: { ref: path } };
    },
  };

  return async (methodName: RealtimeDBMethodsUnion, data) => {
    try {
      events.onRequestStart();
      const { result, status, extra } = await methods[methodName](data);
      events.onRequestEnd();
      events.onResponseStart();
      onSuccess(result, status, extra, resolve);
      events.onResponseEnd();
    } catch (e) {
      events.onRequestEnd();
      events.onResponseStart();
      onError(e, "error", {}, resolve);
      events.onResponseEnd();
    }
  };
};
