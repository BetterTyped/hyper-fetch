/* eslint-disable max-params */
import { Database, get, push, query, ref, remove, set, update } from "firebase/database";
import { getAdapterBindings } from "@hyper-fetch/core";

import { RealtimeDBMethodsUnion, RealtimeDBStatuses } from "adapter/types";
import { mapRealtimeConstraint, getOrderedResultRealtime } from "./utils";
import { getStatus, isDocOrQuery } from "utils";
import {
  PermittedConstraints,
  RealtimeConstraintsUnion,
  RealtimePermittedMethods,
  SharedQueryConstraints,
} from "constraints";

type DataType = {
  constraints: PermittedConstraints<RealtimePermittedMethods, RealtimeConstraintsUnion | SharedQueryConstraints>[];
  payload: any;
  options: Record<string, any>;
};

export const getRealtimeDbBrowserMethods = ({
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

  return async (methodName: RealtimeDBMethodsUnion, data: DataType) => {
    try {
      onRequestStart();
      const { result, status, extra } = await methods[methodName](data);
      onRequestEnd();
      onResponseStart();
      onSuccess({ data: result, status: status as RealtimeDBStatuses, extra });
      onResponseEnd();
    } catch (error) {
      onRequestEnd();
      onResponseStart();
      onError({
        error,
        status: "error",
        // TODO - fix this
        // eslint-disable-next-line @typescript-eslint/ban-ts-comment
        // @ts-ignore
        extra: {},
      });
      onResponseEnd();
    }
  };
};
