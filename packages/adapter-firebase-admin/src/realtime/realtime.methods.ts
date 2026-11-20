import type { getAdapterBindings } from "@hyper-fetch/core";
import type { RealtimeDBMethodsUnion } from "adapter/types";
import type {
  PermittedConstraints,
  RealtimeConstraintsUnion,
  RealtimePermittedMethods,
  SharedQueryConstraints,
} from "constraints";
/* eslint-disable max-params */
import type { Database } from "firebase-admin/database";
import { applyRealtimeAdminConstraints, getOrderedResultRealtime } from "realtime/index";
import { getStatus, isDocOrQuery } from "utils";

type DataType = {
  constraints: PermittedConstraints<RealtimePermittedMethods, RealtimeConstraintsUnion | SharedQueryConstraints>[];
  payload: any;
  options: Record<string, any>;
};

export const getRealtimeDbAdminMethods = ({
  database,
  url,
  onSuccess,
  onError,
  onResponseStart,
  onRequestStart,
  onRequestEnd,
  onResponseEnd,
}: {
  database: Database;
  url: string;
  onSuccess: Awaited<ReturnType<typeof getAdapterBindings>>["onSuccess"];
  onError: Awaited<ReturnType<typeof getAdapterBindings>>["onError"];
  onResponseStart: Awaited<ReturnType<typeof getAdapterBindings>>["onResponseStart"];
  onRequestStart: Awaited<ReturnType<typeof getAdapterBindings>>["onRequestStart"];
  onRequestEnd: Awaited<ReturnType<typeof getAdapterBindings>>["onRequestEnd"];
  onResponseEnd: Awaited<ReturnType<typeof getAdapterBindings>>["onResponseEnd"];
}): ((methodName: RealtimeDBMethodsUnion, data: DataType) => Promise<void>) => {
  const [fullUrl] = url.split("?");
  const path = database.ref(fullUrl);
  const methods = {
    get: async ({ constraints = [] }: DataType) => {
      const docOrQuery = isDocOrQuery(fullUrl);
      const q = applyRealtimeAdminConstraints(path, constraints);
      const snapshot = await q.get();
      const res = docOrQuery === "doc" ? snapshot.val() : getOrderedResultRealtime(snapshot);
      const status = getStatus(res);
      return { result: res, status, extra: { ref: path, snapshot } };
    },
    set: async ({ payload }: DataType) => {
      await path.set(payload);
      return { result: payload, status: "success", extra: { ref: path } };
    },
    push: async ({ payload }: DataType) => {
      const resRef = await path.push(payload);
      return { result: { ...payload, __key: resRef.key }, status: "success", extra: { ref: resRef, key: resRef.key } };
    },
    update: async ({ payload }: DataType) => {
      await path.update(payload);
      return { result: payload, status: "success", extra: { ref: path } };
    },
    remove: async () => {
      await path.remove();
      return { result: null, status: "success", extra: { ref: path } };
    },
  };

  return async (methodName: RealtimeDBMethodsUnion, data: DataType) => {
    try {
      onRequestStart();
      const { result, status, extra } = await methods[methodName](data);
      onRequestEnd();
      onResponseStart();
      onSuccess({ data: result, status, extra });
      onResponseEnd();
    } catch (error) {
      onRequestEnd();
      onResponseStart();
      onError({ error, status: "error", extra: {} });
      onResponseEnd();
    }
  };
};
