/* eslint-disable max-params */
import { Database } from "firebase-admin/database";
import { getAdapterBindings, ResponseType } from "@hyper-fetch/core";

import { FirebaseAdminAdapterTypes, FirebaseAdminDBTypes, RealtimeDBMethodsUnion } from "adapter/types";
import { getStatus, isDocOrQuery } from "utils";
import { applyRealtimeAdminConstraints, getOrderedResultRealtime } from "realtime/index";
import {
  PermittedConstraints,
  RealtimeConstraintsUnion,
  RealtimePermittedMethods,
  SharedQueryConstraints,
} from "constraints";

export const getRealtimeDbAdminMethods = <T extends FirebaseAdminDBTypes>(
  database: Database,
  url: string,
  onSuccess: Awaited<ReturnType<typeof getAdapterBindings>>["onSuccess"],
  onError: Awaited<ReturnType<typeof getAdapterBindings>>["onError"],
  resolve: (
    value:
      | ResponseType<any, any, FirebaseAdminAdapterTypes<T>>
      | PromiseLike<ResponseType<any, any, FirebaseAdminAdapterTypes<T>>>,
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
    payload: any;
    options: Record<string, any>;
  },
) => Promise<void>) => {
  const [fullUrl] = url.split("?");
  const path = database.ref(fullUrl);
  const methods = {
    get: async ({ constraints = [] }) => {
      const docOrQuery = isDocOrQuery(fullUrl);
      const q = applyRealtimeAdminConstraints(path, constraints);
      const snapshot = await q.get();
      const res = docOrQuery === "doc" ? snapshot.val() : getOrderedResultRealtime(snapshot);
      const status = getStatus(res);
      return { result: res, status, extra: { ref: path, snapshot } };
    },
    set: async ({ data }: { data?: any }) => {
      await path.set(data);
      return { result: data, status: "success", extra: { ref: path } };
    },
    push: async ({ data }: { data?: any }) => {
      const resRef = await path.push(data);
      return { result: { ...data, __key: resRef.key }, status: "success", extra: { ref: resRef, key: resRef.key } };
    },
    update: async ({ data }: { data?: any }) => {
      await path.update(data);
      return { result: data, status: "success", extra: { ref: path } };
    },
    remove: async () => {
      await path.remove();
      return { result: null, status: "success", extra: { ref: path } };
    },
  };

  return async (methodName: RealtimeDBMethodsUnion, data) => {
    try {
      events.onRequestStart();
      const { result, status, extra } = await methods[methodName](data as any);
      events.onRequestEnd();
      events.onResponseStart();
      onSuccess({ data: result, status, extra, resolve });
      events.onResponseEnd();
    } catch (error) {
      events.onRequestEnd();
      events.onResponseStart();
      onError({ error, status: "error", extra: {}, resolve });
      events.onResponseEnd();
    }
  };
};
