import { onValue as _onValue, query, Database, ref } from "firebase/database";
import { RequestInstance } from "@hyper-fetch/core";

import { mapConstraint } from "./realtime.web.utils";
import { getStatus, isDocOrQuery, setCacheManually } from "../../utils";
import { getOrderedResultRealtime } from "../realtime.utils";

export const onValue =
  (request: RequestInstance, database: Database, url: string) =>
  async ({ constraints, options }: { constraints: any[]; options: Record<string, any> }) => {
    const [fullUrl] = url.split("?");
    const path = ref(database, fullUrl);
    const onlyOnce = options?.onlyOnce || false;
    const params = constraints.map((constraint) => mapConstraint(constraint));
    const q = query(path, ...params);
    let unsub;
    try {
      unsub = _onValue(
        q,
        (snapshot) => {
          const res = isDocOrQuery(fullUrl) === "doc" ? snapshot.val() : getOrderedResultRealtime(snapshot);
          const extra = { ref: path, snapshot, unsubscribe: unsub };
          const status = getStatus(res);
          setCacheManually(request, { value: res, status }, extra);
          // onSuccess(res, status, extra, resolve);
        },
        { onlyOnce },
      );
    } catch (e) {
      const extra = { ref: path, snapshot: null, unsubscribe: unsub };
      setCacheManually(request, { value: e, status: "error" }, extra);
      // onError(e, "error", extra, resolve);
    }
  };
