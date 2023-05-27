import { Database } from "firebase-admin/lib/database";
import { RequestInstance } from "@hyper-fetch/core";

import { applyConstraints } from "./realtime.admin.utils";
import { getStatus, isDocOrQuery, setCacheManually } from "../../utils";
import { getOrderedResultRealtime } from "realtime";

export const onValue =
  (request: RequestInstance, database: Database, url: string) =>
  async ({ constraints, options }: { constraints: any[]; options: Record<string, any> }) => {
    const [fullUrl] = url.split("?");
    const path = database.ref(fullUrl);
    const q = applyConstraints(path, constraints);
    const method = options?.onlyOnce === true ? "once" : "on";
    try {
      q[method]("value", (snapshot) => {
        const res = isDocOrQuery(fullUrl) === "doc" ? snapshot.val() : getOrderedResultRealtime(snapshot);
        const status = getStatus(res);
        const extra = { ref: path, snapshot, unsubscribe: () => q.off("value") };
        setCacheManually(request, { value: res, status }, extra);
        // onSuccess(res, status, extra, resolve);
      });
    } catch (e) {
      const extra = { ref: path, unsubscribe: () => q.off("value") };
      setCacheManually(request, { value: e, status: "error" }, extra);
      // onError(e, "error", extra, resolve);
    }
  };
