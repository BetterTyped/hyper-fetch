/* eslint-disable max-params */
import { Database, get, push, query, ref, remove, set, update } from "firebase/database";
import { getAdapterBindings, ResponseType } from "@hyper-fetch/core";

import { FirebaseAdapterTypes, FirebaseDBTypes, RealtimeDBMethodsUnion } from "adapter/types";
import { mapRealtimeConstraint, getOrderedResultRealtime } from "./utils";
import { getStatus, isDocOrQuery } from "utils";
import {
  PermittedConstraints,
  RealtimeConstraintsUnion,
  RealtimePermittedMethods,
  SharedQueryConstraints,
} from "constraints";

export const getRealtimeDbBrowserMethods = <T extends FirebaseDBTypes>(
  database: Database,
  url: string,
  onSuccess: Awaited<ReturnType<typeof getAdapterBindings>>["onSuccess"],
  onError: Awaited<ReturnType<typeof getAdapterBindings>>["onError"],
  resolve: (
    value:
      | ResponseType<any, any, FirebaseAdapterTypes<T>>
      | PromiseLike<ResponseType<any, any, FirebaseAdapterTypes<T>>>,
  ) => void,
  events: {
    onResponseStart: Awaited<ReturnType<typeof getAdapterBindings>>["onResponseStart"];
    onRequestStart: Awaited<ReturnType<typeof getAdapterBindings>>["onRequestStart"];
    onRequestEnd: Awaited<ReturnType<typeof getAdapterBindings>>["onRequestEnd"];
    onResponseEnd: Awaited<ReturnType<typeof getAdapterBindings>>["onResponseEnd"];
  },
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
    get: async ({
      constraints = [],
    }: {
      constraints?: PermittedConstraints<RealtimePermittedMethods, RealtimeConstraintsUnion | SharedQueryConstraints>[];
    }) => {
      const params = constraints.map((constraint) => mapRealtimeConstraint(constraint));
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
      return { result: { ...data, __key: resRef.key }, status: "success", extra: { ref: resRef, key: resRef.key } };
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
